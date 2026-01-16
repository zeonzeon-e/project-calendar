"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Check, Server, Database, Edit3, Save, RotateCcw, Plus, Trash2, Search } from 'lucide-react';

// --- Types & Interfaces for Documentation ---

interface PropertyDoc {
    name: string;
    type: string;
    description: string;
    required?: boolean;
}

interface SchemaDoc {
    name: string;
    description: string;
    properties: PropertyDoc[];
    example?: string;
}

interface ResponseDoc {
    code: number;
    description: string;
    schema?: string;
    example?: string;
}

interface EndpointDoc {
    method: 'GET' | 'POST';
    path: string;
    summary: string;
    description?: string;
    parameters?: Array<{
        name: string;
        in: 'path' | 'query' | 'body';
        required: boolean;
        type: string;
        description: string;
    }>;
    requestBody?: string;
    responses: ResponseDoc[];
}

interface EndpointCategory {
    category: string;
    items: EndpointDoc[];
}

// --- Initial Data (Factory Default) ---

const initialSchemas: SchemaDoc[] = [
    {
        name: 'ProjectInfo',
        description: '프로젝트 기본 정보',
        properties: [
            { name: 'Proj_ID', type: 'string', description: '프로젝트 ID (예: AP22410017)', required: true },
            { name: 'Proj_name', type: 'string', description: '프로젝트 명', required: true },
            { name: 'Survey_ST_Date', type: 'string', description: '조사 시작일 (YYYY-MM-DD)', required: true },
            { name: 'Survey_EN_Date', type: 'string', description: '조사 종료일 (YYYY-MM-DD)', required: true },
            { name: 'Survey_Method', type: 'string', description: '조사 방법', required: true }
        ],
        example: `{
  "Proj_ID": "AP22410017",
  "Proj_name": "test_project",
  "Survey_ST_Date": "2024-10-25",
  "Survey_EN_Date": "2024-10-29",
  "Survey_Method": "Online Survey"
}`
    }
];

const initialEndpoints: EndpointCategory[] = [
    {
        category: 'Section 1. Survey Information (설문 정보)',
        items: [
            {
                method: 'GET',
                path: '/ifProjInfo/{sProjID}/{sUserToken}',
                summary: '1) 설문 정보 조회',
                description: '프로젝트의 기본 정보를 조회합니다.',
                parameters: [
                    { name: 'sProjID', in: 'path', required: true, type: 'string', description: '프로젝트 ID (ex: AP22410017)' },
                    { name: 'sUserToken', in: 'path', required: true, type: 'string', description: '사용자 토큰 (ex: testtoken0)' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "Proj_ID": "AP22410017",
  "Proj_name": "test_project",
  "Survey_ST_Date": "2024-10-25",
  "Survey_EN_Date": "2024-10-29"
}` }]
            },
            {
                method: 'GET',
                path: '/ifQusCList/{sProjID}/{sUserToken}',
                summary: '2) 설문 카테고리 정보 조회',
                description: '설문 문항의 카테고리 목록을 조회합니다.',
                parameters: [
                    { name: 'sProjID', in: 'path', required: true, type: 'string', description: '프로젝트 ID' },
                    { name: 'sUserToken', in: 'path', required: true, type: 'string', description: '사용자 토큰' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "Proj_ID": "AP22410017",
  "QusCList": [
    { "Qus_Cate": "1", "Qus_Cate_name": "Category1", "Qus_Cate_order_by": "1" }
  ]
}` }]
            },
            {
                method: 'GET',
                path: '/ifQusGList/{sProjID}/{sUserToken}/{sCate}',
                summary: '3) 설문 그룹 목록 조회',
                description: '특정 카테고리 내의 문항 그룹 목록을 조회합니다.',
                parameters: [
                    { name: 'sProjID', in: 'path', required: true, type: 'string', description: '프로젝트 ID' },
                    { name: 'sUserToken', in: 'path', required: true, type: 'string', description: '사용자 토큰' },
                    { name: 'sCate', in: 'path', required: true, type: 'string', description: '카테고리 ID (0: 전체)' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "Proj_ID": "AP22410017",
  "QusGList": [
    { "Qus_Group": "4", "Qus_Group_name": "Group4", "Qus_Group_order_by": "4" }
  ]
}` }]
            },
            {
                method: 'GET',
                path: '/ifQusList/{sProjID}/{sUserToken}/{sCate}',
                summary: '4) 설문 문항 목록 조회',
                description: '문항 목록을 조회합니다. QusGID 파라미터로 그룹 또는 특수 목록(F, R, C, 0)을 필터링합니다.',
                parameters: [
                    { name: 'sProjID', in: 'path', required: true, type: 'string', description: '프로젝트 ID' },
                    { name: 'sUserToken', in: 'path', required: true, type: 'string', description: '사용자 토큰' },
                    { name: 'sCate', in: 'path', required: true, type: 'string', description: '카테고리 ID' },
                    { name: 'QusGID', in: 'query', required: false, type: 'string', description: '그룹 ID 또는 (1, F, R, C, 0)' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "Proj_ID": "AP22305001",
  "QusList": [
    { "Qus_data_ColID": "10", "Qus_Type": "1", "code_name": "단수", "Qus_Qno": "Q6_1", "Qus_Qtitle": "문항제목" }
  ]
}` }]
            },
            {
                method: 'GET',
                path: '/ifQusList/{sProjID}/{sUserToken}/{sCate}?QusQID={id}',
                summary: '5) 설문 문항 상세 정보',
                description: '특정 문항(QusQID)의 상세 정보를 조회합니다.',
                parameters: [
                    { name: 'sProjID', in: 'path', required: true, type: 'string', description: '프로젝트 ID' },
                    { name: 'sUserToken', in: 'path', required: true, type: 'string', description: '사용자 토큰' },
                    { name: 'QusQID', in: 'query', required: true, type: 'string', description: '문항 ID (ex: 2)' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "Proj_ID": "AP22410017",
  "QusList": [
    { "Qus_data_ColID": "2", "Qus_Qno": "SQ1", "Qus_Question": "질문내용..." }
  ]
}` }]
            },
            {
                method: 'GET',
                path: '/ifQusValList/{sProjID}/{sUserToken}',
                summary: '6) 문항 보기 정보 (Label/Value)',
                description: '문항의 보기(Answer Options) 정보를 조회합니다.',
                parameters: [
                    { name: 'sProjID', in: 'path', required: true, type: 'string', description: '프로젝트 ID' },
                    { name: 'sUserToken', in: 'path', required: true, type: 'string', description: '사용자 토큰' },
                    { name: 'QusQID', in: 'query', required: true, type: 'string', description: '문항 ID' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "Proj_ID": "AP22410017",
  "QusValList": [
    { "Qus_data_Value": "1", "Qus_data_Label": "보기1" },
    { "Qus_data_Value": "2", "Qus_data_Label": "보기2" }
  ]
}` }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}',
                summary: '7) 필터 정보 조회',
                description: '저장된 필터 옵션을 조회합니다. (sOption=filter)',
                parameters: [
                    { name: 'sProjID', in: 'path', required: true, type: 'string', description: '프로젝트 ID' },
                    { name: 'sOption', in: 'query', required: true, type: 'string', description: 'filter' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "filterList": [
    { "Pfilter_Type": "1", "Pfilter_Sel_values": "1" }
  ]
}` }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=filterB',
                summary: '7-1) 필터 정보 조회 (불만족)',
                description: '불만족 응답 필터 정보를 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{"filterList": [...] }' }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=banner',
                summary: '8) 배너 정보 조회',
                description: '저장된 배너 옵션을 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{"bannerList": [...] }' }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=bannerB',
                summary: '8-1) 배너 정보 조회 (불만족)',
                description: '불만족 응답 배너 정보를 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{"bannerList": [...] }' }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=analysis',
                summary: '9) 분석 정보 조회',
                description: '저장된 분석 옵션을 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{"analysisList": [...] }' }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=analysisB',
                summary: '9-1) 분석 정보 조회 (불만족)',
                description: '불만족 응답 분석 정보를 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{"analysisList": [...] }' }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=weight',
                summary: '10) 가중치 정보 조회',
                description: '설정된 가중치 정보를 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{"weight": "1"}' }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=cate',
                summary: '11) 카테고리 정보 조회',
                description: '설정된 카테고리 정보를 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{"cate": "3"}' }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=fbwcall',
                summary: '12) 전체 옵션 조회 (필터/배너/가중치)',
                description: '필터, 배너, 가중치, 카테고리 정보를 한 번에 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: `{
  "filterList": [...],
  "bannerList": [...],
  "weight": "1",
  "cate": "3"
}` }]
            },
            {
                method: 'GET',
                path: '/ifSelOption/{sProjID}/{sUserToken}/{sCate}?sOption=fbawcBall',
                summary: '12-1) 전체 옵션 조회 (불만족)',
                description: '불만족 응답에 대한 전체 옵션을 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: `{
  "filterList": [...],
  "bannerList": [...],
  "analysisList": [...],
  "weight": "1"
}` }]
            },
            {
                method: 'GET',
                path: '/ifSurveys/{sProjID}/{sUserToken}',
                summary: '13) 결과값 조회',
                description: '설문 결과 통계 데이터를 조회합니다.',
                parameters: [
                    { name: 'QusQID', in: 'query', required: true, type: 'string', description: '문항 ID' },
                    { name: 'Orderby', in: 'query', required: false, type: 'string', description: '정렬 (1:기본, 2:빈도순)' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "AnsData": [
    { "rowval": "1", "ans_case": "100", "ans_percent": "20.0" }
  ]
}` }]
            },
            {
                method: 'GET',
                path: '/ifCrosstabs/{sProjID}/{sUserToken}',
                summary: '14) 교차분석 조회',
                description: '교차분석(Crosstab) 결과를 조회합니다.',
                parameters: [
                    { name: 'sXval', in: 'query', required: true, type: 'string', description: 'X축 설정 (ex: 1,103:2)' },
                    { name: 'sYval', in: 'query', required: true, type: 'string', description: 'Y축 설정 (ex: 5)' },
                    { name: 'Orderby', in: 'query', required: false, type: 'string', description: '정렬' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "AnsLabel": [...],
  "AnsData": [...]
}` }]
            },
            {
                method: 'GET',
                path: '/ifCrosstabsL/{sProjID}/{sUserToken}',
                summary: '14-2) 교차분석 조회 (L)',
                description: '교차분석(Crosstab) L타입 결과를 조회합니다.',
                parameters: [],
                responses: [{ code: 200, description: '성공', example: '{}' }]
            },
            {
                method: 'GET',
                path: '/ifCrosstabsA/{sProjID}/{sUserToken}',
                summary: '14-3) 교차분석 조회 (A)',
                description: '교차분석(Crosstab) A타입 결과를 조회합니다. (X축 다중 설정 등)',
                parameters: [{ name: 'sXval', in: 'query', required: true, type: 'string', description: 'ex: 1,103:2^7' }],
                responses: [{ code: 200, description: '성공', example: '{}' }]
            },
            {
                method: 'GET',
                path: '/ifOpenAI/{sProjID}/{sUserToken}',
                summary: '15) AI 분석 조회',
                description: 'OpenAI 분석 결과를 조회합니다.',
                parameters: [
                    { name: 'Flag', in: 'query', required: false, type: 'string', description: 'L: 리스트, T: 템플릿' },
                    { name: 'DispYN', in: 'query', required: false, type: 'string', description: 'Y/N' }
                ],
                responses: [{ code: 200, description: '성공', example: `{
  "openAIList": [
    { "Resp_ID": "...", "Response_Text": "..." }
  ]
}` }]
            }
        ]
    },
    {
        category: 'Section 2. Data Management (데이터 저장/관리)',
        items: [
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '1) 옵션 저장 (Filter)',
                description: '필터 옵션을 저장하거나 수정합니다.',
                requestBody: 'JSON (inOptionData)',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'filters' },
                    { name: 'editGroupFlag', in: 'body', required: true, type: 'string', description: 'I:추가, U:수정, D:삭제' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1' }]
            },
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '2) 배너 저장 (Banner)',
                description: '배너 옵션을 저장합니다.',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'banners' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1' }]
            },
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '3) 분석 저장 (Analysis)',
                description: '분석 옵션을 저장합니다.',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'analysis' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1' }]
            },
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '4) 가중치 저장 (Weight)',
                description: '가중치 옵션을 저장합니다.',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'weight' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1' }]
            },
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '5) 카테고리 저장 (Cate)',
                description: '카테고리 옵션을 저장합니다.',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'cate' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1' }]
            },
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '6) 공유 저장 (Share)',
                description: '공유 옵션을 저장합니다.',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'share' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1&skey=testtoken3' }]
            },
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '7) AI 분석 저장 (OpenAI)',
                description: 'AI 분석 결과를 저장합니다.',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'openAI' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1' }]
            },
            {
                method: 'POST',
                path: '/ifRecOption.aspx',
                summary: '8) AI 로그 저장 (OpenAILog)',
                description: 'AI 사용 로그를 저장합니다.',
                parameters: [
                    { name: 'inOptionType', in: 'body', required: true, type: 'string', description: 'openAILog' }
                ],
                responses: [{ code: 200, description: '성공', example: 'msg=ok&cnt=1' }]
            }
        ]
    }
];

// --- Components ---

const MethodBadge = ({ method }: { method: string }) => {
    const colors: Record<string, string> = {
        GET: 'bg-blue-600 text-white',
        POST: 'bg-green-600 text-white',
        PUT: 'bg-orange-500 text-white',
        DELETE: 'bg-red-600 text-white',
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold w-16 text-center inline-block ${colors[method] || 'bg-gray-500 text-white'}`}>
            {method}
        </span>
    );
};

const EndpointItem = ({ endpoint, isEditing, onUpdate, onDelete }: { 
    endpoint: EndpointDoc, 
    isEditing: boolean, 
    onUpdate: (updated: EndpointDoc) => void,
    onDelete: () => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localEndpoint, setLocalEndpoint] = useState(endpoint);

    useEffect(() => {
        setLocalEndpoint(endpoint);
    }, [endpoint]);

    const handleChange = (field: keyof EndpointDoc, value: any) => {
        const updated = { ...localEndpoint, [field]: value };
        setLocalEndpoint(updated);
        onUpdate(updated);
    };

    const handleResponseChange = (idx: number, field: keyof ResponseDoc, value: any) => {
        const newResponses = [...(localEndpoint.responses || [])];
        newResponses[idx] = { ...newResponses[idx], [field]: value };
        handleChange('responses', newResponses);
    };

    const handleAddResponse = () => {
         const newResponses = [...(localEndpoint.responses || []), { code: 200, description: 'OK', example: '{}' }];
         handleChange('responses', newResponses);
    };

    const handleDeleteResponse = (idx: number) => {
         const newResponses = [...(localEndpoint.responses || [])];
         newResponses.splice(idx, 1);
         handleChange('responses', newResponses);
    };

    const borderColors: Record<string, string> = {
        GET: 'border-blue-200',
        POST: 'border-green-200',
    };
    const bgColors: Record<string, string> = {
        GET: 'bg-blue-50/50',
        POST: 'bg-green-50/50',
    };

    const methodColor = endpoint.method;
    
    return (
        <div className={`mb-4 border rounded-lg overflow-hidden ${borderColors[methodColor] || 'border-gray-200'}`}>
            <div 
                className={`p-3 flex items-center justify-between cursor-pointer ${bgColors[methodColor] || 'bg-gray-50'}`}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;
                    setIsOpen(!isOpen);
                }}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {isEditing ? (
                        <div className="flex gap-2 items-center w-full">
                            <select 
                                value={localEndpoint.method} 
                                onChange={(e) => handleChange('method', e.target.value)}
                                className="px-2 py-1 rounded text-xs font-bold border border-gray-300"
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                            </select>
                            <input 
                                type="text" 
                                value={localEndpoint.path}
                                onChange={(e) => handleChange('path', e.target.value)}
                                className="font-mono text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 flex-1"
                            />
                            <input 
                                type="text" 
                                value={localEndpoint.summary}
                                onChange={(e) => handleChange('summary', e.target.value)}
                                className="text-sm text-gray-500 bg-white border border-gray-300 rounded px-2 py-1 flex-1 hidden sm:block"
                            />
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <MethodBadge method={endpoint.method} />
                            <span className="font-mono text-sm font-medium text-gray-700 truncate">{endpoint.path}</span>
                            <span className="text-sm text-gray-500 truncate hidden sm:inline">- {endpoint.summary}</span>
                        </>
                    )}
                </div>
                {!isEditing && (isOpen ? <ChevronDown size={20} className="text-gray-500 shrink-0" /> : <ChevronRight size={20} className="text-gray-500 shrink-0" />)}
            </div>

            {isOpen && (
                <div className="p-4 bg-white border-t border-gray-100">
                    {isEditing ? (
                        <textarea 
                            value={localEndpoint.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full text-gray-600 text-sm mb-4 border border-gray-300 rounded p-2"
                            rows={3}
                            placeholder="Description..."
                        />
                    ) : (
                        <p className="text-gray-600 text-sm mb-4">{endpoint.description}</p>
                    )}
                    
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-800 mb-2 border-b pb-1">Parameters</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2">Name</th>
                                            <th className="px-3 py-2">In</th>
                                            <th className="px-3 py-2">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {endpoint.parameters.map((param, idx) => (
                                            <tr key={idx} className="border-b last:border-0">
                                                <td className="px-3 py-2 font-mono">
                                                    {param.name}
                                                    {param.required && <span className="text-red-500 ml-1">*</span>}
                                                </td>
                                                <td className="px-3 py-2">{param.in}</td>
                                                <td className="px-3 py-2 text-gray-600">
                                                    <div className="font-mono text-xs text-gray-400 mb-0.5">{param.type}</div>
                                                    {param.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-2 border-b pb-1 flex justify-between items-center">
                            Responses
                            {isEditing && (
                                <button onClick={handleAddResponse} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                                    + Add Response
                                </button>
                            )}
                        </h4>
                        <div className="space-y-4">
                            {endpoint.responses.map((resp, idx) => (
                                <div key={idx} className="text-sm border-b pb-4 last:border-0">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="number" 
                                                    value={resp.code} 
                                                    onChange={(e) => handleResponseChange(idx, 'code', parseInt(e.target.value))}
                                                    className="w-16 border rounded px-2 py-1 font-mono font-bold"
                                                    placeholder="200"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={resp.description} 
                                                    onChange={(e) => handleResponseChange(idx, 'description', e.target.value)}
                                                    className="flex-1 border rounded px-2 py-1"
                                                    placeholder="Description"
                                                />
                                                <button onClick={() => handleDeleteResponse(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={resp.schema || ''} 
                                                    onChange={(e) => handleResponseChange(idx, 'schema', e.target.value)}
                                                    className="flex-1 border rounded px-2 py-1 font-mono text-xs text-gray-500"
                                                    placeholder="Schema Reference (optional)"
                                                />
                                            </div>
                                            <div>
                                                <textarea 
                                                    value={resp.example || ''} 
                                                    onChange={(e) => handleResponseChange(idx, 'example', e.target.value)}
                                                    className="w-full h-24 border rounded px-2 py-1 font-mono text-xs bg-gray-50"
                                                    placeholder='{"example": "json"}'
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-4 mb-2">
                                                <div className="w-12 font-mono font-bold shrink-0">{resp.code}</div>
                                                <div className="flex-1">
                                                    <div className="text-gray-700">{resp.description}</div>
                                                    {resp.schema && (
                                                        <div className="mt-1 text-xs text-gray-500 font-mono">
                                                            Schema: {resp.schema}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {resp.example && (
                                                <div className="bg-gray-900 text-gray-200 p-3 rounded-md font-mono text-xs overflow-x-auto mt-2">
                                                    <pre>{resp.example}</pre>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SchemaItem = ({ schema, isEditing, onUpdate, onDelete }: { 
    schema: SchemaDoc, 
    isEditing: boolean, 
    onUpdate: (updated: SchemaDoc) => void,
    onDelete: () => void
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localSchema, setLocalSchema] = useState(schema);

    useEffect(() => {
        setLocalSchema(schema);
    }, [schema]);

    const handleChange = (field: keyof SchemaDoc, value: string) => {
        const updated = { ...localSchema, [field]: value };
        setLocalSchema(updated);
        onUpdate(updated);
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-white mb-4">
             <div 
                className="p-3 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === 'INPUT') return;
                    setIsOpen(!isOpen);
                }}
            >
                <div className="flex items-center gap-2 flex-1">
                    {isEditing ? (
                        <>
                             <input 
                                type="text" 
                                value={localSchema.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="font-bold text-gray-700 border border-gray-300 rounded px-2 py-1"
                            />
                            <input 
                                type="text" 
                                value={localSchema.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="text-sm text-gray-500 font-normal border border-gray-300 rounded px-2 py-1 flex-1"
                            />
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="font-bold text-gray-700">{schema.name}</span>
                            <span className="text-sm text-gray-500 font-normal">{schema.description}</span>
                        </>
                    )}
                </div>
                {!isEditing && (isOpen ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />)}
            </div>
            
            {isOpen && (
                <div className="p-4 border-t">
                     <table className="w-full text-sm text-left mb-4">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 w-1/4">Property</th>
                                <th className="px-3 py-2 w-1/4">Type</th>
                                <th className="px-3 py-2">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schema.properties.map((prop, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                    <td className="px-3 py-2 font-mono text-gray-800">
                                        {prop.name}
                                        {prop.required && <span className="text-red-500 ml-1">*</span>}
                                    </td>
                                    <td className="px-3 py-2 text-blue-600 font-mono text-xs">{prop.type}</td>
                                    <td className="px-3 py-2 text-gray-600">{prop.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {schema.example && (
                        <div className="mt-4">
                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Example JSON</h5>
                             {isEditing ? (
                                <textarea 
                                    value={schema.example || ''}
                                    onChange={(e) => handleChange('example', e.target.value)}
                                    className="w-full h-32 bg-gray-50 border rounded p-2 font-mono text-xs"
                                    placeholder='{"example": "json"}'
                                />
                             ) : (
                                <div className="bg-gray-900 text-gray-200 p-3 rounded-md font-mono text-xs overflow-x-auto">
                                    <pre>{schema.example}</pre>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function ApiDocsPage() {
    const [endpointData, setEndpointData] = useState<EndpointCategory[]>(initialEndpoints);
    const [schemaData, setSchemaData] = useState<SchemaDoc[]>(initialSchemas);
    const [isEditing, setIsEditing] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const savedEndpoints = localStorage.getItem('api-docs-endpoints');
        const savedSchemas = localStorage.getItem('api-docs-schemas');
        
        if (savedEndpoints) {
            try {
                setEndpointData(JSON.parse(savedEndpoints));
            } catch (e) {
                console.error("Failed to parse saved endpoints", e);
            }
        }
        if (savedSchemas) {
            try {
                setSchemaData(JSON.parse(savedSchemas));
            } catch (e) {
                console.error("Failed to parse saved schemas", e);
            }
        }
        setHasLoaded(true);
    }, []);

    useEffect(() => {
        if (hasLoaded) {
            localStorage.setItem('api-docs-endpoints', JSON.stringify(endpointData));
            localStorage.setItem('api-docs-schemas', JSON.stringify(schemaData));
        }
    }, [endpointData, schemaData, hasLoaded]);

    const handleReset = () => {
        if (confirm("정말 초기 데이터로 복구하시겠습니까? 모든 변경사항이 사라집니다.")) {
            setEndpointData(initialEndpoints);
            setSchemaData(initialSchemas);
        }
    };

    const handleUpdateEndpoint = (catIndex: number, itemIndex: number, updated: EndpointDoc) => {
        const newData = [...endpointData];
        newData[catIndex].items[itemIndex] = updated;
        setEndpointData(newData);
    };

    const handleDeleteEndpoint = (catIndex: number, itemIndex: number) => {
        if(confirm("이 엔드포인트를 삭제하시겠습니까?")) {
            const newData = [...endpointData];
            newData[catIndex].items.splice(itemIndex, 1);
            setEndpointData(newData);
        }
    };
    
    const handleAddEndpoint = (catIndex: number) => {
        const newData = [...endpointData];
        newData[catIndex].items.push({
            method: 'GET',
            path: '/new-endpoint',
            summary: '새 엔드포인트',
            description: '설명을 입력하세요',
            parameters: [],
            responses: [{ code: 200, description: 'Success' }]
        });
        setEndpointData(newData);
    };

    const handleUpdateSchema = (index: number, updated: SchemaDoc) => {
        const newData = [...schemaData];
        newData[index] = updated;
        setSchemaData(newData);
    };

    const handleDeleteSchema = (index: number) => {
        if(confirm("이 스키마를 삭제하시겠습니까?")) {
            const newData = [...schemaData];
            newData.splice(index, 1);
            setSchemaData(newData);
        }
    };

    const handleAddSchema = () => {
        setSchemaData([...schemaData, {
            name: 'NewSchema',
            description: '새 스키마 설명',
            properties: []
        }]);
    };

    // Filtered Data based on Search
    const filteredEndpointData = useMemo(() => {
        if (!searchQuery.trim()) return endpointData;
        
        const lowerQuery = searchQuery.toLowerCase();
        return endpointData.map(category => ({
            ...category,
            items: category.items.filter(item => 
                item.path.toLowerCase().includes(lowerQuery) ||
                item.summary.toLowerCase().includes(lowerQuery) ||
                (item.description && item.description.toLowerCase().includes(lowerQuery))
            )
        })).filter(category => category.items.length > 0);
    }, [endpointData, searchQuery]);


    if (!hasLoaded) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Database size={20} className="text-blue-600"/>
                            Analysis Tool API
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-normal">ver 3.5</span>
                        </h1>
                    </div>

                    <div className="flex-1 max-w-md mx-4 relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="API 검색 (Path, Summary...)" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-md text-sm transition-all outline-none"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                         {isEditing ? (
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                            >
                                <Save size={16} />
                                <span className="hidden sm:inline">완료</span>
                            </button>
                         ) : (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors border"
                            >
                                <Edit3 size={16} />
                                <span className="hidden sm:inline">편집</span>
                            </button>
                         )}
                        
                        {isEditing && (
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 transition-colors border border-red-200"
                                title="초기 데이터로 리셋"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                </div>
                 {/* Mobile Search */}
                 <div className="sm:hidden px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="API 검색..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md text-sm outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Intro */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-10">
                    <h2 className="text-lg font-bold text-blue-900 mb-2">개요 (Overview)</h2>
                    <p className="text-blue-800 text-sm leading-relaxed">
                        본 문서는 분석툴 인터페이스 명세서 ver3.5를 기반으로 작성되었습니다. 
                        설문 조사 결과, 교차 분석, 문항 정보 등을 조회하고 분석 옵션을 설정하는 API 그룹입니다.
                        모든 API 호출 시 <code>sProjID</code> (프로젝트 ID)와 <code>sUserToken</code> (사용자 토큰)이 필수적으로 요구됩니다.
                    </p>
                </div>

                {/* Endpoints */}
                <div className="mb-12">
                    {filteredEndpointData.length > 0 ? (
                        filteredEndpointData.map((section, catIdx) => (
                            <div key={section.category} className="mb-10">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                    {section.category}
                                    <span className="text-sm font-normal text-gray-500 ml-auto">({section.items.length} Endpoints)</span>
                                </h2>
                                <div className="space-y-1">
                                    {section.items.map((endpoint, itemIdx) => (
                                        <EndpointItem 
                                            key={itemIdx} 
                                            endpoint={endpoint} 
                                            isEditing={isEditing}
                                            onUpdate={(updated) => handleUpdateEndpoint(catIdx, itemIdx, updated)}
                                            onDelete={() => handleDeleteEndpoint(catIdx, itemIdx)}
                                        />
                                    ))}
                                    {isEditing && (
                                        <button 
                                            onClick={() => handleAddEndpoint(catIdx)}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2 mt-2 transition-colors"
                                        >
                                            <Plus size={16} /> Add Endpoint
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-10">
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>

                {/* Schemas */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
                        Schemas
                        <span className="text-sm font-normal text-gray-500 ml-auto">Common Data Structures</span>
                    </h2>
                    <div className="grid gap-4">
                        {schemaData.map((schema, idx) => (
                            <SchemaItem 
                                key={idx} 
                                schema={schema} 
                                isEditing={isEditing}
                                onUpdate={(updated) => handleUpdateSchema(idx, updated)}
                                onDelete={() => handleDeleteSchema(idx)}
                            />
                        ))}
                         {isEditing && (
                             <button 
                                onClick={handleAddSchema}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2 mt-2 transition-colors"
                            >
                                <Plus size={16} /> Add Schema
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="max-w-5xl mx-auto px-4 mt-12 pt-8 border-t text-center text-gray-400 text-sm pb-10">
                Analysis Tool Interface Specification ver3.5 | Implemented by Gemini
            </div>
        </div>
    );
}
