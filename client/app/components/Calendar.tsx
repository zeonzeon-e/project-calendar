import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isAfter,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Circle,
  CheckSquare,
  Star,
} from "lucide-react";
import { Project, Todo } from "../types";

interface CalendarProps {
  projects: Project[];
  todos: Todo[];
  onEditProject: (project: Project) => void;
  onFinishProject: (project: Project) => void;
  onCreateProject: (date: Date) => void;
  onCreateTodo: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

const Calendar: React.FC<CalendarProps> = ({
  projects,
  todos,
  onEditProject,
  onFinishProject,
  onCreateProject,
  onCreateTodo,
  onDateSelect,
  selectedDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const today = new Date();

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let projCount = 0;
    let todoCount = 0;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // Projects: If any critical date is in this month
    projCount = projects.filter((p) => {
      const d1 = parseISO(p.webAppPeriodStart);
      const d2 = parseISO(p.endDate);
      return (
        ((isAfter(d1, monthStart) || isSameDay(d1, monthStart)) &&
          (isAfter(monthEnd, d1) || isSameDay(d1, monthEnd))) ||
        ((isAfter(d2, monthStart) || isSameDay(d2, monthStart)) &&
          (isAfter(monthEnd, d2) || isSameDay(d2, monthEnd)))
      );
    }).length;

    // Todos: If date is in this month
    todoCount = todos.filter((t) => {
      const d = parseISO(t.date);
      return isSameMonth(d, currentMonth);
    }).length;

    return { projCount, todoCount };
  }, [projects, todos, currentMonth]);

  const getProjectsForDay = (date: Date) => {
    return projects.filter((project) => {
      const daysToCheck = [project.webAppPeriodStart, project.fieldWorkPeriodStart];
      return daysToCheck.some((d) => d && isSameDay(parseISO(d), date));
    });
  };

  const getTodosForDay = (date: Date) => {
    return todos.filter((todo) => isSameDay(parseISO(todo.date), date));
  };

  const overdueProjects = projects.filter(
    (p) => p.status === "active" && isAfter(today, parseISO(p.endDate))
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full text-black">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentMonth, "yyyy년 MM월")}
          </h2>
          <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            <span>프로젝트: {monthlyStats.projCount}</span>
            <span className="w-px h-3 bg-gray-300"></span>
            <span>할일: {monthlyStats.todoCount}</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white rounded-full shadow-sm border border-gray-200 text-gray-600"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white rounded-full shadow-sm border border-gray-200 text-gray-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCreateTodo}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 shadow-sm transition-colors"
          >
            + 할일 생성하기
          </button>
          <button
            onClick={() => onCreateProject(today)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm"
          >
            + 새 프로젝트 생성
          </button>
        </div>
      </div>

      {/* 종료 알림 배너 */}
      {overdueProjects.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 shrink-0">
          <div className="flex items-center space-x-2 text-amber-800 font-medium mb-2">
            <AlertTriangle size={18} />
            <span>종료일이 경과한 프로젝트 ({overdueProjects.length}건)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center bg-white border border-amber-300 rounded-md px-3 py-1 text-sm shadow-sm"
              >
                <span className="mr-2 text-gray-800 truncate max-w-[150px]">
                  {p.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFinishProject(p);
                  }}
                  className="text-amber-600 hover:text-amber-800 text-xs font-bold uppercase tracking-wider border-l border-amber-200 pl-2"
                >
                  종료
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 bg-gray-200 gap-px flex-1 overflow-auto">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide sticky top-0 z-10"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, dayIdx) => {
          const dayProjects = getProjectsForDay(day);
          const dayTodos = getTodosForDay(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toString()}
              className={`min-h-[120px] p-2 relative group transition-colors cursor-pointer 
                        ${
                          isSelected
                            ? "bg-blue-50 ring-2 ring-inset ring-blue-400"
                            : "bg-white hover:bg-gray-50"
                        } 
                        ${!isCurrentMonth ? "bg-gray-50/50 text-gray-400" : ""}
                    `}
              onClick={() => onDateSelect(day)}
            >
              <div className={`flex justify-between items-center mb-1`}>
                <div className="flex items-center space-x-1">
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full"
                        : "text-gray-700"
                    } ${!isCurrentMonth ? "text-gray-400" : ""}`}
                  >
                    {format(day, "d")}
                  </span>
                  {(dayProjects.length > 0 || dayTodos.length > 0) && (
                    <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1 rounded">
                      프로젝트:{dayProjects.length} 할일:{dayTodos.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                {/* Projects */}
                {dayProjects.map((project) => {
                  const isWebAppStart = isSameDay(
                    parseISO(project.webAppPeriodStart),
                    day
                  );
                  const isFieldWorkStart = project.fieldWorkPeriodStart && isSameDay(
                    parseISO(project.fieldWorkPeriodStart),
                    day
                  );

                  let badgeColor = "bg-gray-100 text-gray-700 border-gray-200";
                  if (project.status === "finished") {
                    badgeColor =
                      "bg-gray-100 text-gray-400 line-through border-gray-200";
                  } else if (isFieldWorkStart) {
                    badgeColor =
                      "bg-indigo-100 text-indigo-800 border-indigo-200 border";
                  } else if (isWebAppStart) {
                    badgeColor =
                      "bg-blue-100 text-blue-800 border-blue-200 border";
                  }

                  return (
                    <div
                      key={project.id}
                      className={`text-xs p-1.5 rounded-md border shadow-sm cursor-pointer hover:opacity-80 ${badgeColor} flex flex-col gap-1`}
                      title={project.title}
                    >
                      <div className="font-semibold truncate">
                        {project.title}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div
                          className={`flex items-center space-x-0.5 ${
                            project.isWebAppFinished
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {project.isWebAppFinished ? (
                            <CheckCircle size={10} />
                          ) : (
                            <Circle size={10} />
                          )}
                          <span className="text-[10px]">웹업</span>
                        </div>
                        <div
                          className={`flex items-center space-x-0.5 ${
                            project.isFieldWorkStarted
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        >
                          {project.isFieldWorkStarted ? (
                            <PlayCircle size={10} />
                          ) : (
                            <Circle size={10} />
                          )}
                          <span className="text-[10px]">실사</span>
                        </div>
                      </div>
                      {isFieldWorkStart && (
                        <div className="text-[9px] font-bold text-indigo-700 mt-0.5">
                          실사시작
                        </div>
                      )}
                      {isWebAppStart && (
                        <div className="text-[9px] text-blue-700 mt-0.5">
                          웹시작
                        </div>
                      )}
                    </div>
                  );
                })}

                                    {/* Todos */}
                                    {dayTodos.map((todo) => {
                                        return (
                                            <div
                                                key={todo.id}
                                                className={`text-xs p-1.5 rounded-md border shadow-sm cursor-pointer hover:opacity-80 flex flex-col gap-0.5
                                                    ${todo.isFinished ? 'bg-gray-100 text-gray-400 line-through border-gray-200' : 
                                                      'bg-green-50 text-gray-800 border-green-200'}
                                                `}
                                                title={todo.content || todo.title}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <CheckSquare size={10} className={`shrink-0 ${todo.isFinished ? 'text-gray-400' : 'text-green-600'}`} />
                                                    <div className="truncate font-medium">{todo.title}</div>
                                                </div>
                                                {!todo.isFinished && (
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} size={7} className={s <= todo.importance ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
