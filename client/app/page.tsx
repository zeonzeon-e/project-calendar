"use client";

import React, { useState, useEffect } from "react";
import { Project, Todo } from "./types";
import * as api from "./api";
import { runScheduler } from "./utils/scheduler";
import Calendar from "./components/Calendar";
import SidePanel from "./components/SidePanel";
import Modal from "./components/Modal";
import ProjectForm from "./components/ProjectForm";
import TodoForm from "./components/TodoForm";
import DataControls from "./components/DataControls";
import { format } from "date-fns";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [initialDate, setInitialDate] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const fetchData = async () => {
    try {
      const [projectsData, todosData] = await Promise.all([
        api.getProjects(),
        api.getTodos(),
      ]);
      setProjects(projectsData);
      setTodos(todosData);
    } catch (error) {
      console.error("데이터를 불러오지 못했습니다:", error);
    }
  };

  useEffect(() => {
    (async () => {
      await runScheduler(); // Run maintenance tasks first
      await fetchData();
    })();
  }, []);

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
    if (confirm("정말 이 할일을 삭제하시겠습니까?")) {
      try {
        await api.deleteTodo(todoId);
        fetchData();
      } catch (error) {
        console.error("할일 삭제 실패:", error);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm("정말 이 프로젝트를 삭제하시겠습니까?")) {
      try {
        await api.deleteProject(projectId);
        fetchData();
      } catch (error) {
        console.error("프로젝트 삭제 실패:", error);
      }
    }
  };

  const handleFinishProjectClick = async (project: Project) => {
    if (confirm(`"${project.title}" 프로젝트를 종료 처리하시겠습니까?`)) {
      try {
        await api.updateProject(project.id, { status: "finished" });
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
            <DataControls onDataImported={fetchData} />
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <button
                onClick={handleCreateTodoClick}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 shadow-sm transition-colors"
            >
                + 할일 생성하기
            </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden h-[calc(100vh-120px)]">
        {/* 왼쪽: 캘린더 (70%) */}
        <div className="flex-[7] h-full overflow-hidden">
          <Calendar
            projects={projects}
            todos={todos}
            onCreateProject={handleCreateProjectClick}
            onCreateTodo={handleCreateTodoClick}
            onEditProject={handleEditProjectClick}
            onFinishProject={handleFinishProjectClick}
            onDateSelect={handleDateSelect}
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
    </main>
  );
}
