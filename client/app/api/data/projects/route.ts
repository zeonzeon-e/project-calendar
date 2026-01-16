import { NextResponse } from 'next/server';
import { readData, writeData } from '../../fs-utils';
import { Project } from '../../../types';

const FILENAME = 'projects.json';

export async function GET() {
    try {
        const projects = readData<Project[]>(FILENAME, []);
        return NextResponse.json(projects);
    } catch (error: any) {
        console.error('GET Projects Error:', error);
        return NextResponse.json({ 
            error: error.message, 
            stack: error.stack,
            cwd: process.cwd() 
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const projects = await request.json();
        writeData(FILENAME, projects);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
