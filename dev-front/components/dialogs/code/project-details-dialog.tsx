"use client";

import { DialogBaseProps, DialogContextType, DialogType } from "@/contexts/dialog-context";
import { ConfiguredProject } from "@/types/models/configured-project";
import { useEffect, useState } from "react";
import { getConfiguredProjects } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type ProjectDetailsDialogProps = DialogBaseProps & {
  projectId?: string,
}

export default function ProjectDetailsDialog({ onOpenChange, projectId }: ProjectDetailsDialogProps) {
  const { token } = useAuth();
  const [project, setProject] = useState<ConfiguredProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("projectId", projectId);
    if (token) {
      if (!projectId) {
        onOpenChange(null);
        return;
      }
      getConfiguredProjects(token)
        .then((projects) => {
          const foundProject = projects.find((p) => p.id === projectId);
          setProject(foundProject || null);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load project details:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, projectId]);

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-600 dark:border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-4">
        <p className="text-zinc-600 dark:text-zinc-400">Project not found</p>
      </div>
    );
  }

  return (
    <div className="py-4 max-w-2xl h-full w-full overflow-hidden flex flex-col">
      <div className="overflow-y-auto flex-1 pr-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Project Name</h3>
          <p className="text-zinc-900 dark:text-zinc-100">{project.name}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Project ID</h3>
          <p className="text-zinc-900 dark:text-zinc-100 font-mono text-sm">{project.id}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Created At</h3>
          <p className="text-zinc-900 dark:text-zinc-100">{project.createdAt.toLocaleString()}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Updated At</h3>
          <p className="text-zinc-900 dark:text-zinc-100">{project.updatedAt.toLocaleString()}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Repositories ({project.repos.length})</h3>
          {project.repos.length > 0 ? (
            <div className="space-y-4">
              {project.repos.map((repo) => (
                <div key={repo.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{repo.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">ID: {repo.id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Type:</span>
                        <span className="ml-2 text-zinc-900 dark:text-zinc-100">{repo.type}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Branch:</span>
                        <span className="ml-2 text-zinc-900 dark:text-zinc-100">{repo.branch}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Setup Mode:</span>
                        <span className="ml-2 text-zinc-900 dark:text-zinc-100">{repo.setupMode}</span>
                      </div>
                    </div>

                    {repo.buildConfig && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Build Config</h5>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Target Type:</span>
                            <span className="ml-2 text-zinc-900 dark:text-zinc-100">{repo.buildConfig.targetType}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Target ID:</span>
                            <span className="ml-2 text-zinc-900 dark:text-zinc-100 font-mono">{repo.buildConfig.targetId}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Build Type:</span>
                            <span className="ml-2 text-zinc-900 dark:text-zinc-100">{repo.buildConfig.buildType}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600 dark:text-zinc-400">Build Target:</span>
                            <span className="ml-2 text-zinc-900 dark:text-zinc-100 font-mono">{repo.buildConfig.buildTarget}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {repo.setupConfigs && repo.setupConfigs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <h5 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Custom Setup Configs ({repo.setupConfigs.length})</h5>
                        <div className="space-y-2">
                          {repo.setupConfigs.map((config) => (
                            <div key={config.id} className="bg-zinc-100 dark:bg-zinc-900/50 rounded p-2 text-xs">
                              <div className="space-y-1">
                                <div>
                                  <span className="text-zinc-600 dark:text-zinc-400">ID:</span>
                                  <span className="ml-2 text-zinc-900 dark:text-zinc-100 font-mono">{config.id}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-600 dark:text-zinc-400">Repo ID:</span>
                                  <span className="ml-2 text-zinc-900 dark:text-zinc-100 font-mono">{config.repoId}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-600 dark:text-zinc-400">Folder Path:</span>
                                  <span className="ml-2 text-zinc-900 dark:text-zinc-100 font-mono">{config.folderPath}</span>
                                </div>
                                {config.buildConfig && (
                                  <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                    <div className="space-y-1">
                                      <div>
                                        <span className="text-zinc-600 dark:text-zinc-400">Build Type:</span>
                                        <span className="ml-2 text-zinc-900 dark:text-zinc-100">{config.buildConfig.buildType}</span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-600 dark:text-zinc-400">Build Target:</span>
                                        <span className="ml-2 text-zinc-900 dark:text-zinc-100 font-mono">{config.buildConfig.buildTarget}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">No repositories configured</p>
          )}
        </div>
      </div>
    </div>
  );
}

ProjectDetailsDialog.show = (
  dialog: DialogContextType,
  projectId: string
): Promise<void> & { id: string } => {
  return dialog.show(
    DialogType.OK,
    "Project Details",
    ProjectDetailsDialog,
    { projectId: projectId, className: "w-[90dvw]" }
  );
};
