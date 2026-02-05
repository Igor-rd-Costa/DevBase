"use client";

import { useState, useEffect } from "react";
import { ViewMode, ConfiguredProjectMode } from "@/types/view-mode";
import { useCode } from "@/contexts/code/code-context";
import { useAuth } from "@/contexts/auth-context";
import { getGitHubRepos, GitHubRepo, createConfiguredProject } from "@/lib/api";
import { CodeConfigureProjectFormProvider, useCodeConfigureProjectForm } from "@/contexts/code/code-configure-project-form-context";
import DialogFormContent from "@/components/dialogs/code/configureProjectDialog/dialog-form-content";
import { Loader2, Plus, FolderOpen, X, ArrowLeft } from "lucide-react";
import { useView } from "@/contexts/view-context";

interface ConfiguredProjectViewPanelProps {
    onViewChange: (mode: ViewMode) => void;
}

export default function ConfiguredProjectViewPanel({ onViewChange }: ConfiguredProjectViewPanelProps) {
    const { Git } = useCode();
    const { token } = useAuth();
    const { configuredProjectMode, setConfiguredProjectMode } = useView();

    const configuredProjects = Git.getConfiguredProjects();
    const activeProjectId = Git.getActiveProjectId();

    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [repoError, setRepoError] = useState<string | null>(null);

    useEffect(() => {
        if (Git.isLoading) return;

        // Only set mode if it's currently null
        if (configuredProjectMode === null) {
            if (configuredProjects.length === 0) {
                setConfiguredProjectMode(ConfiguredProjectMode.CREATE);
            } else {
                setConfiguredProjectMode(ConfiguredProjectMode.LOAD);
            }
        }
    }, [configuredProjects.length, Git.isLoading, configuredProjectMode, setConfiguredProjectMode]);

    useEffect(() => {
        if (configuredProjectMode === ConfiguredProjectMode.CREATE && token && repos.length === 0) {
            setLoadingRepos(true);
            getGitHubRepos(token)
                .then((data) => {
                    setRepos(data);
                    setLoadingRepos(false);
                })
                .catch((err) => {
                    setRepoError(err.message || "Failed to load repositories");
                    setLoadingRepos(false);
                });
        }
    }, [configuredProjectMode, token, repos.length]);

    const handleCancel = () => {
        // If user has an active project, go back to code view
        if (activeProjectId) {
            onViewChange(ViewMode.CODE);
        }
    };

    if (Git.isLoading || configuredProjectMode === null) {
        return (
            <div className="flex w-full h-full bg-zinc-50 dark:bg-zinc-900 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="flex w-full h-full bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
            <div className="flex flex-col w-full h-full max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {configuredProjectMode === ConfiguredProjectMode.CREATE ? "Configure New Project" : "Load Project"}
                    </h1>
                    {activeProjectId && (
                        <button
                            onClick={handleCancel}
                            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            title="Cancel and return to editor"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {configuredProjectMode === ConfiguredProjectMode.LOAD ? (
                        <LoadView
                            projects={configuredProjects}
                            onSelect={(id) => {
                                Git.setActiveProjectId(id);
                                onViewChange(ViewMode.CODE);
                            }}
                            onNewProject={() => setConfiguredProjectMode(ConfiguredProjectMode.CREATE)}
                        />
                    ) : (
                        <CodeConfigureProjectFormProvider repos={repos}>
                            <CreateView
                                loading={loadingRepos}
                                error={repoError}
                                repos={repos}
                                onLoadMode={() => setConfiguredProjectMode(ConfiguredProjectMode.LOAD)}
                                projectsCount={configuredProjects.length}
                                onSuccess={() => {
                                    // Update context manually to reflect change immediately using raw setter to preserve ID
                                    // This is handled in CreateView but we might need to switch view here if not handled inside
                                    setConfiguredProjectMode(ConfiguredProjectMode.LOAD);
                                }}
                            />
                        </CodeConfigureProjectFormProvider>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadView({
    projects,
    onSelect,
    onNewProject
}: {
    projects: ReturnType<typeof useCode>["Git"]["raw"]["configuredProjects"],
    onSelect: (id: string) => void,
    onNewProject: () => void
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 gap-4 content-start">
                {projects.map((project) => (
                    <button
                        key={project.id}
                        onClick={() => onSelect(project.id)}
                        className="flex flex-row items-center justify-between w-full p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm transition-all group text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700 group-hover:scale-105 transition-transform">
                                <FolderOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                            </div>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                {project.name}
                            </h3>
                        </div>
                        {project.updatedAt && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                {(() => {
                                    const d = new Date(project.updatedAt);
                                    const hours = d.getHours().toString().padStart(2, '0');
                                    const minutes = d.getMinutes().toString().padStart(2, '0');
                                    const day = d.getDate().toString().padStart(2, '0');
                                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                                    const year = d.getFullYear();
                                    return `${hours}:${minutes} ${day}/${month}/${year}`;
                                })()}
                            </span>
                        )}
                    </button>
                ))}
                {projects.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
                        <FolderOpen className="w-10 h-10 mb-3 opacity-50" />
                        <p className="text-sm">No configured projects found.</p>
                    </div>
                )}
            </div>

            <div className="p-6 flex justify-end">
                <button
                    onClick={onNewProject}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-medium transition-colors shadow-sm hover:shadow"
                >
                    <Plus className="w-4 h-4" />
                    New Project
                </button>
            </div>
        </div>
    );
}

function CreateView({
    loading,
    error,
    repos,
    onLoadMode,
    projectsCount,
    onSuccess
}: {
    loading: boolean,
    error: string | null,
    repos: GitHubRepo[],
    onLoadMode: () => void,
    projectsCount: number,
    onSuccess: () => void
}) {
    const { token } = useAuth();
    const { isFormValid, buildConfiguredProject } = useCodeConfigureProjectForm();
    const { Git } = useCode();
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!token) return;
        setIsCreating(true);
        setCreateError(null);
        try {
            const project = buildConfiguredProject();
            const newProject = await createConfiguredProject(token, project);

            // Update context manually to reflect change immediately using raw setter to preserve ID
            Git.raw.setConfiguredProjects((prev) => [
                ...prev,
                {
                    id: newProject.id,
                    projectId: newProject.id.split("-")[0],
                    name: newProject.name,
                    updatedAt: new Date(newProject.updatedAt || new Date()),
                },
            ]);

            onSuccess();
        } catch (error: any) {
            console.error("Failed to create configured project:", error);
            setCreateError(error.message || "Failed to create project");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
                    {createError && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                            {createError}
                        </div>
                    )}
                    <DialogFormContent
                        loading={loading}
                        error={error}
                        repos={repos}
                    />
                </div>
            </div>

            <div className="p-6 flex justify-between items-center flex-shrink-0">
                Curious
                <button
                    onClick={onLoadMode}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Load Existing Project ({projectsCount})
                </button>

                <button
                    onClick={handleCreate}
                    disabled={!isFormValid || isCreating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-medium transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 dark:disabled:hover:bg-zinc-100"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Create Project
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
