import asyncio
from typing import Optional, List, Dict
from devmanager.gateway.gateway import Gateway, GatewayState

class GatewayManager:
    """
    Manages all Gateway (Docker container) instances.
    """
    
    def __init__(self):
        self._gateways: Dict[str, Gateway] = {}
    
    @property
    def gateways(self) -> Dict[str, Gateway]:
        return self._gateways
    
    def get_gateway(self, project_id: str) -> Optional[Gateway]:
        return self._gateways.get(project_id)
    
    async def create_gateway(
        self,
        project_id: str,
        working_directory: str,
        command: List[str]
    ) -> Gateway:
        if project_id in self._gateways:
            raise ValueError(f"Gateway already exists for project {project_id}")
        
        gateway = Gateway(project_id, working_directory, command)
        self._gateways[project_id] = gateway
        await gateway.run()
        
        return gateway
    
    async def stop_gateway(self, project_id: str) -> bool:
        gateway = self._gateways.pop(project_id, None)
        if gateway is None:
            return False
        
        await gateway.shutdown()
        return True
    
    async def pause_gateway(self, project_id: str) -> bool:
        gateway = self._gateways.get(project_id)
        if gateway:
            await gateway.pause()
            return True
        return False
    
    async def resume_gateway(self, project_id: str) -> bool:
        gateway = self._gateways.get(project_id)
        if gateway:
            await gateway.resume()
            return True
        return False
    
    def get_gateway_status(self, project_id: str) -> Optional[dict]:
        gateway = self._gateways.get(project_id)
        if not gateway:
            return None
        return {
            "project_id": gateway.project_id,
            "state": gateway.state.value,
            "working_directory": gateway.working_directory,
            "command": gateway.command,
        }
    
    def list_gateways(self) -> List[dict]:
        return [
            {"project_id": gw.project_id, "state": gw.state.value}
            for gw in self._gateways.values()
        ]
    
    async def shutdown_all(self) -> None:
        for pid in list(self._gateways.keys()):
            await self.stop_gateway(pid)