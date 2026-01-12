import { Project, Todo } from './types';
import { v4 as uuidv4 } from 'uuid';

const PROJECTS_KEY = 'project-calendar-data';
const TODOS_KEY = 'project-calendar-todos';

// --- Helper Functions ---
const getLocalProjects = (): Project[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
};

const setLocalProjects = (projects: Project[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

const getLocalTodos = (): Todo[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(TODOS_KEY);
    return data ? JSON.parse(data) : [];
};

const setLocalTodos = (todos: Todo[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
};

// --- Projects API ---
export const getProjects = async (): Promise<Project[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(getLocalProjects()), 100); // Simulate async
    });
};

export const createProject = async (project: Omit<Project, 'id' | 'status'>): Promise<Project> => {
    const projects = getLocalProjects();
    const newProject: Project = {
        id: uuidv4(),
        ...project,
        status: 'active',
    };
    projects.push(newProject);
    setLocalProjects(projects);
    
    // Trigger scheduler manually (to handle recurrence immediately)
    // In a real app, we might want a better event system, but here we rely on the main page reloading data.
    return newProject;
};

export const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
    const projects = getLocalProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
        const updatedProject = { ...projects[index], ...projectData };
        if (updatedProject.status === 'finished' && !updatedProject.finishedAt) {
            updatedProject.finishedAt = new Date().toISOString();
        }
        projects[index] = updatedProject;
        setLocalProjects(projects);
        return updatedProject;
    }
    throw new Error('Project not found');
};

export const deleteProject = async (id: string): Promise<void> => {
    let projects = getLocalProjects();
    projects = projects.filter(p => p.id !== id);
    setLocalProjects(projects);
};

// --- Todos API ---
export const getTodos = async (): Promise<Todo[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(getLocalTodos()), 100);
    });
};

export const createTodo = async (todo: Omit<Todo, 'id' | 'isFinished'>): Promise<Todo> => {
    const todos = getLocalTodos();
    const newTodo: Todo = {
        id: uuidv4(),
        ...todo,
        isFinished: false,
    };
    todos.push(newTodo);
    setLocalTodos(todos);
    return newTodo;
};

export const updateTodo = async (id: string, todoData: Partial<Todo>): Promise<Todo> => {
    const todos = getLocalTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
        todos[index] = { ...todos[index], ...todoData };
        setLocalTodos(todos);
        return todos[index];
    }
    throw new Error('Todo not found');
};

export const deleteTodo = async (id: string): Promise<void> => {
    let todos = getLocalTodos();
    todos = todos.filter(t => t.id !== id);
    setLocalTodos(todos);
};