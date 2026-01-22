"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getGitHubRepoContents, GitHubContentItem } from "@/lib/api";
import { GitHubRepo } from "@/lib/api";

type TreeNode = {
  name: string,
  path: string,
  type: "file" | "dir",
  children?: TreeNode[],
  expanded?: boolean,
  loaded?: boolean,
}

type GitHubFileTreeViewProps = {
  repo: GitHubRepo,
  selectedPath: string | null,
  onSelectionChange: (path: string | null) => void,
  branch?: string,
  rootPath?: string,
}

export default function GitHubFileTreeView({
  repo,
  selectedPath,
  onSelectionChange,
  branch,
  rootPath = "",
}: GitHubFileTreeViewProps) {
  const { token } = useAuth();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && repo) {
      loadRootContents();
    }
  }, [token, repo, branch, rootPath]);

  const loadRootContents = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const contents = await getGitHubRepoContents(token, repo.full_name, rootPath, branch);
      const treeNodes: TreeNode[] = contents.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        expanded: false,
        loaded: false,
      }));
      setTree(treeNodes);
    } catch (error) {
      console.error("Error loading root contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (node: TreeNode) => {
    if (!token || node.loaded || node.type !== "dir") return;

    try {
      const contents = await getGitHubRepoContents(token, repo.full_name, node.path, branch);
      node.children = contents.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        expanded: false,
        loaded: false,
      }));
      node.loaded = true;
      setTree([...tree]);
    } catch (error) {
      console.error(`Error loading children for ${node.path}:`, error);
    }
  };

  const toggleExpand = (node: TreeNode) => {
    if (node.type === "dir") {
      node.expanded = !node.expanded;
      if (node.expanded && !node.loaded) {
        loadChildren(node);
      }
      setTree([...tree]);
    }
  };

  const handleFileClick = (path: string) => {
    if (selectedPath === path) {
      onSelectionChange(null);
    } else {
      onSelectionChange(path);
    }
  };

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isSelected = selectedPath === node.path;
    const isFile = node.type === "file";

    return (
      <div key={node.path} className="flex flex-col">
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${
            isFile
              ? isSelected
                ? "bg-zinc-200 dark:bg-zinc-700"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
              : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          <button
            type="button"
            onClick={() => toggleExpand(node)}
            className="flex items-center justify-center w-4 h-4"
          >
            {node.type === "dir" ? (
              node.expanded ? (
                <ChevronDown className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => isFile && handleFileClick(node.path)}
            disabled={!isFile}
            className={`flex items-center gap-2 flex-1 text-left ${
              isFile ? "" : "cursor-default"
            }`}
          >
            {node.type === "dir" ? (
              <Folder className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            ) : (
              <File className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            )}
            <span className={`text-sm ${
              isFile
                ? isSelected
                  ? "text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-700 dark:text-zinc-300"
                : "text-zinc-600 dark:text-zinc-400"
            }`}>
              {node.name}
            </span>
          </button>
        </div>
        {node.expanded && node.children && (
          <div className="flex flex-col">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading files...</p>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No files found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 p-2">
      {tree.map((node) => renderNode(node))}
    </div>
  );
}

