"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, Check } from "lucide-react";
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

type GitHubFolderTreeViewProps = {
  repo: GitHubRepo,
  selectedPaths: string[],
  onSelectionChange: (paths: string[]) => void,
  branch?: string,
}

export default function GitHubFolderTreeView({
  repo,
  selectedPaths,
  onSelectionChange,
  branch,
}: GitHubFolderTreeViewProps) {
  const { token } = useAuth();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && repo) {
      loadRootContents();
    }
  }, [token, repo, branch]);

  const loadRootContents = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const contents = await getGitHubRepoContents(token, repo.full_name, "", branch);
      console.log("GitHub contents response:", contents);
      const folders = contents.filter((item) => item.type === "dir");
      console.log("Filtered folders:", folders);
      const treeNodes: TreeNode[] = folders.map((item) => ({
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
      console.log(`GitHub contents for ${node.path}:`, contents);
      const folders = contents.filter((item) => item.type === "dir");
      console.log(`Filtered folders for ${node.path}:`, folders);
      node.children = folders.map((item) => ({
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

  const toggleSelection = (path: string) => {
    if (selectedPaths.includes(path)) {
      onSelectionChange(selectedPaths.filter((p) => p !== path));
    } else {
      onSelectionChange([...selectedPaths, path]);
    }
  };

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const isSelected = selectedPaths.includes(node.path);
    const hasChildren = node.type === "dir" && (node.children?.length || 0) > 0;

    return (
      <div key={node.path} className="flex flex-col">
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer"
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
            onClick={() => toggleSelection(node.path)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              isSelected
                ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100"
                : "border-zinc-300 dark:border-zinc-600"
            }`}>
              {isSelected && (
                <Check className="w-3 h-3 text-white dark:text-zinc-900" />
              )}
            </div>
            <Folder className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm text-zinc-900 dark:text-zinc-100">{node.name}</span>
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading folders...</p>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="px-4 py-4 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No folders found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 p-2">
      {tree.map((node) => renderNode(node))}
    </div>
  );
}

