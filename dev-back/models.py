from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from uuid import uuid4
from database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "adm_user"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    github_id = Column(Integer, unique=True, nullable=False, index=True)
    github_access_token = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ConfiguredProject(Base):
    __tablename__ = "cde_configured_project"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    name = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("adm_user.id"), nullable=False)
    repos = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id])

