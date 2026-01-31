"use client";

import { useCode } from "@/contexts/code/code-context";
import { useDialog, DialogType } from "@/contexts/dialog-context";
import CodeConfigureProjectDialog from "@/components/dialogs/code/configureProjectDialog/code-configure-project-dialog";
import ProjectDetailsDialog from "@/components/dialogs/code/project-details-dialog";
import { CodeConfiguredGitProjectInfo } from "@/types/code";
import { Plus, ChevronDown, Folder, Trash2, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function CodeConfiguredGitProjectSelect() {
  const { Git } = useCode();
  const dialog = useDialog();
  const projects = Git.getConfiguredProjects();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleNewProject = async () => {
    const result = await dialog.show<CodeConfiguredGitProjectInfo | null>(
      DialogType.CUSTOM,
      "Configure Project",
      CodeConfigureProjectDialog
    );
    setIsOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, project: CodeConfiguredGitProjectInfo) => {
    e.stopPropagation();
    const confirmed = await dialog.show(
      DialogType.YES_NO,
      "Delete Project",
      () => (
        <div className="py-2">
          Are you sure you want to delete <span className="font-bold">{project.name}</span>? This action cannot be undone.
        </div>
      )
    );

    if (confirmed) {
      try {
        await Git.deleteConfiguredProject(project.id);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  const handleViewDetails = async (e: React.MouseEvent, project: CodeConfiguredGitProjectInfo) => {
    e.stopPropagation();
    await ProjectDetailsDialog.show(dialog, project.id);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeProjectId = Git.getActiveProjectId();
  const selectedProject = projects.find(p => p.id === activeProjectId) || (projects.length > 0 ? projects[0] : null);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 flex items-center gap-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <Folder className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <span className="max-w-[150px] truncate tracking-tight">
          {selectedProject ? selectedProject.name : "No Project"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-zinc-100 dark:border-zinc-800/50 z-[101] overflow-hidden backdrop-blur-xl">
          <button
            onClick={handleNewProject}
            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-50 dark:border-zinc-800/50"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              New Project
            </span>
          </button>
          {projects.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => {
                    Git.setActiveProjectId(project.id);
                    setIsOpen(false);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      Git.setActiveProjectId(project.id);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full px-4 py-3 flex items-center justify-between group cursor-pointer transition-colors border-b border-zinc-50 dark:border-zinc-800/30 last:border-b-0 ${activeProjectId === project.id
                    ? 'bg-zinc-50 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                >
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className={`text-sm tracking-tight truncate ${activeProjectId === project.id ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'font-semibold text-zinc-700 dark:text-zinc-300'
                      }`}>
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleViewDetails(e, project)}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all cursor-pointer"
                      aria-label={`View details for ${project.name}`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, project)}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
                      aria-label={`Delete ${project.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No projects configured
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

