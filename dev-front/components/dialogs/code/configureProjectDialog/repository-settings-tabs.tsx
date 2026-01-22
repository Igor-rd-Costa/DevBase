"use client";

import { FolderGit2, X } from "lucide-react";
import { useCodeConfigureProjectForm } from "@/contexts/code/code-configure-project-form-context";

export default function RepositorySettingsTabs() {
  const { selectedReposData, activeRepoId, setActiveRepoId, setSelectedRepos } = useCodeConfigureProjectForm();

  if (selectedReposData.length === 0) {
    return null;
  }

  const handleRemoveRepo = (repoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRepos((prev) => {
      const newSelected = prev.filter((id) => id !== repoId);
      if (activeRepoId === repoId) {
        setActiveRepoId(newSelected.length > 0 ? newSelected[0] : null);
      }
      return newSelected;
    });
  };

  return (
    <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 h-[44px] rounded-lg overflow-x-auto shadow-[0_1px_5px_0_black]">
      {selectedReposData.map((repo) => {
        const isActive = activeRepoId === repo.id;
        return (
          <button
            key={repo.id}
            type="button"
            onClick={() => setActiveRepoId(repo.id)}
            className={`group px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
              isActive
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
            }`}
          >
            <FolderGit2 className="w-4 h-4"/>
            <span>{repo.name}</span>
            <X
              className="w-4 h-4 opacity-0 group-hover:opacity-100 hover:text-zinc-900 dark:hover:text-white transition-opacity"
              onClick={(e) => handleRemoveRepo(repo.id, e)}
            />
          </button>
        );
      })}
    </div>
  );
}

