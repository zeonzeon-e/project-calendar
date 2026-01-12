import { Project, Todo } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as api from '../api';

// --- Date Helpers ---
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

export const runScheduler = async () => {
    console.log('Running client-side scheduler...');
    
    // 1. Load Data
    const projects = await api.getProjects();
    const todos = await api.getTodos();
    const now = new Date();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const targetEndDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); 
    const todayStr = now.toISOString().split('T')[0];

    let projectsUpdated = false;
    let todosUpdated = false;

    // 2. Project Cleanup (Finished > 3 days)
    const activeProjects = projects.filter(p => {
        if (p.status === 'finished' && p.finishedAt) {
            const finishedDate = new Date(p.finishedAt);
            if (now.getTime() - finishedDate.getTime() > THREE_DAYS_MS) return false;
        }
        return true;
    });

    if (activeProjects.length !== projects.length) {
        projectsUpdated = true;
    }

    // 3. Project Recurrence
    const originalProjects = activeProjects.filter(p => p.frequency && !p.parentId && p.status === 'active');
    
    originalProjects.forEach(origin => {
        let currentDateStr = origin.webAppPeriodStart;
        let nextDateStr = getNextDate(currentDateStr, origin.frequency!);
        
        while (new Date(nextDateStr) <= targetEndDate) {
            const exists = activeProjects.some(p => p.parentId === origin.id && p.webAppPeriodStart === nextDateStr);
            if (!exists) {
                const startObj = new Date(origin.webAppPeriodStart);
                const nextObj = new Date(nextDateStr);
                const diffTime = nextObj.getTime() - startObj.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                activeProjects.push({
                    ...origin,
                    id: uuidv4(),
                    parentId: origin.id,
                    frequency: undefined,
                    webAppPeriodStart: nextDateStr,
                    webAppPeriodEnd: addDays(origin.webAppPeriodEnd, diffDays),
                    fieldWorkPeriodStart: addDays(origin.fieldWorkPeriodStart, diffDays),
                    fieldWorkPeriodEnd: addDays(origin.fieldWorkPeriodEnd, diffDays),
                    endDate: addDays(origin.endDate, diffDays),
                    isWebAppFinished: false,
                    isFieldWorkStarted: false,
                    status: 'active'
                });
                projectsUpdated = true;
            }
            currentDateStr = nextDateStr;
            nextDateStr = getNextDate(currentDateStr, origin.frequency!);
        }
    });

    // 4. Todo Carry-over
    const updatedTodos = todos.map(todo => {
        if (!todo.isFinished && todo.date < todayStr) {
            todosUpdated = true;
            return { ...todo, date: todayStr };
        }
        return todo;
    });

    // 5. Todo Recurrence
    const originalTodos = updatedTodos.filter(t => t.frequency && !t.parentId && !t.isFinished);
    
    originalTodos.forEach(origin => {
        let currentDateStr = origin.date;
        let nextDateStr = getNextDate(currentDateStr, origin.frequency!);

        while (new Date(nextDateStr) <= targetEndDate) {
            const exists = updatedTodos.some(t => t.parentId === origin.id && t.date === nextDateStr);
            if (!exists) {
                const diffDays = (new Date(nextDateStr).getTime() - new Date(origin.date).getTime()) / (1000 * 3600 * 24);
                updatedTodos.push({
                    ...origin,
                    id: uuidv4(),
                    parentId: origin.id,
                    frequency: undefined,
                    date: nextDateStr,
                    deadline: origin.deadline ? addDays(origin.deadline, diffDays) : undefined,
                    isFinished: false
                });
                todosUpdated = true;
            }
            currentDateStr = nextDateStr;
            nextDateStr = getNextDate(currentDateStr, origin.frequency!);
        }
    });

    // 6. Save Changes
    if (projectsUpdated) {
        // We need a way to batch update locally. 
        // Since we are in client, we can just overwrite LocalStorage.
        if (typeof window !== 'undefined') {
            localStorage.setItem('project-calendar-data', JSON.stringify(activeProjects));
        }
    }

    if (todosUpdated) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('project-calendar-todos', JSON.stringify(updatedTodos));
        }
    }

    return { projectsUpdated, todosUpdated };
};
