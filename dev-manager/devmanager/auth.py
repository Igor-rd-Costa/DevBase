from fastapi import Header, HTTPException, status
from devmanager.config import settings

async def verify_internal_token(x_internal_token: str = Header(...)) -> None:
    """
    FastAPI dependency to verify the internal API token.
    """
    if x_internal_token != settings.internal_api_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API token"
        )
