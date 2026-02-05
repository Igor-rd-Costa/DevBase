"use client";

import {
  CodeConfiguredGitProjectInfo,
  CodeGetConfiguredProjectsFunction,
  CodeAddConfiguredProjectFunction,
  CodeUpdateConfiguredProjectFunction,
  CodeRemoveConfiguredProjectFunction,
  CodeAddConfiguredProjectData,
  CodeUpdateConfiguredProjectData
} from "@/types/code";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getConfiguredProjects as fetchProjects, deleteConfiguredProject as deleteProjectApi } from "@/lib/api";

export interface GitContextType {
  isLoading: boolean;
  raw: {
    configuredProjects: CodeConfiguredGitProjectInfo[],
    setConfiguredProjects: React.Dispatch<React.SetStateAction<CodeConfiguredGitProjectInfo[]>>,
    activeProjectId: string | null,
    setActiveProjectId: (id: string | null) => void,
  }
  getConfiguredProjects: CodeGetConfiguredProjectsFunction,
  getActiveProjectId: () => string | null,
  setActiveProjectId: (id: string | null) => void,
  addConfiguredProject: CodeAddConfiguredProjectFunction,
  updateConfiguredProject: CodeUpdateConfiguredProjectFunction,
  removeConfiguredProject: CodeRemoveConfiguredProjectFunction,
  deleteConfiguredProject: (id: string) => Promise<void>,
}

export function useGit() {
  const { token, loading: authLoading } = useAuth();
  const [configuredProjects, setConfiguredProjects] = useState<CodeConfiguredGitProjectInfo[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
  }, []);

  const getActiveProjectId = useCallback(() => activeProjectId, [activeProjectId]);

  useEffect(() => {
    if (authLoading) return;

    if (token) {
      setIsLoading(true);
      fetchProjects(token)
        .then((data) => {
          const mapped = data.map((project) => ({
            id: project.id,
            projectId: project.id.split("-")[0], // Short ID for display
            name: project.name,
            updatedAt: project.updatedAt,
          }));
          setConfiguredProjects(mapped);
          if (mapped.length > 0 && !activeProjectId) {
            setActiveProjectIdState(mapped[0].id);
          }
        })
        .catch((error) => {
          console.error("Failed to load configured projects:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      setConfiguredProjects([]);
    }
  }, [token, authLoading]);

  const getConfiguredProjects = useCallback(() => configuredProjects, [configuredProjects]);

  const addConfiguredProject = useCallback((data: CodeAddConfiguredProjectData) =>
    setConfiguredProjects((prev) => [...prev, { ...data, id: crypto.randomUUID() }])
    , [setConfiguredProjects]);

  const updateConfiguredProject = useCallback((id: string, data: CodeUpdateConfiguredProjectData) =>
    setConfiguredProjects((prev) => prev.map((project) => project.id === id ? { ...project, ...data } : project))
    , [setConfiguredProjects]);

  const removeConfiguredProject = useCallback((id: string) =>
    setConfiguredProjects((prev) => prev.filter((project) => project.id !== id))
    , [setConfiguredProjects]);

  const deleteConfiguredProject = useCallback(async (id: string) => {
    if (token) {
      try {
        await deleteProjectApi(token, id);
        removeConfiguredProject(id);
        if (activeProjectId === id) {
          setActiveProjectIdState(null);
        }
      } catch (error) {
        console.error("Failed to delete project:", error);
        throw error;
      }
    } else {
      removeConfiguredProject(id);
    }
  }, [token, removeConfiguredProject, activeProjectId]);

  const gitContext: GitContextType = useMemo(() => ({
    isLoading,
    raw: {
      configuredProjects,
      setConfiguredProjects,
      activeProjectId,
      setActiveProjectId,
    },
    getConfiguredProjects,
    getActiveProjectId,
    setActiveProjectId,
    addConfiguredProject,
    updateConfiguredProject,
    removeConfiguredProject,
    deleteConfiguredProject,
  }), [isLoading, configuredProjects, setConfiguredProjects, activeProjectId, setActiveProjectId, getConfiguredProjects, getActiveProjectId, addConfiguredProject, updateConfiguredProject, removeConfiguredProject, deleteConfiguredProject]);

  return gitContext;
}
