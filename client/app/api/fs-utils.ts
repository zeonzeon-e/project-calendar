import fs from 'fs';
import path from 'path';

// Define data directory relative to the running process (client root)
// We go up one level to store data in 'project-calendar/data'
const DATA_DIR = path.join(process.cwd(), '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error('Failed to create data directory:', err);
    }
}

export const getFilePath = (filename: string) => path.join(DATA_DIR, filename);

export const readData = <T>(filename: string, defaultValue: T): T => {
    try {
        const filePath = getFilePath(filename);
        if (!fs.existsSync(filePath)) {
            return defaultValue;
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return defaultValue;
    }
};

export const writeData = <T>(filename: string, data: T): void => {
    try {
        const filePath = getFilePath(filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        throw error;
    }
};
