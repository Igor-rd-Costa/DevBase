import asyncio
import docker
import json
from enum import Enum
from typing import Optional, List
from devmanager.config import settings

class GatewayState(Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"

class Gateway:
    """
    Manages a single project execution as a Docker container.
    """
    
    def __init__(self, project_id: str, working_directory: str, command: List[str]):
        self.project_id = project_id
        self.working_directory = working_directory
        self.command = command
        self._state = GatewayState.PENDING
        self._container = None
        self._output_queue = asyncio.Queue()
        self._docker_client = docker.from_env()
        self._stream_task = None

    @property
    def state(self) -> GatewayState:
        return self._state

    @property
    def output_queue(self) -> asyncio.Queue:
        return self._output_queue

    async def run(self) -> None:
        """Starts the gateway container."""
        if self._state != GatewayState.PENDING:
            raise RuntimeError(f"Cannot run gateway in state {self._state}")

        # Construct environment for the agent
        env = {
            "GATEWAY_PROJECT_ID": self.project_id,
            "GATEWAY_WORKING_DIR": self.working_directory,
            "GATEWAY_COMMAND": json.dumps(self.command)
        }

        try:
            # Create and start the container
            # We use the dev-gateway image (which has the agent)
            self._container = self._docker_client.containers.run(
                image=settings.gateway_image,
                name=f"dev-gateway-{self.project_id}",
                environment=env,
                detach=True,
                remove=True, # Cleanup on stop
            )
            self._state = GatewayState.RUNNING
            
            # Start streaming logs
            self._stream_task = asyncio.create_task(self._stream_logs())
            
        except Exception as e:
            self._state = GatewayState.STOPPED
            await self._output_queue.put(f"[MANAGER] Failed to start container: {e}")
            raise

    async def shutdown(self) -> None:
        """Stops the container."""
        if not self._container:
            return

        self._state = GatewayState.STOPPED
        try:
            self._container.stop(timeout=5)
        except Exception:
            try:
                self._container.kill()
            except Exception:
                pass
        
        if self._stream_task:
            self._stream_task.cancel()
            try:
                await self._stream_task
            except asyncio.CancelledError:
                pass
        
        await self._output_queue.put("[GATEWAY] Container stopped")

    async def pause(self) -> None:
        if self._state != GatewayState.RUNNING:
            return
        if self._container:
            self._container.pause()
            self._state = GatewayState.PAUSED
            await self._output_queue.put("[GATEWAY] Container paused")

    async def resume(self) -> None:
        if self._state != GatewayState.PAUSED:
            return
        if self._container:
            self._container.unpause()
            self._state = GatewayState.RUNNING
            await self._output_queue.put("[GATEWAY] Container resumed")

    async def _stream_logs(self) -> None:
        """Streams container logs to the output queue."""
        if not self._container:
            return
            
        try:
            # We use a thread-based approach for log streaming since docker-py's logs() is blocking
            # but we can wrap it in a run_in_executor
            loop = asyncio.get_event_loop()
            
            # This is a bit tricky with docker-py. A better way might be to use 
            # the low-level API or just run a thread.
            def get_logs():
                for line in self._container.logs(stream=True, follow=True):
                    # In a thread, we use loop.call_soon_threadsafe to put in queue
                    msg = line.decode().rstrip()
                    loop.call_soon_threadsafe(self._output_queue.put_nowait, msg)

            await loop.run_in_executor(None, get_logs)
            
        except asyncio.CancelledError:
            pass
        except Exception as e:
            await self._output_queue.put(f"[MANAGER] Log stream error: {e}")
        finally:
            if self._state == GatewayState.RUNNING:
                self._state = GatewayState.STOPPED
                await self._output_queue.put("[GATEWAY] Container exited")

    async def wait(self) -> int:
        if not self._container:
            return -1
        # Blocking call, wrap in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self._container.wait)
        return result.get("StatusCode", -1)