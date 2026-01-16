import { NextResponse } from 'next/server';
import { readData, writeData } from '../../fs-utils';
import { Project } from '../../../types';

const FILENAME = 'finishedProjects.json';

export async function GET() {
    try {
        const projects = readData<Project[]>(FILENAME, []);
        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error in GET /api/data/finished-projects:', error);
        return NextResponse.json({ message: 'Error reading finished projects data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        writeData<Project[]>(FILENAME, data);
        return NextResponse.json({ message: 'Finished projects data saved successfully' });
    } catch (error) {
        console.error('Error in POST /api/data/finished-projects:', error);
        return NextResponse.json({ message: 'Error writing finished projects data' }, { status: 500 });
    }
}
