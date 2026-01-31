from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from typing import List, Optional
import asyncio

from devmanager.auth import verify_internal_token
from devmanager.gateway_manager import GatewayManager

class StartGatewayRequest(BaseModel):
    working_directory: str
    command: List[str]

class GatewayStatusResponse(BaseModel):
    project_id: str
    state: str
    working_directory: Optional[str] = None
    command: Optional[List[str]] = None

def create_gateway_router(manager: GatewayManager) -> APIRouter:
    router = APIRouter(
        prefix="/gateways",
        tags=["gateways"],
        dependencies=[Depends(verify_internal_token)]
    )
    
    @router.get("/", response_model=List[dict])
    async def list_gateways():
        return manager.list_gateways()
    
    @router.get("/{project_id}", response_model=GatewayStatusResponse)
    async def get_gateway(project_id: str):
        status = manager.get_gateway_status(project_id)
        if not status:
            raise HTTPException(404, "Gateway not found")
        return status
    
    @router.post("/{project_id}/start", response_model=GatewayStatusResponse)
    async def start_gateway(project_id: str, request: StartGatewayRequest):
        try:
            gateway = await manager.create_gateway(
                project_id, request.working_directory, request.command
            )
            return manager.get_gateway_status(project_id)
        except ValueError as e:
            raise HTTPException(409, str(e))
    
    @router.post("/{project_id}/stop")
    async def stop_gateway(project_id: str):
        if await manager.stop_gateway(project_id):
            return {"status": "stopped"}
        raise HTTPException(404, "Gateway not found")

    return router

def create_console_router(manager: GatewayManager) -> APIRouter:
    router = APIRouter(tags=["console"])
    
    @router.websocket("/console/{project_id}")
    async def console_websocket(websocket: WebSocket, project_id: str):
        # WebSocket auth
        token = websocket.query_params.get("token")
        from devmanager.config import settings
        if token != settings.internal_api_token:
            await websocket.close(code=4001, reason="Invalid token")
            return
            
        gateway = manager.get_gateway(project_id)
        if not gateway:
            await websocket.close(code=4004, reason="Gateway not found")
            return
            
        await websocket.accept()
        try:
            while True:
                line = await asyncio.wait_for(gateway.output_queue.get(), timeout=30.0)
                await websocket.send_text(line)
        except (WebSocketDisconnect, asyncio.TimeoutError):
            pass
            
    return router
