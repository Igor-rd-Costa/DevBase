"use client";

import { X } from "lucide-react";
import { DialogBaseProps } from "@/contexts/dialog-context";
import { useAuth } from "@/contexts/auth-context";
import { getGitHubRepos, GitHubRepo } from "@/lib/api";
import { useState, useEffect } from "react";
import { CodeConfigureProjectFormProvider } from "@/contexts/code/code-configure-project-form-context";
import DialogFormContent from "@/components/dialogs/code/configureProjectDialog/dialog-form-content";
import DialogFooter from "@/components/dialogs/code/configureProjectDialog/dialog-footer";

type CodeConfigureProjectDialogProps = DialogBaseProps;

export default function CodeConfigureProjectDialog({ onOpenChange }: CodeConfigureProjectDialogProps) {
  const { token } = useAuth();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      getGitHubRepos(token)
        .then((data) => {
          console.log(data);
          setRepos(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load repositories");
          setLoading(false);
        });
    } else {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [token]);



  const handleCancel = () => {
    onOpenChange(null);
  };

  const handleCreate = () => {
    onOpenChange(null);
  };

  console.log("The Options", repos);


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80"
        onClick={handleCancel}
      />
      <div className="relative z-[101] bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-[80vw] h-[80vh] mx-4 border border-zinc-200 dark:border-zinc-700 flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Configure Project
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <CodeConfigureProjectFormProvider repos={repos}>            <form onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
            }} className="grid grid-rows-[auto_auto_1fr] h-full p-6 gap-y-4 overflow-hidden">
              <DialogFormContent 
                loading={loading}
                error={error}
                repos={repos}
              />
          </form>
          <DialogFooter onCancel={handleCancel} onCreate={handleCreate} />
        </CodeConfigureProjectFormProvider>
      </div>
    </div>
  );
}


