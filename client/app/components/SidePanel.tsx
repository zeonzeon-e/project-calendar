import React, { useState } from 'react';
import { Project, Todo } from '../types';
import { format, parseISO, isSameDay } from 'date-fns';
import { CheckCircle, Circle, Edit2, PlayCircle, Trash2, Star } from 'lucide-react';

interface SidePanelProps {
    date: Date | null;
    projects: Project[];
    todos: Todo[];
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onEditTodo: (todo: Todo) => void;
    onToggleWebAppFinished: (project: Project) => void;
    onToggleFieldWorkStarted: (project: Project) => void;
    onToggleTodoFinished: (todo: Todo) => void;
    onDeleteTodo: (todoId: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ 
    date, projects, todos, 
    onEditProject, onDeleteProject, onEditTodo, onToggleWebAppFinished, onToggleFieldWorkStarted,
    onToggleTodoFinished, onDeleteTodo
}) => {
    const [filter, setFilter] = useState<'all' | 'project' | 'todo'>('all');

    if (!date) {
        return (
            <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex items-center justify-center text-gray-500 text-center">
                <p>날짜를 선택하여<br/>프로젝트와 할 일을 확인하세요.</p>
            </div>
        );
    }

    const dayProjects = projects.filter(project => {
        if (project.status === 'finished') return false;
        const daysToCheck = [
            project.webAppPeriodStart, 
            project.fieldWorkPeriodStart
        ];
        return daysToCheck.some(d => d && isSameDay(parseISO(d), date));
    });

    const dayTodos = todos.filter(todo => isSameDay(parseISO(todo.date), date));

    return (
        <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden text-black">
            <div className="p-4 border-b bg-gray-50 shrink-0">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">
                        {format(date, 'yyyy년 MM월 dd일')}
                    </h2>
                    <div className="text-xs text-gray-500 font-medium">
                        프로젝트: {dayProjects.length}, 할일: {dayTodos.length}
                    </div>
                </div>
                <div className="flex space-x-2 mt-3">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        모두
                    </button>
                    <button 
                        onClick={() => setFilter('project')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'project' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        프로젝트
                    </button>
                    <button 
                        onClick={() => setFilter('todo')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'todo' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        할일
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(filter === 'all' || filter === 'project') && dayProjects.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Projects</h3>
                        {dayProjects.map(project => (
                            <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-800 truncate pr-2">{project.title}</h3>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {project.projectNumber}
                                        </span>
                                        {project.team && (
                                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                {project.team}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="text-sm text-gray-600 space-y-2 mb-3">
                                    <div className="flex justify-between">
                                        <span>웹/앱:</span>
                                        <span>{project.webAppPeriodStart} ~ {project.webAppPeriodEnd}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>실사:</span>
                                        <span>{project.fieldWorkPeriodStart || '-'} ~ {project.fieldWorkPeriodEnd || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>종료일:</span>
                                        <span className="text-red-600 font-medium">{project.endDate}</span>
                                    </div>
                                    {project.frequency && (
                                        <div className="flex justify-between text-xs text-blue-500">
                                            <span>주기:</span>
                                            <span>{project.frequency}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <button 
                                            onClick={() => onToggleWebAppFinished(project)}
                                            className={`flex items-center text-sm ${project.isWebAppFinished ? 'text-green-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {project.isWebAppFinished ? <CheckCircle size={16} className="mr-1.5"/> : <Circle size={16} className="mr-1.5"/>}
                                            웹업 완료
                                        </button>
                                        
                                        <button 
                                            onClick={() => onToggleFieldWorkStarted(project)}
                                            className={`flex items-center text-sm ${project.isFieldWorkStarted ? 'text-blue-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {project.isFieldWorkStarted ? <PlayCircle size={16} className="mr-1.5"/> : <Circle size={16} className="mr-1.5"/>}
                                            실사 시작
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-2 mt-1">
                                        <button 
                                            onClick={() => onEditProject(project)}
                                            className="flex-1 flex items-center justify-center text-sm bg-gray-50 hover:bg-gray-100 text-blue-600 py-2 rounded-md transition-colors"
                                        >
                                            <Edit2 size={16} className="mr-1.5"/>
                                            수정
                                        </button>
                                        <button 
                                            onClick={() => onDeleteProject(project.id)}
                                            className="px-3 flex items-center justify-center text-sm bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-md transition-colors"
                                            title="프로젝트 삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {(filter === 'all' || filter === 'todo') && dayTodos.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">To-Dos</h3>
                        {dayTodos.map(todo => (
                            <div 
                                key={todo.id} 
                                onClick={() => onToggleTodoFinished(todo)}
                                className={`border rounded-lg p-3 hover:shadow-sm transition-shadow bg-white cursor-pointer ${todo.isFinished ? 'opacity-60 bg-gray-50' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleTodoFinished(todo);
                                            }}
                                            className={`mt-1 ${todo.isFinished ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                                        >
                                            {todo.isFinished ? <CheckCircle size={20} /> : <Circle size={20} />}
                                        </button>
                                        <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div className="flex items-center space-x-1">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star key={s} size={10} className={s <= todo.importance ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                                                    ))}
                                                </div>
                                                {todo.category && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 font-medium">
                                                        {todo.category}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`font-semibold text-gray-800 ${todo.isFinished ? 'line-through text-gray-500' : ''}`}>
                                                {todo.title}
                                            </p>
                                            {todo.content && (
                                                <p className={`text-sm text-gray-500 mt-1 ${todo.isFinished ? 'line-through' : ''}`}>
                                                    {todo.content}
                                                </p>
                                            )}
                                            {todo.deadline && (
                                                <div className="text-xs text-red-500 mt-1">
                                                    마감: {todo.deadline}
                                                </div>
                                            )}
                                            {todo.frequency && (
                                                <div className="text-xs text-blue-500 mt-0.5">
                                                    반복: {todo.frequency}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditTodo(todo);
                                            }}
                                            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                            title="수정"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteTodo(todo.id);
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {dayProjects.length === 0 && dayTodos.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                        일정이 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidePanel;