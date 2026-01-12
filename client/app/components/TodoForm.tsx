import React, { useState, useEffect } from 'react';
import { Todo } from '../types';
import { Star } from 'lucide-react';

interface TodoFormProps {
    date: string;
    initialData?: Todo;
    onSubmit: (data: Omit<Todo, 'id' | 'isFinished'>) => void;
    onCancel: () => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ date, initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        importance: 3,
        content: '',
        deadline: '',
        frequency: '',
        date: date
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                importance: initialData.importance,
                content: initialData.content || '',
                deadline: initialData.deadline || '',
                frequency: initialData.frequency || '',
                date: initialData.date
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImportanceChange = (val: number) => {
        setFormData(prev => ({ ...prev, importance: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // 제목이 비어있지 않으면 제출
            if (formData.title.trim()) {
                e.preventDefault();
                onSubmit(formData);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 (필수)</label>
                <input
                    type="text"
                    name="title"
                    required
                    autoFocus
                    value={formData.title}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="할 일 제목을 입력하세요"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">중요도</label>
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => handleImportanceChange(star)}
                            className="focus:outline-none transition-colors"
                        >
                            <Star 
                                size={24} 
                                className={star <= formData.importance ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} 
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 (선택)</label>
                <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="추가 설명..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">마감일 (선택)</label>
                    <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주기 (선택)</label>
                    <select
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="">설정 안함</option>
                        <option value="매일">매일</option>
                        <option value="매주">매주</option>
                        <option value="매월">매월</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    취소
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    {initialData ? '수정 완료' : '할일 생성'}
                </button>
            </div>
        </form>
    );
};

export default TodoForm;