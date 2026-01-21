from fastapi import APIRouter, HTTPException, Depends, Query
import httpx
import logging
from typing import Optional

from database import get_db, AsyncSessionLocal
from models import User as UserModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from controllers.dependencies import get_current_user, User

router = APIRouter(prefix="/github", tags=["github"])


@router.get("/repos")
async def get_github_repos(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(UserModel).where(UserModel.github_id == current_user.id)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.github_access_token:
        raise HTTPException(status_code=404, detail="GitHub access token not found")
    
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {user.github_access_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        all_repos = []
        seen_repo_ids = set()
        
        token_info_response = await client.get(
            "https://api.github.com/user",
            headers=headers
        )
        if token_info_response.status_code == 200:
            scope_header = token_info_response.headers.get("X-OAuth-Scopes", "")
            logging.info(f"Token scopes from API headers (X-OAuth-Scopes): {scope_header}")
            
            if not scope_header:
                logging.error(
                    "CRITICAL: Token has NO scopes. GitHub will only return public repositories. "
                    "User must revoke the app authorization and re-authorize with 'repo' and 'read:org' scopes."
                )
            else:
                scopes_list = [s.strip() for s in scope_header.split(",")]
                if "repo" not in scopes_list:
                    logging.error(
                        "CRITICAL: Token missing 'repo' scope. GitHub will only return public repositories "
                        "regardless of the visibility parameter. User must re-authorize with 'repo' scope."
                    )
                if "read:org" not in scopes_list:
                    logging.warning(
                        "Token missing 'read:org' scope - organization repositories may not be accessible"
                    )
        
        def add_repos(repos):
            for repo in repos:
                if repo["id"] not in seen_repo_ids:
                    seen_repo_ids.add(repo["id"])
                    all_repos.append(repo)
        
        page = 1
        per_page = 100
        total_fetched = 0
        while True:
            repos_response = await client.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={
                    "per_page": per_page,
                    "page": page,
                    "sort": "updated",
                    "affiliation": "owner,collaborator,organization_member",
                    "visibility": "all",
                }
            )
            
            if repos_response.status_code != 200:
                error_detail = repos_response.text
                raise HTTPException(
                    status_code=repos_response.status_code,
                    detail=f"Failed to fetch user repositories: {error_detail}"
                )
            
            repos = repos_response.json()
            if not repos:
                break
            
            page_total = len(repos)
            private_count = sum(1 for r in repos if r.get("private", False))
            total_fetched += page_total
            print(f"Fetched page {page}: {page_total} repos ({private_count} private)")
            
            add_repos(repos)
            
            link_header = repos_response.headers.get("link", "")
            if 'rel="next"' not in link_header:
                break
            
            page += 1
        
        print(f"Total repositories fetched from /user/repos: {total_fetched} (unique: {len(all_repos)})")
        
        orgs_response = await client.get(
            "https://api.github.com/user/orgs",
            headers=headers,
            params={"per_page": 100}
        )
        
        if orgs_response.status_code == 200:
            orgs = orgs_response.json()
            
            for org in orgs:
                org_login = org["login"]
                page = 1
                
                while True:
                    org_repos_response = await client.get(
                        f"https://api.github.com/orgs/{org_login}/repos",
                        headers=headers,
                        params={
                            "per_page": per_page,
                            "page": page,
                            "type": "all",
                        }
                    )
                    
                    if org_repos_response.status_code != 200:
                        break
                    
                    org_repos = org_repos_response.json()
                    if not org_repos:
                        break
                    
                    add_repos(org_repos)
                    
                    link_header = org_repos_response.headers.get("link", "")
                    if 'rel="next"' not in link_header:
                        break
                    
                    page += 1
        
        return [
            {
                "id": repo["id"],
                "name": repo["name"],
                "full_name": repo["full_name"],
                "private": repo["private"],
            }
            for repo in all_repos
        ]


@router.get("/repos/branches")
async def get_github_repo_branches(
    repo_full_name: str = Query(..., description="Repository full name (e.g., owner/repo)"),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(UserModel).where(UserModel.github_id == current_user.id)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.github_access_token:
        raise HTTPException(status_code=404, detail="GitHub access token not found")
    
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {user.github_access_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        url = f"https://api.github.com/repos/{repo_full_name}/branches"
        all_branches = []
        page = 1
        per_page = 100
        
        while True:
            paginated_url = f"{url}?page={page}&per_page={per_page}"
            response = await client.get(paginated_url, headers=headers)
            
            if response.status_code != 200:
                error_detail = response.text
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch repository branches: {error_detail}"
                )
            
            branches = response.json()
            if not branches:
                break
            
            all_branches.extend(branches)
            
            link_header = response.headers.get("Link", "")
            if "rel=\"next\"" not in link_header:
                break
            
            page += 1
        
        return all_branches


@router.get("/repos/contents")
async def get_github_repo_contents(
    repo_full_name: str = Query(..., description="Repository full name (e.g., owner/repo)"),
    path: str = Query("", description="Path within the repository"),
    ref: str = Query("", description="Branch, tag, or commit SHA"),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(UserModel).where(UserModel.github_id == current_user.id)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.github_access_token:
        raise HTTPException(status_code=404, detail="GitHub access token not found")
    
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {user.github_access_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        url = f"https://api.github.com/repos/{repo_full_name}/contents"
        if path:
            url += f"/{path.lstrip('/')}"
        
        params = {}
        if ref:
            params["ref"] = ref
        
        response = await client.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch repository contents: {error_detail}"
            )
        
        return response.json()


@router.get("/repos/debug")
async def debug_github_repos(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(UserModel).where(UserModel.github_id == current_user.id)
    )
    user = result.scalar_one_or_none()
    
    if not user or not user.github_access_token:
        raise HTTPException(status_code=404, detail="GitHub access token not found")
    
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {user.github_access_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        debug_info = {}
        
        user_response = await client.get("https://api.github.com/user", headers=headers)
        if user_response.status_code == 200:
            debug_info["user"] = user_response.json().get("login")
            debug_info["token_scopes"] = user_response.headers.get("X-OAuth-Scopes", "")
            debug_info["accepted_scopes"] = user_response.headers.get("X-Accepted-OAuth-Scopes", "")
        
        repos_from_user_endpoint = []
        page = 1
        while page <= 3:
            repos_response = await client.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={
                    "per_page": 100,
                    "page": page,
                    "affiliation": "owner,collaborator,organization_member",
                    "visibility": "all",
                }
            )
            if repos_response.status_code == 200:
                repos = repos_response.json()
                if not repos:
                    break
                repos_from_user_endpoint.extend([r["full_name"] for r in repos])
                if 'rel="next"' not in repos_response.headers.get("link", ""):
                    break
            else:
                debug_info["user_repos_error"] = f"Status {repos_response.status_code}: {repos_response.text[:200]}"
                break
            page += 1
        
        debug_info["repos_from_user_endpoint"] = repos_from_user_endpoint
        debug_info["total_repos_count"] = len(repos_from_user_endpoint)
        
        orgs_response = await client.get("https://api.github.com/user/orgs", headers=headers)
        if orgs_response.status_code == 200:
            orgs = orgs_response.json()
            debug_info["organizations"] = [org["login"] for org in orgs]
            
            org_repos = {}
            for org in orgs[:3]:
                org_login = org["login"]
                org_repos_list = []
                page = 1
                while page <= 2:
                    org_repos_response = await client.get(
                        f"https://api.github.com/orgs/{org_login}/repos",
                        headers=headers,
                        params={"per_page": 100, "page": page, "type": "all"}
                    )
                    if org_repos_response.status_code == 200:
                        repos = org_repos_response.json()
                        if not repos:
                            break
                        org_repos_list.extend([r["full_name"] for r in repos])
                        if 'rel="next"' not in org_repos_response.headers.get("link", ""):
                            break
                    else:
                        org_repos[org_login] = f"Error {org_repos_response.status_code}: {org_repos_response.text[:200]}"
                        break
                    page += 1
                if org_login not in org_repos:
                    org_repos[org_login] = org_repos_list
            debug_info["org_repos"] = org_repos
        else:
            debug_info["orgs_error"] = f"Status {orgs_response.status_code}: {orgs_response.text[:200]}"
        
        return debug_info

