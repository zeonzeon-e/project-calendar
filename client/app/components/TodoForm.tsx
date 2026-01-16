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
        frequencyOption: [] as string[],
        date: date,
        category: '',
        notificationEnabled: false
    });

    useEffect(() => {
        if (initialData) {
            let freqOption: string[] = [];
            if (Array.isArray(initialData.frequencyOption)) {
                freqOption = initialData.frequencyOption;
            } else if (typeof initialData.frequencyOption === 'string' && initialData.frequencyOption) {
                freqOption = [initialData.frequencyOption];
            }

            setFormData({
                title: initialData.title || "",
                importance: initialData.importance || 3,
                content: initialData.content || '',
                deadline: initialData.deadline || '',
                frequency: initialData.frequency || '',
                frequencyOption: freqOption,
                date: initialData.date || "",
                category: initialData.category || '',
                notificationEnabled: initialData.notificationEnabled || false
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'frequency') {
                newData.frequencyOption = [];
            }
            return newData;
        });
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const toggleFrequencyOption = (option: string) => {
        setFormData(prev => {
            const current = prev.frequencyOption || [];
            if (current.includes(option)) {
                return { ...prev, frequencyOption: current.filter(o => o !== option) };
            } else {
                return { ...prev, frequencyOption: [...current, option] };
            }
        });
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
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="todo-title">제목 (필수)</label>
                <input
                    type="text"
                    id="todo-title"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 (선택)</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                >
                    <option value="">선택 안함</option>
                    <option value="분석툴">분석툴</option>
                    <option value="업무">업무</option>
                    <option value="기타">기타</option>
                </select>
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
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="todo-content">내용 (선택)</label>
                <textarea
                    id="todo-content"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="todo-deadline">마감일 (선택)</label>
                    <input
                        type="date"
                        id="todo-deadline"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">주기 (선택)</label>
                    <div className="space-y-2">
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
                        {formData.frequency === '매주' && (
                            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                                {['월', '화', '수', '목', '금', '토', '일'].map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => toggleFrequencyOption(d)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                            formData.frequencyOption?.includes(d)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
                                        }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                        {formData.frequency === '매월' && (
                            <select
                                name="frequencyOption"
                                value={formData.frequencyOption?.[0] || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, frequencyOption: [e.target.value] }))}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">날짜 선택</option>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d.toString()}>{d}일</option>
                                ))}
                                <option value="말일">말일</option>
                            </select>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="todo-notification"
                    name="notificationEnabled"
                    checked={formData.notificationEnabled}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                    htmlFor="todo-notification"
                    className="ml-2 block text-sm text-gray-900 cursor-pointer"
                >
                    알림 설정 (오후 5시)
                </label>
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