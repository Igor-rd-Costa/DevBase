"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getGitHubRepoBranches, GitHubBranch } from "@/lib/api";
import { GitHubRepo } from "@/lib/api";
import Select from "@/components/ui/form/select";
import type { SelectPopupOption } from "@/components/dialogs/select-popup";

type RepoBranchSelectorProps = {
  repo: GitHubRepo,
  selectedBranch: string,
  onBranchChange: (branch: string) => void,
}

export default function RepoBranchSelector({
  repo,
  selectedBranch,
  onBranchChange,
}: RepoBranchSelectorProps) {
  const { token } = useAuth();
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<SelectPopupOption<string>[]>([]);

  useEffect(() => {
    if (token && repo) {
      loadBranches();
    }
  }, [token, repo]);

  useEffect(() => {
    if (branches.length > 0) {
      const branchOptions: SelectPopupOption<string>[] = branches.map((branch) => ({
        value: branch.name,
        label: branch.name,
        description: branch.protected ? "Protected" : undefined,
      }));
      setOptions(branchOptions);
    }
  }, [branches]);

  const loadBranches = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getGitHubRepoBranches(token, repo.full_name);
      console.log("Available branches:", data);
      setBranches(data);
    } catch (error) {
      console.error("Error loading branches:", error);
      setError("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      label="Base Branch"
      placeholder="Select base branch"
      options={options}
      value={selectedBranch}
      onChange={(branch) => onBranchChange(branch as string)}
      loading={loading}
      error={error}
      emptyMessage="No branches found"
      className="w-[15rem]"
      dialogTitle="Select Base Branch"
      dialogWidth="max-w-[15rem]"
    />
  );
}