import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import * as api from '../api';

interface DataControlsProps {
    onDataImported: () => void;
}

const DataControls: React.FC<DataControlsProps> = ({ onDataImported }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        const projects = await api.getProjects();
        const todos = await api.getTodos();
        
        const data = {
            projects,
            todos,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                
                if (json.projects && Array.isArray(json.projects)) {
                    localStorage.setItem('project-calendar-data', JSON.stringify(json.projects));
                }
                if (json.todos && Array.isArray(json.todos)) {
                    localStorage.setItem('project-calendar-todos', JSON.stringify(json.todos));
                }
                
                alert('데이터가 성공적으로 복원되었습니다.');
                onDataImported(); // Refresh data
            } catch (error) {
                console.error('Import failed:', error);
                alert('파일 형식이 올바르지 않습니다.');
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                title="데이터 내보내기 (백업)"
            >
                <Download size={16} />
                <span className="hidden sm:inline">백업</span>
            </button>
            <button 
                onClick={handleImportClick}
                className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                title="데이터 불러오기 (복원)"
            >
                <Upload size={16} />
                <span className="hidden sm:inline">복원</span>
            </button>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />
        </div>
    );
};

export default DataControls;
