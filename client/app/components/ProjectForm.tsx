import React, { useState, useEffect } from "react";
import { Project } from "../types";

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: (data: Omit<Project, "id" | "status">) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
    const [formData, setFormData] = useState({
        projectNumber: initialData?.projectNumber || "",
        title: initialData?.title || "",
        webAppPeriodStart: initialData?.webAppPeriodStart || "",
        webAppPeriodEnd: initialData?.webAppPeriodEnd || "",
        fieldWorkPeriodStart: initialData?.fieldWorkPeriodStart || "",
        fieldWorkPeriodEnd: initialData?.fieldWorkPeriodEnd || "",
        endDate: initialData?.endDate || "",
        remarks: initialData?.remarks || "",
        frequency: initialData?.frequency || "",
        isWebAppFinished: initialData?.isWebAppFinished || false,
        isFieldWorkStarted: initialData?.isFieldWorkStarted || false,
    });

    const handleChange = (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
            ) => {
                const { name, value } = e.target;
                setFormData((prev) => {
                    const newData = { ...prev, [name]: value };
                    // 실사 종료일이 변경되면 최종 종료일도 동일하게 업데이트 (사용자가 이후에 수정 가능)
                    if (name === "fieldWorkPeriodEnd") {
                        newData.endDate = value;
                    }
                    return newData;
                });
            };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-black">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            프로젝트 번호
          </label>
          <input
            type="text"
            name="projectNumber"
            required
            value={formData.projectNumber}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="예: P-001"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            프로젝트 제목
          </label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="프로젝트명을 입력하세요"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            웹업 시작일
          </label>
          <input
            type="date"
            name="webAppPeriodStart"
            required
            value={formData.webAppPeriodStart}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            웹업 종료일
          </label>
          <input
            type="date"
            name="webAppPeriodEnd"
            required
            value={formData.webAppPeriodEnd}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            실사 시작일
          </label>
          <input
            type="date"
            name="fieldWorkPeriodStart"
            value={formData.fieldWorkPeriodStart}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            실사 종료일
          </label>
          <input
            type="date"
            name="fieldWorkPeriodEnd"
            value={formData.fieldWorkPeriodEnd}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          최종 종료일
        </label>
        <input
          type="date"
          name="endDate"
          required
          value={formData.endDate}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md font-semibold bg-red-50"
        />
      </div>

                  <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>

                      <textarea

                          name="remarks"

                          value={formData.remarks}

                          onChange={handleChange}

                          rows={3}

                          className="w-full p-2 border border-gray-300 rounded-md"

                          placeholder="추가 참고사항..."

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

                          <option value="매년">매년</option>

                      </select>

                  </div>

      

                  <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isWebAppFinished"
            name="isWebAppFinished"
            checked={formData.isWebAppFinished}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isWebAppFinished: e.target.checked,
              }))
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isWebAppFinished"
            className="ml-2 block text-sm text-gray-900"
          >
            웹업 완료 여부
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFieldWorkStarted"
            name="isFieldWorkStarted"
            checked={formData.isFieldWorkStarted}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isFieldWorkStarted: e.target.checked,
              }))
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isFieldWorkStarted"
            className="ml-2 block text-sm text-gray-900"
          >
            실사 시작 여부
          </label>
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
          {initialData ? "수정 완료" : "프로젝트 생성"}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
