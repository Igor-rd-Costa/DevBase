"use client";

import { X } from "lucide-react";
import { GitHubRepo } from "@/lib/api";
import GitHubFileTreeView from "@/components/dialogs/code/configureProjectDialog/github-file-tree-view";

type GitHubFileSelectionPopupProps = {
  repo: GitHubRepo,
  selectedPath: string | null,
  onSelectionChange: (path: string | null) => void,
  onClose: () => void,
  branch?: string,
  rootPath?: string,
}

export default function GitHubFileSelectionPopup({
  repo,
  selectedPath,
  onSelectionChange,
  onClose,
  branch,
  rootPath,
}: GitHubFileSelectionPopupProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      <div className="relative z-[201] bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-[90vw] max-w-2xl h-[80vh] mx-4 border border-zinc-200 dark:border-zinc-700 flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Select File
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <GitHubFileTreeView
            repo={repo}
            selectedPath={selectedPath}
            onSelectionChange={onSelectionChange}
            branch={branch}
            rootPath={rootPath}
          />
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

