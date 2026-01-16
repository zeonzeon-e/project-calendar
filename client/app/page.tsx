"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Project, Todo } from "./types";
import * as api from "./api";
import { runScheduler } from "./utils/scheduler";
import Calendar from "./components/Calendar";
import SidePanel from "./components/SidePanel";
import Modal from "./components/Modal";
import ProjectForm from "./components/ProjectForm";
import TodoForm from "./components/TodoForm";
import { format } from "date-fns";
import { FileText, Archive } from "lucide-react";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [finishedProjects, setFinishedProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [initialDate, setInitialDate] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'project' | 'todo', item: Project | Todo } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [projectsData, finishedProjectsData, todosData] = await Promise.all([
        api.getProjects(),
        api.getFinishedProjects(),
        api.getTodos(),
      ]);
      setProjects(projectsData);
      setFinishedProjects(finishedProjectsData);
      setTodos(todosData);
    } catch (error) {
      console.error("데이터를 불러오지 못했습니다:", error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await runScheduler(); // Run maintenance tasks first
      } catch (error) {
        console.error("스케줄러 실행 중 오류 발생:", error);
      }
      await fetchData();
      
      // Request notification permission
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    })();
  }, []);

  // Heartbeat Scheduler (Keep server alive)
  useEffect(() => {
    const sendHeartbeat = async () => {
        try {
            await fetch('/api/heartbeat');
        } catch (e) {
            // Server might be down, ignore
        }
    };

    // Send immediately on load
    sendHeartbeat();

    // Send every 2 seconds
    const intervalId = setInterval(sendHeartbeat, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Notification Scheduler (Check every minute)
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      // Check if it's 5:00 PM (17:00)
      if (now.getHours() === 17 && now.getMinutes() === 0) {
        const todayStr = format(now, "yyyy-MM-dd");

        // Check Projects
        projects.forEach(p => {
          if (p.notificationEnabled) {
             const triggers = [p.webAppPeriodStart, p.fieldWorkPeriodStart, p.endDate];
             if (triggers.includes(todayStr)) {
                 new Notification(`프로젝트 알림: ${p.title}`, {
                     body: `오늘 프로젝트 일정("${p.title}")이 있습니다. 확인해주세요.`,
                     icon: '/file.svg' // Optional icon
                 });
             }
          }
        });

        // Check Todos
        todos.forEach(t => {
            if (t.notificationEnabled && t.date === todayStr && !t.isFinished) {
                new Notification(`할일 알림: ${t.title}`, {
                    body: `오늘 마감인 할일("${t.title}")이 있습니다.`,
                    icon: '/file.svg'
                });
            }
        });
      }
    };

    const intervalId = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [projects, todos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input/Textarea 등 포커스 중일 때는 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === "Space") {
        e.preventDefault();
        handleCreateTodoClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCreateProjectClick = (date: Date) => {
    setEditingProject(null);
    setInitialDate(format(date, "yyyy-MM-dd"));
    setIsProjectModalOpen(true);
  };

  const handleCreateTodoClick = () => {
    if (selectedDate) {
      setEditingTodo(null);
      setInitialDate(format(selectedDate, "yyyy-MM-dd"));
      setIsTodoModalOpen(true);
    } else {
      alert("할일을 생성할 날짜를 먼저 선택해주세요.");
    }
  };

  const handleEditProjectClick = (project: Project) => {
    setEditingProject(project);
    setInitialDate("");
    setIsProjectModalOpen(true);
  };

  const handleEditTodoClick = (todo: Todo) => {
    setEditingTodo(todo);
    setInitialDate(todo.date);
    setIsTodoModalOpen(true);
  };

  const handleToggleWebAppFinished = async (project: Project) => {
    try {
      await api.updateProject(project.id, {
        isWebAppFinished: !project.isWebAppFinished,
      });
      fetchData();
    } catch (error) {
      console.error("상태 업데이트 실패:", error);
    }
  };

  const handleToggleFieldWorkStarted = async (project: Project) => {
    try {
      await api.updateProject(project.id, {
        isFieldWorkStarted: !project.isFieldWorkStarted,
      });
      fetchData();
    } catch (error) {
      console.error("상태 업데이트 실패:", error);
    }
  };

  const handleToggleTodoFinished = async (todo: Todo) => {
    try {
      await api.updateTodo(todo.id, { isFinished: !todo.isFinished });
      fetchData();
    } catch (error) {
      console.error("할일 상태 업데이트 실패:", error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    if (!todo.frequency && !todo.parentId) {
        if (confirm("정말 이 할일을 삭제하시겠습니까?")) {
            try {
                await api.deleteTodo(todoId);
                fetchData();
            } catch (error) {
                console.error("할일 삭제 실패:", error);
            }
        }
        return;
    }

    setDeleteTarget({ type: 'todo', item: todo });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (!project.frequency && !project.parentId) {
        if (confirm("정말 이 프로젝트를 삭제하시겠습니까?")) {
            try {
                await api.deleteProject(projectId);
                fetchData();
            } catch (error) {
                console.error("프로젝트 삭제 실패:", error);
            }
        }
        return;
    }

    setDeleteTarget({ type: 'project', item: project });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async (mode: 'single' | 'future') => {
      if (!deleteTarget) return;
      
      try {
          if (deleteTarget.type === 'project') {
              await api.deleteProject(deleteTarget.item.id, mode);
          } else {
              await api.deleteTodo(deleteTarget.item.id, mode);
          }
          fetchData();
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
      } catch (error) {
          console.error("삭제 실패:", error);
      }
  };

  const handleFinishProjectClick = async (project: Project) => {
    if (confirm(`"${project.title}" 프로젝트를 종료 처리하시겠습니까?`)) {
      try {
        await api.updateProject(project.id, { status: "finished" });
        await runScheduler(); // Run scheduler to archive the project immediately
        fetchData();
      } catch (error) {
        console.error("프로젝트 종료 처리에 실패했습니다:", error);
      }
    }
  };

  const handleProjectSubmit = async (data: Omit<Project, "id" | "status">) => {
    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, data);
      } else {
        await api.createProject(data);
      }
      await runScheduler();
      fetchData();
      setIsProjectModalOpen(false);
    } catch (error) {
      console.error("프로젝트 저장에 실패했습니다:", error);
    }
  };

  const handleTodoSubmit = async (data: Omit<Todo, "id" | "isFinished">) => {
    try {
      if (editingTodo) {
        await api.updateTodo(editingTodo.id, data);
      } else {
        await api.createTodo(data);
      }
      await runScheduler();
      fetchData();
      setIsTodoModalOpen(false);
    } catch (error) {
      console.error("할일 저장에 실패했습니다:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col">
      <header className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            프로젝트 관리 시스템
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            일정, 마감일 및 프로젝트 생애주기를 관리하세요.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Link 
              href="/finished-projects" 
              className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <Archive size={16} />
              <span className="hidden sm:inline">완료 목록</span>
            </Link>
            <Link 
              href="/api-docs" 
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">API 문서</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden h-[calc(100vh-120px)]">
        {/* 왼쪽: 캘린더 (70%) */}
        <div className="flex-[7] h-full overflow-hidden">
          <Calendar
            projects={projects}
            finishedProjects={finishedProjects}
            todos={todos}
            onCreateProject={handleCreateProjectClick}
            onCreateTodo={handleCreateTodoClick}
            onEditProject={handleEditProjectClick}
            onFinishProject={handleFinishProjectClick}
            onDateSelect={handleDateSelect}
            onEditTodo={handleEditTodoClick}
            onDeleteTodo={handleDeleteTodo}
            onToggleTodoFinished={handleToggleTodoFinished}
            selectedDate={selectedDate}
          />
        </div>
        {/* 오른쪽: 사이드 패널 (30%) */}
        <div className="flex-[3] h-full overflow-hidden">
          <SidePanel
            date={selectedDate}
            projects={projects}
            todos={todos}
            onEditProject={handleEditProjectClick}
            onDeleteProject={handleDeleteProject}
            onEditTodo={handleEditTodoClick}
            onToggleWebAppFinished={handleToggleWebAppFinished}
            onToggleFieldWorkStarted={handleToggleFieldWorkStarted}
            onToggleTodoFinished={handleToggleTodoFinished}
            onDeleteTodo={handleDeleteTodo}
          />
        </div>
      </div>

      {/* 프로젝트 모달 */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title={editingProject ? "프로젝트 편집" : "새 프로젝트 생성"}
      >
        <ProjectForm
          initialData={
            editingProject ||
            (initialDate
              ? ({
                  title: "",
                  projectNumber: "",
                  webAppPeriodStart: initialDate,
                  webAppPeriodEnd: initialDate,
                  fieldWorkPeriodStart: "",
                  fieldWorkPeriodEnd: "",
                  endDate: initialDate,
                  remarks: "",
                  frequency: "",
                  isWebAppFinished: false,
                  id: "",
                  status: "active",
                } as Project)
              : undefined)
          }
          onSubmit={handleProjectSubmit}
          onCancel={() => setIsProjectModalOpen(false)}
        />
      </Modal>

      {/* 할일 모달 */}
      <Modal
        isOpen={isTodoModalOpen}
        onClose={() => setIsTodoModalOpen(false)}
        title={editingTodo ? "할일 편집" : "새 할일 생성"}
      >
        <TodoForm
          date={initialDate}
          initialData={editingTodo || undefined}
          onSubmit={handleTodoSubmit}
          onCancel={() => setIsTodoModalOpen(false)}
        />
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="반복 일정 삭제"
      >
        <div className="space-y-4 text-center text-black">
            <p className="text-gray-600 mb-4">
                이 항목은 반복되는 일정의 일부입니다.<br/>
                삭제 방식을 선택해주세요.
            </p>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => confirmDelete('single')}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                >
                    이 일정만 삭제
                    <span className="block text-xs font-normal text-gray-500 mt-1">이 날짜의 항목만 삭제됩니다.</span>
                </button>
                <button
                    onClick={() => confirmDelete('future')}
                    className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                >
                    이후 일정 모두 삭제
                    <span className="block text-xs font-normal text-red-400 mt-1">이 날짜를 포함한 향후 모든 일정이 삭제됩니다.</span>
                </button>
            </div>
            <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="mt-2 text-gray-400 text-sm hover:text-gray-600 underline"
            >
                취소
            </button>
        </div>
      </Modal>
    </main>
  );
}

