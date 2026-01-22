"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from "react";
import { GitHubRepo } from "@/lib/api";
import { 
  ConfiguredRepo, 
  ConfiguredRepoType, 
  ConfiguredRepoSetupMode,
  ConfiguredRepoBuildConfig,
  ConfiguredRepoCustomSetupConfig,
  ConfiguredRepoBuildConfigTargetType,
  ConfiguredRepoBuildConfigBuildType,
} from "@/types/models/configured-project";

type CodeConfigureProjectFormContextType = {
  name: string,
  setName: (name: string) => void,
  repos: GitHubRepo[],
  selectedRepos: number[],
  selectedReposData: GitHubRepo[],
  setSelectedRepos: React.Dispatch<React.SetStateAction<number[]>>,
  activeRepoId: number | null,
  setActiveRepoId: (repoId: number | null) => void,
  isFormValid: boolean,
  getConfiguredRepo: (repoId: number) => ConfiguredRepo | null,
  setConfiguredRepoType: (repoId: number, type: ConfiguredRepoType) => void,
  setConfiguredRepoSetupMode: (repoId: number, setupMode: ConfiguredRepoSetupMode) => void,
  setConfiguredRepoBuildConfig: (repoId: number, buildConfig: ConfiguredRepoBuildConfig | undefined) => void,
  setConfiguredRepoCustomSetupConfigs: (repoId: number, configs: ConfiguredRepoCustomSetupConfig[]) => void,
  getBuildConfig: (repoId: number) => ConfiguredRepoBuildConfig | undefined,
  getCustomSetupConfigs: (repoId: number) => ConfiguredRepoCustomSetupConfig[],
  getRepoBranch: (repoId: number) => string,
  setRepoBranch: (repoId: number, branch: string) => void,
  buildConfiguredProject: () => any,
}

const CodeConfigureProjectFormContext = createContext<CodeConfigureProjectFormContextType | undefined>(undefined);

export function CodeConfigureProjectFormProvider({ 
  children,
  repos,
  selectedRepos: initialSelectedRepos,
  activeRepoId: initialActiveRepoId,
}: { 
  children: ReactNode,
  repos: GitHubRepo[],
  selectedRepos?: number[],
  activeRepoId?: number | null,
}) {
  const [name, setName] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<number[]>(initialSelectedRepos || []);
  const [activeRepoId, setActiveRepoId] = useState<number | null>(initialActiveRepoId || null);
  const [configuredRepos, setConfiguredRepos] = useState<Record<number, Partial<ConfiguredRepo>>>({});

  const selectedReposData = useMemo(() => 
    repos.filter((repo) => selectedRepos.includes(repo.id)),
    [repos, selectedRepos]
  );

  const isFormValid = useMemo(() => 
    name.trim().length > 0 && selectedRepos.length > 0,
    [name, selectedRepos]
  );

  useEffect(() => {
    if (selectedRepos.length > 0 && activeRepoId === null) {
      setActiveRepoId(selectedRepos[0]);
    } else if (selectedRepos.length === 0) {
      setActiveRepoId(null);
    }
  }, [selectedRepos, activeRepoId]);

  const getConfiguredRepo = useCallback((repoId: number): ConfiguredRepo | null => {
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) return null;
    
    const configured = configuredRepos[repoId];
    const configuredRepoId = repo.id ? repo.id.toString() : crypto.randomUUID();
    
    return {
      id: configuredRepoId,
      name: repo.name,
      type: configured?.type || "monorepo",
      branch: configured?.branch || "main",
      setupMode: configured?.setupMode || "full",
      buildConfig: configured?.buildConfig,
      setupConfigs: configured?.setupMode === "custom" ? configured.setupConfigs : undefined,
    };
  }, [repos, configuredRepos]);

  const setConfiguredRepoType = useCallback((repoId: number, type: ConfiguredRepoType) => {
    setConfiguredRepos((prev) => ({
      ...prev,
      [repoId]: { ...prev[repoId], type },
    }));
  }, []);

  const setConfiguredRepoSetupMode = useCallback((repoId: number, setupMode: ConfiguredRepoSetupMode) => {
    setConfiguredRepos((prev) => {
      const current = prev[repoId] || {};
      const targetType: ConfiguredRepoBuildConfigTargetType = setupMode === "full" ? "repo" : "custom";
      
      if (setupMode === "full") {
        const updatedBuildConfig = current.buildConfig ? {
          ...current.buildConfig,
          targetType,
        } : undefined;
        
        return {
          ...prev,
          [repoId]: { ...current, setupMode, setupConfigs: undefined, buildConfig: updatedBuildConfig },
        };
      } else {
        return {
          ...prev,
          [repoId]: { ...current, setupMode, buildConfig: undefined },
        };
      }
    });
  }, []);

  const setConfiguredRepoBuildConfig = useCallback((repoId: number, buildConfig: ConfiguredRepoBuildConfig | undefined) => {
    setConfiguredRepos((prev) => {
      const current = prev[repoId] || {};
      const setupMode = current.setupMode || "full";
      const targetType: ConfiguredRepoBuildConfigTargetType = setupMode === "full" ? "repo" : "custom";
      const repo = repos.find((r) => r.id === repoId);
      const targetId = repo?.id ? repo.id.toString() : crypto.randomUUID();
      
      const updatedBuildConfig = buildConfig ? {
        ...buildConfig,
        targetType,
        targetId,
      } : undefined;
      
      return {
        ...prev,
        [repoId]: { ...prev[repoId], buildConfig: updatedBuildConfig },
      };
    });
  }, [repos]);

  const setConfiguredRepoCustomSetupConfigs = useCallback((repoId: number, configs: ConfiguredRepoCustomSetupConfig[]) => {
    setConfiguredRepos((prev) => ({
      ...prev,
      [repoId]: { ...prev[repoId], setupConfigs: configs },
    }));
  }, []);

  const getBuildConfig = useCallback((repoId: number): ConfiguredRepoBuildConfig | undefined => {
    return configuredRepos[repoId]?.buildConfig;
  }, [configuredRepos]);

  const getCustomSetupConfigs = useCallback((repoId: number): ConfiguredRepoCustomSetupConfig[] => {
    return configuredRepos[repoId]?.setupConfigs || [];
  }, [configuredRepos]);

  const getRepoBranch = useCallback((repoId: number): string => {
    return configuredRepos[repoId]?.branch || "main";
  }, [configuredRepos]);

  const setRepoBranch = useCallback((repoId: number, branch: string) => {
    setConfiguredRepos((prev) => ({
      ...prev,
      [repoId]: { ...prev[repoId], branch },
    }));
  }, []);

  const buildConfiguredProject = useCallback(() => {
    const configuredReposList: ConfiguredRepo[] = selectedRepos.map((repoId) => {
      const repo = repos.find((r) => r.id === repoId);
      if (!repo) {
        throw new Error(`Repository with id ${repoId} not found`);
      }
      
      const configured = configuredRepos[repoId] || {};
      const setupMode = configured.setupMode || "full";
      const configuredRepoId = repo.id ? repo.id.toString() : crypto.randomUUID();
      
      const configuredRepo: ConfiguredRepo = {
        id: configuredRepoId,
        name: repo.name,
        type: configured.type || "monorepo",
        branch: configured.branch || "main",
        setupMode,
      };

      if (setupMode === "full" && configured.buildConfig) {
        configuredRepo.buildConfig = configured.buildConfig;
      } else if (setupMode === "custom" && configured.setupConfigs) {
        configuredRepo.setupConfigs = configured.setupConfigs;
      }

      return configuredRepo;
    });

    return {
      id: crypto.randomUUID(),
      name,
      repos: configuredReposList,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }, [name, selectedRepos, repos, configuredRepos]);

  const contextValue = useMemo(() => ({
    name,
    setName,
    repos,
    selectedRepos,
    selectedReposData,
    setSelectedRepos,
    activeRepoId,
    setActiveRepoId,
    isFormValid,
    getConfiguredRepo,
    setConfiguredRepoType,
    setConfiguredRepoSetupMode,
    setConfiguredRepoBuildConfig,
    setConfiguredRepoCustomSetupConfigs,
    getBuildConfig,
    getCustomSetupConfigs,
    getRepoBranch,
    setRepoBranch,
    buildConfiguredProject,
  }), [
    name, 
    repos, 
    selectedRepos, 
    selectedReposData, 
    activeRepoId, 
    isFormValid, 
    getConfiguredRepo,
    setConfiguredRepoType,
    setConfiguredRepoSetupMode,
    setConfiguredRepoBuildConfig,
    setConfiguredRepoCustomSetupConfigs,
    getBuildConfig,
    getCustomSetupConfigs,
    getRepoBranch,
    setRepoBranch,
    buildConfiguredProject,
  ]);

  return (
    <CodeConfigureProjectFormContext.Provider value={contextValue}>
      {children}
    </CodeConfigureProjectFormContext.Provider>
  );
}

export function useCodeConfigureProjectForm() {
  const context = useContext(CodeConfigureProjectFormContext);
  if (context === undefined) {
    throw new Error("useCodeConfigureProjectForm must be used within a CodeConfigureProjectFormProvider");
  }
  return context;
}

