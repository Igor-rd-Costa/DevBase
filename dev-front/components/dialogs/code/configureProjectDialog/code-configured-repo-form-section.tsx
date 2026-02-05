"use client";

import { useCodeConfigureProjectForm } from "@/contexts/code/code-configure-project-form-context";
import { ConfiguredRepoSetupMode } from "@/types/models/configured-project";
import ConfiguredRepoBuildConfigFormSection from "@/components/dialogs/code/configureProjectDialog/configured-repo-build-config-form-section";
import ConfiguredRepoCustomSetupConfigFormSection from "@/components/dialogs/code/configureProjectDialog/configured-repo-custom-setup-config-form-section";
import RepoBranchSelector from "@/components/dialogs/code/configureProjectDialog/repo-branch-selector";

export default function CodeConfiguredRepoFormSection() {
  const {
    selectedReposData,
    activeRepoId,
    getConfiguredRepo,
    setConfiguredRepoSetupMode,
    setConfiguredRepoBuildConfig,
    setConfiguredRepoCustomSetupConfigs,
    getBuildConfig,
    getCustomSetupConfigs,
    getRepoBranch,
    setRepoBranch,
  } = useCodeConfigureProjectForm();

  const repo = selectedReposData.find((r) => r.id === activeRepoId);

  if (!repo) {
    return null;
  }

  const configuredRepo = getConfiguredRepo(repo.id);
  if (!configuredRepo) {
    return null;
  }

  const buildConfig = getBuildConfig(repo.id);
  const customSetupConfigs = getCustomSetupConfigs(repo.id);
  const branch = getRepoBranch(repo.id);

  return (
    <div className="flex flex-col h-fit gap-4 rounded-b-lg p-4 pt-2 bg-transparent ">
      <RepoBranchSelector
        repo={repo}
        selectedBranch={branch}
        onBranchChange={(newBranch) => setRepoBranch(repo.id, newBranch)}
      />

      <div className="flex flex-col gap-2">
        <label className="text-md font-medium text-zinc-900 dark:text-zinc-100">
          Setup Mode
        </label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`setup-mode-${repo.id}`}
              value="full"
              checked={configuredRepo.setupMode === "full"}
              onChange={(e) => setConfiguredRepoSetupMode(repo.id, e.target.value as ConfiguredRepoSetupMode)}
              className="w-3 h-3 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
            />
            <span className="text-sm text-zinc-900 dark:text-zinc-200">Full</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`setup-mode-${repo.id}`}
              value="custom"
              checked={configuredRepo.setupMode === "custom"}
              onChange={(e) => setConfiguredRepoSetupMode(repo.id, e.target.value as ConfiguredRepoSetupMode)}
              className="w-3 h-3 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-600 focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
            />
            <span className="text-sm text-zinc-900 dark:text-zinc-200">Custom</span>
          </label>
        </div>
      </div>

      {configuredRepo.setupMode === "full" && (
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Build Config
          </h4>
          <ConfiguredRepoBuildConfigFormSection
            buildConfig={buildConfig}
            setupMode={configuredRepo.setupMode}
            repo={repo}
            branch={branch}
            targetId={configuredRepo.id}
            onChange={(config) => setConfiguredRepoBuildConfig(repo.id, config)}
          />
        </div>
      )}

      {configuredRepo.setupMode === "custom" && (
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Custom Setup Config
          </h4>
          <ConfiguredRepoCustomSetupConfigFormSection
            configs={customSetupConfigs}
            onChange={(configs) => setConfiguredRepoCustomSetupConfigs(repo.id, configs)}
            repoId={repo.id}
          />
        </div>
      )}
    </div>
  );
}

