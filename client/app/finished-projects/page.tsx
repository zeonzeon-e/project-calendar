"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Project } from '../types';
import * as api from '../api';
import { Home, ListFilter } from 'lucide-react';

export default function FinishedProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const finishedProjectsData = await api.getFinishedProjects();
                // Sort by registration date (webAppPeriodStart) descending
                finishedProjectsData.sort((a, b) => new Date(b.webAppPeriodStart).getTime() - new Date(a.webAppPeriodStart).getTime());
                setProjects(finishedProjectsData);
            } catch (error) {
                console.error("완료된 프로젝트 데이터를 불러오지 못했습니다:", error);
            }
        };

        fetchData();
    }, []);

    const availableYears = useMemo(() => {
        const years = new Set(projects.map(p => new Date(p.webAppPeriodStart).getFullYear().toString()));
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [projects]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const projectDate = new Date(p.webAppPeriodStart);
            const yearMatch = selectedYear === 'all' || projectDate.getFullYear().toString() === selectedYear;
            const monthMatch = selectedMonth === 'all' || (projectDate.getMonth() + 1).toString() === selectedMonth;
            return yearMatch && monthMatch;
        });
    }, [projects, selectedYear, selectedMonth]);

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">완료된 프로젝트 목록</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        아카이빙된 모든 프로젝트를 확인하고 필터링합니다.
                    </p>
                </div>
                <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                    <Home size={16} />
                    <span>메인으로</span>
                </Link>
            </header>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <ListFilter size={16} />
                        <span>필터</span>
                    </div>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                        <option value="all">전체 년도</option>
                        {availableYears.map(year => <option key={year} value={year}>{year}년</option>)}
                    </select>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                        <option value="all">전체 월</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month.toString()}>{month}월</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">프로젝트 번호</th>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">제목</th>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">팀</th>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">등록일</th>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">웹업 시작일</th>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">실사 시작일</th>
                            <th scope="col" className="px-6 py-3 whitespace-nowrap">프로젝트 종료일</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map((p) => (
                            <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono">{p.projectNumber}</td>
                                <td className="px-6 py-4 font-semibold text-gray-900">{p.title}</td>
                                <td className="px-6 py-4">{p.team || '-'}</td>
                                <td className="px-6 py-4">{p.webAppPeriodStart}</td>
                                <td className="px-6 py-4">{p.webAppPeriodStart}</td>
                                <td className="px-6 py-4">{p.fieldWorkPeriodStart || '-'}</td>
                                <td className="px-6 py-4">{p.endDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProjects.length === 0 && (
                    <p className="text-center py-10 text-gray-500">
                        {projects.length === 0 ? "완료된 프로젝트가 없습니다." : "선택한 조건에 맞는 프로젝트가 없습니다."}
                    </p>
                )}
            </div>
        </main>
    );
}
