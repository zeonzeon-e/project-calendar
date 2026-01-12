import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3035;
const DATA_FILE = path.join(__dirname, 'projects.json');
const TODO_FILE = path.join(__dirname, 'todos.json');

app.use(cors());
app.use(bodyParser.json());

interface Project {
    id: string;
    projectNumber: string;
    title: string;
    webAppPeriodStart: string;
    webAppPeriodEnd: string;
    fieldWorkPeriodStart: string;
    fieldWorkPeriodEnd: string;
    endDate: string;
    remarks: string;
    isWebAppFinished: boolean;
    isFieldWorkStarted: boolean;
    status: 'active' | 'finished';
    finishedAt?: string;
    frequency?: string;
    parentId?: string;
}

interface Todo {
    id: string;
    title: string;
    importance: number;
    content?: string;
    deadline?: string;
    frequency?: string;
    date: string;
    isFinished: boolean;
    parentId?: string;
}

// Helper functions
const readProjects = (): Project[] => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); } catch { return []; }
};

const readTodos = (): Todo[] => {
    if (!fs.existsSync(TODO_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(TODO_FILE, 'utf-8')); } catch { return []; }
};

const writeProjects = (projects: Project[]) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
};

const writeTodos = (todos: Todo[]) => {
    fs.writeFileSync(TODO_FILE, JSON.stringify(todos, null, 2));
};

// --- Recurring Logic Helpers ---

const addDays = (dateStr: string, days: number): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const addMonths = (dateStr: string, months: number): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
};

const addYears = (dateStr: string, years: number): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().split('T')[0];
};

const getNextDate = (dateStr: string, frequency: string): string => {
    switch (frequency) {
        case '매일': return addDays(dateStr, 1);
        case '매주': return addDays(dateStr, 7);
        case '매월': return addMonths(dateStr, 1);
        case '매년': return addYears(dateStr, 1);
        default: return dateStr;
    }
};

const generateRecurringProjects = (projects: Project[]) => {
    const originalProjects = projects.filter(p => p.frequency && !p.parentId && p.status === 'active');
    const now = new Date();
    // Generate up to end of next month
    const targetEndDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); 
    
    let added = false;

    originalProjects.forEach(origin => {
        let currentDateStr = origin.webAppPeriodStart;
        let nextDateStr = getNextDate(currentDateStr, origin.frequency!);
        
        // Loop until target date
        while (new Date(nextDateStr) <= targetEndDate) {
            // Check existence
            const exists = projects.some(p => p.parentId === origin.id && p.webAppPeriodStart === nextDateStr);
            
            if (!exists) {
                // Calculate offset for other dates
                const startObj = new Date(origin.webAppPeriodStart);
                const nextObj = new Date(nextDateStr);
                const diffTime = nextObj.getTime() - startObj.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                const newProject: Project = {
                    ...origin,
                    id: uuidv4(),
                    parentId: origin.id,
                    frequency: undefined, // Children don't recurse themselves
                    webAppPeriodStart: nextDateStr,
                    webAppPeriodEnd: addDays(origin.webAppPeriodEnd, diffDays),
                    fieldWorkPeriodStart: addDays(origin.fieldWorkPeriodStart, diffDays),
                    fieldWorkPeriodEnd: addDays(origin.fieldWorkPeriodEnd, diffDays),
                    endDate: addDays(origin.endDate, diffDays),
                    isWebAppFinished: false,
                    isFieldWorkStarted: false,
                    status: 'active'
                };
                projects.push(newProject);
                added = true;
            }
            
            currentDateStr = nextDateStr;
            nextDateStr = getNextDate(currentDateStr, origin.frequency!);
        }
    });

    return { projects, added };
};

const generateRecurringTodos = (todos: Todo[]) => {
    const originalTodos = todos.filter(t => t.frequency && !t.parentId && !t.isFinished);
    const now = new Date();
    const targetEndDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); 

    let added = false;

    originalTodos.forEach(origin => {
        let currentDateStr = origin.date;
        let nextDateStr = getNextDate(currentDateStr, origin.frequency!);

        while (new Date(nextDateStr) <= targetEndDate) {
            const exists = todos.some(t => t.parentId === origin.id && t.date === nextDateStr);

            if (!exists) {
                const diffDays = (new Date(nextDateStr).getTime() - new Date(origin.date).getTime()) / (1000 * 3600 * 24);
                
                const newTodo: Todo = {
                    ...origin,
                    id: uuidv4(),
                    parentId: origin.id,
                    frequency: undefined,
                    date: nextDateStr,
                    deadline: origin.deadline ? addDays(origin.deadline, diffDays) : undefined,
                    isFinished: false
                };
                todos.push(newTodo);
                added = true;
            }

            currentDateStr = nextDateStr;
            nextDateStr = getNextDate(currentDateStr, origin.frequency!);
        }
    });

    return { todos, added };
};

// --- End Recurring Logic ---


app.get('/projects', (req, res) => {
    res.json(readProjects());
});

app.get('/todos', (req, res) => {
    res.json(readTodos());
});

app.post('/projects', (req, res) => {
    let projects = readProjects();
    const newProject: Project = {
        id: uuidv4(),
        ...req.body,
        status: 'active',
    };
    projects.push(newProject);
    
    // Check recurrence immediately
    const result = generateRecurringProjects(projects);
    writeProjects(result.projects);
    
    res.json(newProject);
});

app.post('/todos', (req, res) => {
    let todos = readTodos();
    const newTodo: Todo = {
        id: uuidv4(),
        ...req.body,
        isFinished: false,
    };
    todos.push(newTodo);
    
    // Check recurrence immediately
    const result = generateRecurringTodos(todos);
    writeTodos(result.todos);

    res.json(newTodo);
});

app.put('/projects/:id', (req, res) => {
    let projects = readProjects();
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        let updatedProject = { ...projects[index], ...req.body };
        if (updatedProject.status === 'finished' && !updatedProject.finishedAt) {
            updatedProject.finishedAt = new Date().toISOString();
        }
        projects[index] = updatedProject;
        
        // If frequency changed/added, regenerate
        if (req.body.frequency || req.body.webAppPeriodStart) {
            const result = generateRecurringProjects(projects);
            projects = result.projects;
        }

        writeProjects(projects);
        res.json(updatedProject);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
});

app.put('/todos/:id', (req, res) => {
    let todos = readTodos();
    const index = todos.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        todos[index] = { ...todos[index], ...req.body };
        
        // If frequency changed/added, regenerate
        if (req.body.frequency || req.body.date) {
            const result = generateRecurringTodos(todos);
            todos = result.todos;
        }

        writeTodos(todos);
        res.json(todos[index]);
    } else {
        res.status(404).json({ message: 'Todo not found' });
    }
});

app.delete('/projects/:id', (req, res) => {
    let projects = readProjects();
    // Optional: Delete children if parent is deleted?
    // User requirement doesn't specify. For safety, just delete the target.
    // But if parent is deleted, recurrence stops.
    // If we want to delete all future instances:
    // projects = projects.filter(p => p.id !== req.params.id && p.parentId !== req.params.id);
    
    projects = projects.filter(p => p.id !== req.params.id);
    writeProjects(projects);
    res.json({ message: 'Deleted successfully' });
});

app.delete('/todos/:id', (req, res) => {
    let todos = readTodos();
    todos = todos.filter(t => t.id !== req.params.id);
    writeTodos(todos);
    res.json({ message: 'Deleted successfully' });
});

// CRON JOB
cron.schedule('0 * * * *', () => {
    console.log('Running cleanup & recurrence task...');
    
    // 1. Cleanup old projects
    let projects = readProjects();
    const now = new Date();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    
    const initialProjCount = projects.length;
    projects = projects.filter(p => {
        if (p.status === 'finished' && p.finishedAt) {
            const finishedDate = new Date(p.finishedAt);
            if (now.getTime() - finishedDate.getTime() > THREE_DAYS_MS) return false;
        }
        return true;
    });

    // 2. Carry over unfinished todos (Only for NON-recurring instances or parent instances?
    // Requirement: "오늘 안에 끝내지 않았다면 자동으로 다음날로 전달"
    // Apply to all unfinished todos.
    let todos = readTodos();
    const todayStr = now.toISOString().split('T')[0];
    let todoUpdated = false;

    todos = todos.map(todo => {
        if (!todo.isFinished && todo.date < todayStr) {
            // If it's a recurring instance (child), we might just move it.
            // But if it's a recurring PARENT, moving the date might mess up the interval calculation?
            // "Recurring parent" serves as a template. If we move its date, the next interval shifts.
            // Usually, recurring tasks: "Check if done today. If not, show as overdue".
            // Requirement says "Carry over to next day".
            // If we physically change 'date', it moves to tomorrow.
            console.log(`Carrying over todo: ${todo.tag} (${todo.id}) to ${todayStr}`);
            todo.date = todayStr;
            todoUpdated = true;
        }
        return todo;
    });

    // 3. Generate Recurring Instances (for next month window)
    const projGen = generateRecurringProjects(projects);
    if (projGen.added || projects.length !== initialProjCount) {
        writeProjects(projGen.projects);
        console.log('Projects updated (Cleanup/Recurrence)');
    }

    const todoGen = generateRecurringTodos(todos);
    if (todoGen.added || todoUpdated) {
        writeTodos(todoGen.todos);
        console.log('Todos updated (Carry-over/Recurrence)');
    }
});

// Startup Check
setTimeout(() => {
    console.log('Running startup check...');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let todos = readTodos();
    let todoUpdated = false;
    todos = todos.map(todo => {
        if (!todo.isFinished && todo.date < todayStr) {
            todo.date = todayStr;
            todoUpdated = true;
        }
        return todo;
    });

    let projects = readProjects();
    
    const projGen = generateRecurringProjects(projects);
    if (projGen.added) writeProjects(projGen.projects);

    const todoGen = generateRecurringTodos(todos);
    if (todoGen.added || todoUpdated) writeTodos(todoGen.todos);

}, 1000);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});