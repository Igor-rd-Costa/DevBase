from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

from devmanager.gateway_manager import GatewayManager
from devmanager.routes import create_gateway_router, create_console_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    manager = GatewayManager()
    app.state.gateway_manager = manager
    
    # App is already created, but we can mount routes here if we want 
    # OR we can just use the manager instance in the router functions
    app.include_router(create_gateway_router(manager))
    app.include_router(create_console_router(manager))
    
    yield
    
    # Shutdown
    await manager.shutdown_all()

app = FastAPI(
    title="Dev Manager",
    lifespan=lifespan
)

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    from devmanager.config import settings
    uvicorn.run(app, host="0.0.0.0", port=settings.gateway_http_port)
