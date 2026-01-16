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
    frequencyOption?: string[];
    recurrenceExcludedDates?: string[];
    recurrenceEndDate?: string;
    parentId?: string;
    team?: string;
    notificationEnabled?: boolean;
}

export interface Todo {
    id: string;
    title: string;
    importance: number; // 1-5 stars
    content?: string;
    deadline?: string;
    frequency?: string;
    frequencyOption?: string[];
    recurrenceExcludedDates?: string[];
    recurrenceEndDate?: string;
    date: string;
    isFinished: boolean;
    finishedAt?: string;
    parentId?: string;
    category?: string;
    notificationEnabled?: boolean;
}
