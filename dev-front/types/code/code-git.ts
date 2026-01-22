export type CodeConfiguredGitProjectInfo = {
  id: string,
  projectId: string,
  name: string,
}

export type CodeAddConfiguredProjectData = Omit<CodeConfiguredGitProjectInfo, "id">;
export type CodeUpdateConfiguredProjectData = Partial<CodeConfiguredGitProjectInfo>;

export type CodeGetConfiguredProjectsFunction = () => CodeConfiguredGitProjectInfo[];
export type CodeAddConfiguredProjectFunction = (data: CodeAddConfiguredProjectData) => void;
export type CodeUpdateConfiguredProjectFunction = (id: string, data: CodeUpdateConfiguredProjectData) => void;
export type CodeRemoveConfiguredProjectFunction = (id: string) => void;


export type GitProject = {
  id: string,
  name: string,
}

export type GitBranch = {
  id: string,
  projectId: string,
  name: string,
}

