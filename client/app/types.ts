export interface Project {
    id: string;
    projectNumber: string;
    title: string;
    webAppPeriodStart: string; // YYYY-MM-DD
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

export interface Todo {
    id: string;
    title: string;
    importance: number; // 1-5 stars
    content?: string;
    deadline?: string;
    frequency?: string;
    date: string;
    isFinished: boolean;
    parentId?: string;
}
