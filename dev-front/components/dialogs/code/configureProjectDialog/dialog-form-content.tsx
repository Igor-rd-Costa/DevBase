"use client";

import { GitHubRepo } from "@/lib/api";
import { useMemo } from "react";
import { useCodeConfigureProjectForm } from "@/contexts/code/code-configure-project-form-context";
import RepositorySettingsTabs from "@/components/dialogs/code/configureProjectDialog/repository-settings-tabs";
import CodeConfiguredRepoFormSection from "@/components/dialogs/code/configureProjectDialog/code-configured-repo-form-section";
import Select from "@/components/ui/form/select";
import type { SelectPopupOption } from "@/components/dialogs/select-popup";

type DialogFormContentProps = {
  loading: boolean,
  error: string | null,
  repos: GitHubRepo[],
}

export default function DialogFormContent({
  loading,
  error,
  repos,
}: DialogFormContentProps) {
  const {
    name,
    setName,
    selectedRepos,
    setSelectedRepos,
    activeRepoId,
    setActiveRepoId,
  } = useCodeConfigureProjectForm();

  const repoOptions: SelectPopupOption<number>[] = useMemo(() => repos.map((repo) => ({
    value: repo.id,
    label: repo.name,
    description: repo.full_name,
  })), [repos]);

  const handleRepoChange = (value: number | number[]) => {
    const newSelected = Array.isArray(value) ? value : [value];
    setSelectedRepos(newSelected);
    if (newSelected.length > 0 && !newSelected.includes(activeRepoId || -1)) {
      setActiveRepoId(newSelected[0]);
    } else if (newSelected.length === 0) {
      setActiveRepoId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col w-[22rem]">
        <label htmlFor="project-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Project Name
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
          placeholder="Enter project name"
        />
      </div>

      <Select
        label="GitHub Repositories"
        placeholder="Select repositories"
        options={repoOptions}
        value={selectedRepos}
        onChange={handleRepoChange}
        multiple
        showCheckboxes
        loading={loading}
        error={error}
        emptyMessage="No repositories found"
        getDisplayText={(selected) => {
          if (Array.isArray(selected)) {
            if (selected.length === 0) {
              return "Select repositories";
            }
            return `${selected.length} repository${selected.length > 1 ? "ies" : ""} selected`;
          }
          return "Select repositories";
        }}
        className="w-[22rem]"
        dialogTitle="Select Repositories"
        dialogWidth="max-w-xl"
      />

      <div className="flex flex-col gap-2 w-full h-full overflow-hidden">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Repositories Settings
        </h3>
        <div className="grid grid-rows-[auto_1fr] bg-zinc-100 dark:bg-zink-200 dark:bg-zinc-900/70 h-full rounded-lg overflow-hidden">
          <RepositorySettingsTabs />
          <div className="w-full h-full overflow-y-scroll pr-2">
            {activeRepoId && (
              <CodeConfiguredRepoFormSection />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

