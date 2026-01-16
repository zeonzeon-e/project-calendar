import { Project, Todo } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as api from '../api';
import { format } from 'date-fns';

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

const getNextDate = (dateStr: string, frequency: string, optionsInput?: string[] | string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);

    let options: string[] = [];
    if (Array.isArray(optionsInput)) {
        options = optionsInput;
    } else if (typeof optionsInput === 'string') {
        options = [optionsInput];
    }
    
    switch (frequency) {
        case '매일': return addDays(dateStr, 1);
        case '매주': {
            if (options && options.length > 0) {
                const daysMap: {[key: string]: number} = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
                const targetDays = options.map(opt => daysMap[opt]).sort((a, b) => a - b);
                
                const currentDay = date.getDay();
                // Find the first target day that is later than today in the same week
                let nextTargetDay = targetDays.find(d => d > currentDay);
                
                let diff: number;
                if (nextTargetDay !== undefined) {
                    diff = nextTargetDay - currentDay;
                } else {
                    // Go to the first target day in the next week
                    diff = (7 - currentDay) + targetDays[0];
                }
                return addDays(dateStr, diff);
            }
            return addDays(dateStr, 7);
        }
        case '매월': {
            // First, find the target year/month
            let targetYear = date.getFullYear();
            let targetMonth = date.getMonth();
            
            // If we have options, we might need to find the "next" valid date in the current month or move to next month
            // But usually '매월' with multiple options is rare for this UX (it's a dropdown). 
            // If the user selected multiple (though UI currently limits to one for Monthly), we handle the first one.
            const option = options?.[0];

            // To find the NEXT month's occurrence:
            targetMonth++;
            if (targetMonth > 11) {
                targetYear++;
                targetMonth = 0;
            }

            if (option === '말일') {
                 return format(new Date(targetYear, targetMonth + 1, 0), 'yyyy-MM-dd');
            } else if (option) {
                const targetDate = parseInt(option, 10);
                if (!isNaN(targetDate)) {
                     const testDate = new Date(targetYear, targetMonth, targetDate);
                     if (testDate.getMonth() !== targetMonth) {
                         return format(new Date(targetYear, targetMonth + 1, 0), 'yyyy-MM-dd');
                     }
                     return format(testDate, 'yyyy-MM-dd');
                }
            }
            return addMonths(dateStr, 1);
        }
        case '매년': return addYears(dateStr, 1);
        default: return dateStr;
    }
};

export const runScheduler = async () => {
    console.log('Running client-side scheduler...');
    
    // 1. Load Data
    let projects = await api.getProjects();
    let todos = await api.getTodos();
    const finishedProjects = await api.getFinishedProjects();
    const now = new Date();
    const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
    const targetEndDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); 
    const todayStr = format(now, 'yyyy-MM-dd');

    let projectsUpdated = false;
    let todosUpdated = false;
    let finishedProjectsUpdated = false;

    // 2. Project Archiving (move finished projects)
    const projectsToArchive = projects.filter(p => p.status === 'finished');
    const activeProjects = projects.filter(p => p.status !== 'finished');

    if (projectsToArchive.length > 0) {
        const existingFinishedIds = new Set(finishedProjects.map(p => p.id));
        const newFinishedProjects = projectsToArchive.filter(p => !existingFinishedIds.has(p.id));

        if (newFinishedProjects.length > 0) {
            const combinedFinished = [...finishedProjects, ...newFinishedProjects];
            combinedFinished.sort((a, b) => new Date(a.webAppPeriodStart).getTime() - new Date(b.webAppPeriodStart).getTime());
            
            console.log('Scheduler: Archiving projects...');
            await api.setFinishedProjects(combinedFinished);
            finishedProjectsUpdated = true;
        }

        projects = activeProjects; // Continue with only active projects
        projectsUpdated = true;
    }


    // 3. Project Recurrence (runs only on active projects)
    const originalProjects = projects.filter(p => p.frequency && !p.parentId && p.status === 'active');
    
    originalProjects.forEach(origin => {
        let currentDateStr = origin.webAppPeriodStart;
        let nextDateStr = getNextDate(currentDateStr, origin.frequency!, origin.frequencyOption);
        
        while (new Date(nextDateStr) <= targetEndDate) {
            if (origin.recurrenceEndDate && new Date(nextDateStr) > new Date(origin.recurrenceEndDate)) {
                break;
            }

            const exists = projects.some(p => p.parentId === origin.id && p.webAppPeriodStart === nextDateStr);
            const isExcluded = origin.recurrenceExcludedDates?.includes(nextDateStr);

            if (!exists && !isExcluded) {
                const startObj = new Date(origin.webAppPeriodStart);
                const nextObj = new Date(nextDateStr);
                const diffTime = nextObj.getTime() - startObj.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                projects.push({
                    ...origin,
                    id: uuidv4(),
                    parentId: origin.id,
                    frequency: undefined,
                    frequencyOption: undefined,
                    recurrenceExcludedDates: undefined,
                    recurrenceEndDate: undefined,
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
            nextDateStr = getNextDate(currentDateStr, origin.frequency!, origin.frequencyOption);
        }
    });

    // 4. Todo Cleanup (Finished > 2 weeks)
    const todosToKeep = todos.filter(todo => {
        if (todo.isFinished && todo.finishedAt) {
            const finishedDate = new Date(todo.finishedAt);
            if (now.getTime() - finishedDate.getTime() > TWO_WEEKS_MS) {
                todosUpdated = true;
                return false; // Remove this todo
            }
        }
        return true;
    });
    
    let updatedTodos = todosToKeep;

    // 5. Todo Carry-over
    updatedTodos = updatedTodos.map(todo => {
        if (!todo.isFinished && todo.date < todayStr) {
            if(!todosUpdated) todosUpdated = true;
            return { ...todo, date: todayStr };
        }
        return todo;
    });

    // 6. Todo Recurrence
    const originalTodos = updatedTodos.filter(t => t.frequency && !t.parentId && !t.isFinished);
    
    originalTodos.forEach(origin => {
        let currentDateStr = origin.date;
        let nextDateStr = getNextDate(currentDateStr, origin.frequency!, origin.frequencyOption);

        while (new Date(nextDateStr) <= targetEndDate) {
            if (origin.recurrenceEndDate && new Date(nextDateStr) > new Date(origin.recurrenceEndDate)) {
                break;
            }

            const exists = updatedTodos.some(t => t.parentId === origin.id && t.date === nextDateStr);
            const isExcluded = origin.recurrenceExcludedDates?.includes(nextDateStr);

            if (!exists && !isExcluded) {
                const diffDays = (new Date(nextDateStr).getTime() - new Date(origin.date).getTime()) / (1000 * 3600 * 24);
                updatedTodos.push({
                    ...origin,
                    id: uuidv4(),
                    parentId: origin.id,
                    frequency: undefined,
                    frequencyOption: undefined,
                    recurrenceExcludedDates: undefined,
                    recurrenceEndDate: undefined,
                    date: nextDateStr,
                    deadline: origin.deadline ? addDays(origin.deadline, diffDays) : undefined,
                    isFinished: false
                });
                todosUpdated = true;
            }
            currentDateStr = nextDateStr;
            nextDateStr = getNextDate(currentDateStr, origin.frequency!, origin.frequencyOption);
        }
    });

    // 7. Save Changes
    if (projectsUpdated) {
        console.log('Scheduler: Updating projects...');
        await api.setProjects(projects);
    }

    if (todosUpdated) {
        console.log('Scheduler: Updating todos...');
        await api.setTodos(updatedTodos);
    }

    if (!projectsUpdated && !todosUpdated && !finishedProjectsUpdated) {
        console.log('Scheduler: No updates needed.');
    }

    return { projectsUpdated, todosUpdated, finishedProjectsUpdated };
};
