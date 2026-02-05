export type ConfiguredProjectInfo = {
  id: string,
  projectsIds: string[],
  name: string,
  createdAt: Date,
  updatedAt: Date,
}

export type ConfiguredRepoSetupMode = "full" | "custom";
export type ConfiguredRepoBuildConfigTargetType = "repo" | "custom";
export type ConfiguredRepoBuildConfigBuildType = "docker" | "docker-compose" | "nextjs" | "python-uv" | "python-pip" | "spring" | "angular" | "npm" | "dotnet-aspnet";
export type ConfiguredRepoBuildConfigTarget = string;

export type ConfiguredRepoBuildConfig = {
  id: string,
  targetType: ConfiguredRepoBuildConfigTargetType,
  targetId: string, // ConfiguredRepo id or ConfiguredRepoCustomSetupConfig id
  buildType: ConfiguredRepoBuildConfigBuildType,
  target?: ConfiguredRepoBuildConfigTarget, // relative filepath for file inside of targetId repo/folder if buildType is docker or docker-compose
}

export type ConfiguredRepoCustomSetupConfig = {
  id: string,
  repoId: string,
  folderPath: string,
  buildConfig: ConfiguredRepoBuildConfig,
  expose?: boolean,
  ports?: number[],
}

export type ConfiguredRepo = {
  id: string,
  name: string,
  branch: string,
  setupMode: ConfiguredRepoSetupMode,
  setupConfigs?: ConfiguredRepoCustomSetupConfig[],
  buildConfig?: ConfiguredRepoBuildConfig
}

export type ConfiguredProject = {
  id: string,
  userId: string,
  repos: ConfiguredRepo[],
  name: string,
  createdAt: Date,
  updatedAt: Date,
}