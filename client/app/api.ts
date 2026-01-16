import { Project, Todo } from './types';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3002';

// --- API Helpers ---
const fetchProjects = async (): Promise<Project[]> => {
    const res = await fetch(`${BASE_URL}/api/data/projects`, { cache: 'no-store' });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch Projects Error: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to fetch projects: ${res.status} ${res.statusText}`);
    }
    return res.json();
};

const saveProjects = async (projects: Project[]) => {
    const res = await fetch(`${BASE_URL}/api/data/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projects),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Save Projects Error: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to save projects: ${res.status} ${res.statusText}`);
    }
};

const fetchTodos = async (): Promise<Todo[]> => {
    const res = await fetch(`${BASE_URL}/api/data/todos`, { cache: 'no-store' });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch Todos Error: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to fetch todos: ${res.status} ${res.statusText}`);
    }
    return res.json();
};

const saveTodos = async (todos: Todo[]) => {
    const res = await fetch(`${BASE_URL}/api/data/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todos),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Save Todos Error: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to save todos: ${res.status} ${res.statusText}`);
    }
};

const fetchFinishedProjects = async (): Promise<Project[]> => {
    const res = await fetch(`${BASE_URL}/api/data/finished-projects`, { cache: 'no-store' });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch Finished Projects Error: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to fetch finished projects: ${res.status} ${res.statusText}`);
    }
    return res.json();
};

const saveFinishedProjects = async (projects: Project[]) => {
    const res = await fetch(`${BASE_URL}/api/data/finished-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projects),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error(`Save Finished Projects Error: ${res.status} ${res.statusText}`, text);
        throw new Error(`Failed to save finished projects: ${res.status} ${res.statusText}`);
    }
};

// --- Projects API ---
export const getProjects = async (): Promise<Project[]> => {
    return fetchProjects();
};

export const getFinishedProjects = async (): Promise<Project[]> => {
    return fetchFinishedProjects();
};

// Added for scheduler
export const setProjects = async (projects: Project[]): Promise<void> => {
    return saveProjects(projects);
};

export const setFinishedProjects = async (projects: Project[]): Promise<void> => {
    return saveFinishedProjects(projects);
};

export const createProject = async (project: Omit<Project, 'id' | 'status'>): Promise<Project> => {
    const projects = await fetchProjects();
    const newProject: Project = {
        id: uuidv4(),
        ...project,
        status: 'active',
    };
    projects.push(newProject);
    await saveProjects(projects);
    return newProject;
};

export const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
    const projects = await fetchProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
        const updatedProject = { ...projects[index], ...projectData };
        if (updatedProject.status === 'finished' && !updatedProject.finishedAt) {
            updatedProject.finishedAt = new Date().toISOString();
        }
        projects[index] = updatedProject;
        await saveProjects(projects);
        return updatedProject;
    }
    throw new Error('Project not found');
};

export const deleteProject = async (id: string, mode: 'single' | 'future' = 'single'): Promise<void> => {
    let projects = await fetchProjects();
    const target = projects.find(p => p.id === id);
    if (!target) return;

    if (mode === 'single') {
        if (target.parentId) {
            const parentIndex = projects.findIndex(p => p.id === target.parentId);
            if (parentIndex !== -1) {
                const parent = projects[parentIndex];
                const excluded = parent.recurrenceExcludedDates || [];
                if (!excluded.includes(target.webAppPeriodStart)) {
                    excluded.push(target.webAppPeriodStart);
                    projects[parentIndex] = { ...parent, recurrenceExcludedDates: excluded };
                }
            }
        }
        projects = projects.filter(p => p.id !== id);
    } else if (mode === 'future') {
        if (target.parentId) {
            const parentIndex = projects.findIndex(p => p.id === target.parentId);
            if (parentIndex !== -1) {
                const parent = projects[parentIndex];
                const targetDate = new Date(target.webAppPeriodStart);
                targetDate.setDate(targetDate.getDate() - 1);
                projects[parentIndex] = { ...parent, recurrenceEndDate: targetDate.toISOString().split('T')[0] };
            }
            projects = projects.filter(p => {
                if (p.id === id) return false;
                if (p.parentId === target.parentId && p.webAppPeriodStart >= target.webAppPeriodStart) return false;
                return true;
            });
        } else {
            // Parent: Delete all
            projects = projects.filter(p => p.id !== id && p.parentId !== id);
        }
    }
    
    await saveProjects(projects);
};

// --- Todos API ---
export const getTodos = async (): Promise<Todo[]> => {
    return fetchTodos();
};

// Added for scheduler
export const setTodos = async (todos: Todo[]): Promise<void> => {
    return saveTodos(todos);
};

export const createTodo = async (todo: Omit<Todo, 'id' | 'isFinished'>): Promise<Todo> => {
    const todos = await fetchTodos();
    const newTodo: Todo = {
        id: uuidv4(),
        ...todo,
        isFinished: false,
    };
    todos.push(newTodo);
    await saveTodos(todos);
    return newTodo;
};

export const updateTodo = async (id: string, todoData: Partial<Todo>): Promise<Todo> => {
    const todos = await fetchTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
        const updatedTodo = { ...todos[index], ...todoData };
        if (updatedTodo.isFinished && !updatedTodo.finishedAt) {
            updatedTodo.finishedAt = new Date().toISOString();
        }
        todos[index] = updatedTodo;
        await saveTodos(todos);
        return todos[index];
    }
    throw new Error('Todo not found');
};

export const deleteTodo = async (id: string, mode: 'single' | 'future' = 'single'): Promise<void> => {
    let todos = await fetchTodos();
    const target = todos.find(t => t.id === id);
    if (!target) return;

    if (mode === 'single') {
        if (target.parentId) {
            const parentIndex = todos.findIndex(t => t.id === target.parentId);
            if (parentIndex !== -1) {
                const parent = todos[parentIndex];
                const excluded = parent.recurrenceExcludedDates || [];
                if (!excluded.includes(target.date)) {
                    excluded.push(target.date);
                    todos[parentIndex] = { ...parent, recurrenceExcludedDates: excluded };
                }
            }
        }
        todos = todos.filter(t => t.id !== id);
    } else if (mode === 'future') {
        if (target.parentId) {
            const parentIndex = todos.findIndex(t => t.id === target.parentId);
            if (parentIndex !== -1) {
                const parent = todos[parentIndex];
                const targetDate = new Date(target.date);
                targetDate.setDate(targetDate.getDate() - 1);
                todos[parentIndex] = { ...parent, recurrenceEndDate: targetDate.toISOString().split('T')[0] };
            }
            todos = todos.filter(t => {
                if (t.id === id) return false;
                if (t.parentId === target.parentId && t.date >= target.date) return false;
                return true;
            });
        } else {
            todos = todos.filter(t => t.id !== id && t.parentId !== id);
        }
    }

    await saveTodos(todos);
};
