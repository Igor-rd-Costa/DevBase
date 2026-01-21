from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from config import settings
from database import engine
from controllers import auth_controller, github_controller, configured_project_controller


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Check if database connection is available on startup."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
    except OperationalError as e:
        raise RuntimeError(
            f"Failed to connect to database. Please ensure the database exists and "
            f"the connection string is correct. Error: {str(e)}"
        )
    
    # Run migrations
    from alembic.config import Config
    from alembic import command
    import os
    
    try:
        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
        sync_url = settings.database_url.replace("+asyncpg", "+psycopg2")
        alembic_cfg.set_main_option("sqlalchemy.url", sync_url)
        command.upgrade(alembic_cfg, "head")
    except Exception as e:
        print(f"Failed to run migrations. Error: {str(e)}")

    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router)
app.include_router(github_controller.router)
app.include_router(configured_project_controller.router)


@app.get("/")
def read_root():
    return {"message": "Dev Backend API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
