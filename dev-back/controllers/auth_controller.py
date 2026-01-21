from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
import httpx
import secrets
from urllib.parse import quote
from typing import Optional

from config import settings
from database import get_db, AsyncSessionLocal
from models import User as UserModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from controllers.dependencies import get_current_user, User, create_access_token, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/github")
def github_auth():
    state = secrets.token_urlsafe(32)
    scopes = "repo read:org user:email"
    
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={quote(settings.github_redirect_uri)}"
        f"&scope={quote(scopes)}"
        f"&state={state}"
    )
    
    return {"auth_url": github_auth_url}


@router.get("/github/callback")
async def github_callback(code: str, state: Optional[str] = None):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )

            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code for token")

            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise HTTPException(status_code=400, detail="Failed to get access token")

            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if user_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            user_data = user_response.json()

            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            email_data = email_response.json() if email_response.status_code == 200 else []
            primary_email = next((e["email"] for e in email_data if e.get("primary")), None)

            async with AsyncSessionLocal() as db:
                try:
                    result = await db.execute(
                        select(UserModel).where(UserModel.github_id == user_data["id"])
                    )
                    user = result.scalar_one_or_none()
                    if user:
                        user.github_access_token = access_token
                    else:
                        user = UserModel(github_id=user_data["id"], github_access_token=access_token)
                        db.add(user)
                    
                    await db.commit()
                    await db.refresh(user)
                except Exception:
                    await db.rollback()
                    raise

            jwt_token = create_access_token(
                {
                    "id": user_data["id"],
                    "login": user_data["login"],
                    "name": user_data.get("name"),
                    "avatar_url": user_data.get("avatar_url"),
                    "email": primary_email,
                }
            )

            redirect_url = f"{settings.frontend_url}/auth/callback?token={jwt_token}"
            return RedirectResponse(url=redirect_url)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during authentication: {str(e)}"
        )


@router.post("/github/revoke")
async def revoke_github_token(
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
        return {"message": "No GitHub token found to revoke"}
    
    async with httpx.AsyncClient() as client:
        revoke_response = await client.delete(
            f"https://api.github.com/applications/{settings.github_client_id}/token",
            auth=(settings.github_client_id, settings.github_client_secret),
            json={"access_token": user.github_access_token},
            headers={"Accept": "application/vnd.github.v3+json"},
        )
        
        if revoke_response.status_code in [204, 200]:
            user.github_access_token = None
            await db.commit()
            return {"message": "GitHub token revoked successfully"}
        else:
            user.github_access_token = None
            await db.commit()
            return {
                "message": "Token cleared from database. Please revoke the app authorization manually on GitHub."
            }


@router.get("/me")
async def get_me(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user


@router.get("/github/token")
async def get_github_token(
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
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {user.github_access_token}"},
        )
        
        scope_header = user_response.headers.get("X-OAuth-Scopes", "") if user_response.status_code == 200 else ""
    
    return {
        "token": user.github_access_token,
        "scopes": scope_header,
        "note": "Use this token in Postman: Authorization -> Bearer Token"
    }


@router.post("/verify")
async def verify_auth(token_data: dict):
    token = token_data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"valid": True, "user": payload}

