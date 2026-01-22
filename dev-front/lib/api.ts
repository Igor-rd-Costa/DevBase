import { ConfiguredProject } from "@/types/models/configured-project";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  email?: string;
}

export async function getAuthUrl(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/github`);
  const data = await response.json();
  return data.auth_url;
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user");
  }

  return response.json();
}

export async function verifyToken(token: string): Promise<{ valid: boolean; user?: User }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return { valid: false };
  }

  const data = await response.json();
  return { valid: data.valid, user: data.user };
}

export interface GitHubRepo {
  id: number,
  name: string,
  full_name: string,
  private: boolean,
}

export async function getGitHubRepos(token: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/github/repos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to get GitHub repositories");
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
}

export interface GitHubContentItem {
  name: string,
  path: string,
  type: "file" | "dir",
  sha: string,
  size?: number,
  url: string,
  download_url?: string,
}

export interface GitHubBranch {
  name: string,
  commit: {
    sha: string,
    url: string,
  },
  protected: boolean,
}

export async function getGitHubRepoBranches(
  token: string,
  repoFullName: string
): Promise<GitHubBranch[]> {
  try {
    const url = new URL(`${API_BASE_URL}/github/repos/branches`);
    url.searchParams.set("repo_full_name", repoFullName);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get GitHub repo branches for ${repoFullName}:`, response.status, errorText);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching GitHub repo branches:", error);
    return [];
  }
}

export async function getGitHubRepoContents(
  token: string,
  repoFullName: string,
  path: string = "",
  branch?: string
): Promise<GitHubContentItem[]> {
  try {
    const url = new URL(`${API_BASE_URL}/github/repos/contents`);
    url.searchParams.set("repo_full_name", repoFullName);
    if (path) {
      url.searchParams.set("path", path);
    }
    if (branch) {
      url.searchParams.set("ref", branch);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get GitHub repo contents for ${repoFullName}${path ? `/${path}` : ""}:`, response.status, errorText);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching GitHub repo contents:", error);
    return [];
  }
}

export async function getConfiguredProjects(token: string): Promise<ConfiguredProject[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/configured-projects/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get configured projects:`, response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data.map((project: any) => ({
      id: project.id,
      userId: "",
      repos: project.repos,
      name: project.name,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    }));
  } catch (error) {
    console.error("Error fetching configured projects:", error);
    return [];
  }
}

export async function createConfiguredProject(
  token: string,
  project: ConfiguredProject
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/configured-projects/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create configured project: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteConfiguredProject(
  token: string,
  projectId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/configured-projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete configured project: ${response.status} ${errorText}`);
  }
}