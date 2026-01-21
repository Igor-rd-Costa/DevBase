from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from controllers.dependencies import get_current_user, User
from models import ConfiguredProject as ConfiguredProjectModel, User as UserModel

router = APIRouter(prefix="/configured-projects", tags=["configured-projects"])


class ConfiguredRepoBuildConfig(BaseModel):
    id: str
    targetType: str
    targetId: str
    buildType: str
    buildTarget: str


class ConfiguredRepoCustomSetupConfig(BaseModel):
    id: str
    repoId: str
    folderPath: str
    buildConfig: ConfiguredRepoBuildConfig


class ConfiguredRepo(BaseModel):
    id: str
    name: str
    type: str
    branch: str
    setupMode: str
    setupConfigs: Optional[List[ConfiguredRepoCustomSetupConfig]] = None
    buildConfig: Optional[ConfiguredRepoBuildConfig] = None


class ConfiguredProjectCreate(BaseModel):
    id: str
    repos: List[ConfiguredRepo]
    name: str
    createdAt: datetime
    updatedAt: datetime


class ConfiguredProjectResponse(BaseModel):
    id: UUID
    name: str
    repos: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


@router.post("/", response_model=ConfiguredProjectResponse)
async def create_configured_project(
    project: ConfiguredProjectCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = await db.execute(
            select(UserModel).where(UserModel.github_id == current_user.id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        configured_project = ConfiguredProjectModel(
            id=UUID(project.id),
            name=project.name,
            user_id=user.id,
            repos=[repo.model_dump() for repo in project.repos],
        )
        db.add(configured_project)
        await db.commit()
        await db.refresh(configured_project)
        
        return ConfiguredProjectResponse(
            id=configured_project.id,
            name=configured_project.name,
            repos=configured_project.repos,
            created_at=configured_project.created_at,
            updated_at=configured_project.updated_at,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create configured project: {str(e)}"
        )


@router.get("/")
async def get_configured_projects(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_result = await db.execute(
        select(UserModel).where(UserModel.github_id == current_user.id)
    )
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.execute(
        select(ConfiguredProjectModel).where(ConfiguredProjectModel.user_id == user.id)
    )
    projects = result.scalars().all()
    
    return [
        ConfiguredProjectResponse(
            id=project.id,
            name=project.name,
            repos=project.repos,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
        for project in projects
    ]

