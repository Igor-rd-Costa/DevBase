"use client";

import { useState } from "react";
import { ConfiguredRepoBuildConfig, ConfiguredRepoBuildConfigBuildType, ConfiguredRepoSetupMode, ConfiguredRepoBuildConfigTargetType } from "@/types/models/configured-project";
import { GitHubRepo } from "@/lib/api";
import GitHubFileSelectionPopup from "@/components/dialogs/code/configureProjectDialog/github-file-selection-popup";
import Select from "@/components/ui/form/select";
import { SelectPopupOption } from "@/components/dialogs/select-popup";

type ConfiguredRepoBuildConfigFormSectionProps = {
  buildConfig: ConfiguredRepoBuildConfig | undefined,
  setupMode: ConfiguredRepoSetupMode,
  repo: GitHubRepo,
  branch: string,
  targetId: string,
  folderPath?: string,
  onChange: (buildConfig: ConfiguredRepoBuildConfig | undefined) => void,
}

export default function ConfiguredRepoBuildConfigFormSection({
  buildConfig,
  setupMode,
  repo,
  branch,
  targetId,
  folderPath,
  onChange
}: ConfiguredRepoBuildConfigFormSectionProps) {
  const [isFilePopupOpen, setIsFilePopupOpen] = useState(false);

  const getTargetType = (): ConfiguredRepoBuildConfigTargetType => {
    return setupMode === "full" ? "repo" : "custom";
  };

  const getRootPath = (): string => {
    if (setupMode === "full") {
      return "";
    }
    return folderPath || "";
  };



  const buildTypeOptions: SelectPopupOption<ConfiguredRepoBuildConfigBuildType>[] = [
    { value: "docker", label: "Docker" },
    { value: "docker-compose", label: "Docker Compose" },
    { value: "nextjs", label: "NextJS" },
    { value: "python-uv", label: "Python (UV)" },
    { value: "python-pip", label: "Python (pip)" },
    { value: "spring", label: "Spring" },
    { value: "angular", label: "Angular" },
    { value: "npm", label: "npm" },
    { value: "dotnet-aspnet", label: "ASP.NET" },
  ];

  const handleBuildTypeChange = (buildType: ConfiguredRepoBuildConfigBuildType | ConfiguredRepoBuildConfigBuildType[]) => {
    const value = Array.isArray(buildType) ? buildType[0] : buildType;
    const targetType = getTargetType();
    onChange({
      id: buildConfig?.id || crypto.randomUUID(),
      targetType,
      targetId,
      buildType: value,
      buildTarget: buildConfig?.buildTarget || "",
    });
  };

  const handleBuildTargetChange = (buildTarget: string | null) => {
    const targetType = getTargetType();
    onChange({
      id: buildConfig?.id || crypto.randomUUID(),
      targetType,
      targetId,
      buildType: buildConfig?.buildType || "docker",
      buildTarget: buildTarget || "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Select
          label="Build Type"
          placeholder="Select build type"
          options={buildTypeOptions}
          value={buildConfig?.buildType || null}
          onChange={handleBuildTypeChange}
          dialogTitle="Select Build Type"
          className="w-[15rem]"
          dialogWidth="max-w-[15rem]"
        />
      </div>

      {buildConfig && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Build Target
          </label>
          <button
            type="button"
            onClick={() => setIsFilePopupOpen(true)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 flex items-center justify-between"
          >
            <span className="text-sm">
              {buildConfig.buildTarget || "Select file"}
            </span>
          </button>
        </div>
      )}

      {isFilePopupOpen && (
        <GitHubFileSelectionPopup
          repo={repo}
          selectedPath={buildConfig?.buildTarget || null}
          onSelectionChange={(path) => {
            handleBuildTargetChange(path);
          }}
          onClose={() => setIsFilePopupOpen(false)}
          branch={branch}
          rootPath={getRootPath()}
        />
      )}
    </div>
  );
}

