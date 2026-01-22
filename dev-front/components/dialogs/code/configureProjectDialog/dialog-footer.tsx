"use client";

import { useState } from "react";
import { useCodeConfigureProjectForm } from "@/contexts/code/code-configure-project-form-context";
import { useAuth } from "@/contexts/auth-context";
import { createConfiguredProject } from "@/lib/api";

type DialogFooterProps = {
  onCancel: () => void,
  onCreate: () => void,
}

export default function DialogFooter({ onCancel, onCreate }: DialogFooterProps) {
  const { token } = useAuth();
  const { isFormValid, buildConfiguredProject } = useCodeConfigureProjectForm();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!token) {
      console.error("Not authenticated");
      return;
    }

    setIsCreating(true);
    try {
      const project = buildConfiguredProject();
      await createConfiguredProject(token, project);
      onCreate();
    } catch (error) {
      console.error("Failed to create configured project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleCreate}
        disabled={!isFormValid || isCreating}
        className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 dark:disabled:hover:bg-zinc-100"
      >
        {isCreating ? "Creating..." : "Create"}
      </button>
    </div>
  );
}

