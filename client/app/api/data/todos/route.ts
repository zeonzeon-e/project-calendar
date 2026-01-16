import { NextResponse } from 'next/server';
import { readData, writeData } from '../../fs-utils';
import { Todo } from '../../../types';

const FILENAME = 'todos.json';

export async function GET() {
    const todos = readData<Todo[]>(FILENAME, []);
    return NextResponse.json(todos);
}

export async function POST(request: Request) {
    try {
        const todos = await request.json();
        writeData(FILENAME, todos);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
