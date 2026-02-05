"use client";

import { useState } from "react";
import { ConfiguredRepoCustomSetupConfig, ConfiguredRepoBuildConfig, ConfiguredRepoBuildConfigTargetType, ConfiguredRepoBuildConfigBuildType } from "@/types/models/configured-project";
import ConfiguredRepoBuildConfigFormSection from "@/components/dialogs/code/configureProjectDialog/configured-repo-build-config-form-section";
import GitHubFolderSelectionPopup from "@/components/dialogs/code/configureProjectDialog/github-folder-selection-popup";
import { useCodeConfigureProjectForm } from "@/contexts/code/code-configure-project-form-context";

type ConfiguredRepoCustomSetupConfigFormSectionProps = {
  configs: ConfiguredRepoCustomSetupConfig[],
  onChange: (configs: ConfiguredRepoCustomSetupConfig[]) => void,
  repoId: number,
}

export default function ConfiguredRepoCustomSetupConfigFormSection({
  configs,
  onChange,
  repoId,
}: ConfiguredRepoCustomSetupConfigFormSectionProps) {
  const { repos, getRepoBranch } = useCodeConfigureProjectForm();
  const [activeFolderId, setActiveFolderId] = useState<string | null>(
    configs.length > 0 ? configs[0].id : null
  );
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const repo = repos.find((r) => r.id === repoId);
  const selectedPaths = configs.map((config) => config.folderPath);
  const branch = getRepoBranch(repoId);

  const handleSelectionChange = (paths: string[]) => {
    const newConfigs: ConfiguredRepoCustomSetupConfig[] = paths.map((path) => {
      const existingConfig = configs.find((c) => c.folderPath === path);
      if (existingConfig) {
        return existingConfig;
      }
      const configId = crypto.randomUUID();
      return {
        id: configId,
        repoId: repoId.toString(),
        folderPath: path,
        buildConfig: {
          id: crypto.randomUUID(),
          targetType: "custom" as ConfiguredRepoBuildConfigTargetType,
          targetId: configId,
          buildType: "docker" as ConfiguredRepoBuildConfigBuildType,
          target: "",
        },
      };
    });

    const removedPaths = selectedPaths.filter((path) => !paths.includes(path));
    const removedConfig = configs.find((c) => removedPaths.includes(c.folderPath));
    if (removedConfig && activeFolderId === removedConfig.id) {
      setActiveFolderId(newConfigs.length > 0 ? newConfigs[0].id : null);
    }

    onChange(newConfigs);
  };

  const handleBuildConfigChange = (configId: string, buildConfig: ConfiguredRepoBuildConfig | undefined) => {
    const newConfigs = configs.map((config) => {
      if (config.id === configId) {
        const updatedBuildConfig: ConfiguredRepoBuildConfig = buildConfig ? {
          ...buildConfig,
          targetId: configId,
        } : {
          id: crypto.randomUUID(),
          targetType: "custom" as ConfiguredRepoBuildConfigTargetType,
          targetId: configId,
          buildType: "docker" as ConfiguredRepoBuildConfigBuildType,
          target: "",
        };
        return {
          ...config,
          buildConfig: updatedBuildConfig,
        };
      }
      return config;
    });
    onChange(newConfigs as ConfiguredRepoCustomSetupConfig[]);
  };

  if (!repo) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Select Folders
          </label>
          <button
            type="button"
            onClick={() => setIsPopupOpen(true)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 flex items-center justify-between"
          >
            <span className="text-sm">
              {selectedPaths.length > 0
                ? `${selectedPaths.length} folder${selectedPaths.length > 1 ? "s" : ""} selected`
                : "Select folders"}
            </span>
          </button>
        </div>

        {configs.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-x-auto">
              {configs.map((config) => {
                const isActive = activeFolderId === config.id;
                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setActiveFolderId(config.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${isActive
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
                      }`}
                  >
                    {config.folderPath}
                  </button>
                );
              })}
            </div>

            {activeFolderId && (
              <div className="pt-4">
                {configs.find((c) => c.id === activeFolderId) && repo && (
                  <ConfiguredRepoBuildConfigFormSection
                    buildConfig={configs.find((c) => c.id === activeFolderId)?.buildConfig}
                    setupMode="custom"
                    repo={repo}
                    branch={branch}
                    targetId={activeFolderId}
                    folderPath={configs.find((c) => c.id === activeFolderId)?.folderPath}
                    onChange={(buildConfig) => handleBuildConfigChange(activeFolderId, buildConfig)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isPopupOpen && repo && (
        <GitHubFolderSelectionPopup
          repo={repo}
          selectedPaths={selectedPaths}
          onSelectionChange={handleSelectionChange}
          onClose={() => setIsPopupOpen(false)}
          branch={branch}
        />
      )}
    </>
  );
}

