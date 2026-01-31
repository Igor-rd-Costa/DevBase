import asyncio
import signal
from enum import Enum
from typing import Optional


class GatewayState(Enum):
    """States a gateway can be in during its lifecycle."""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"


class Gateway:
    """
    Manages a single project execution process.
    
    Provides lifecycle controls (run, shutdown, pause, resume) and
    streams console output via an async queue.
    """
    
    def __init__(self, project_id: str, working_directory: str, command: list[str]):
        self.project_id = project_id
        self.working_directory = working_directory
        self.command = command
        self._state = GatewayState.PENDING
        self._process: Optional[asyncio.subprocess.Process] = None
        self._output_queue: asyncio.Queue[str] = asyncio.Queue()
        self._stream_task: Optional[asyncio.Task] = None
    
    @property
    def state(self) -> GatewayState:
        """Current state of the gateway."""
        return self._state
    
    @property
    def output_queue(self) -> asyncio.Queue[str]:
        """Queue for consuming console output."""
        return self._output_queue
    
    async def run(self) -> None:
        """
        Start the execution process.
        
        Raises:
            RuntimeError: If gateway is not in PENDING state.
        """
        if self._state != GatewayState.PENDING:
            raise RuntimeError(f"Cannot run gateway in state {self._state}")
        
        self._process = await asyncio.create_subprocess_exec(
            *self.command,
            cwd=self.working_directory,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            stdin=asyncio.subprocess.PIPE,
        )
        self._state = GatewayState.RUNNING
        
        # Start streaming output
        self._stream_task = asyncio.create_task(self._stream_output())
    
    async def shutdown(self) -> None:
        """
        Stop the execution process gracefully, then forcefully if needed.
        """
        if self._process is None or self._state == GatewayState.STOPPED:
            return
        
        self._state = GatewayState.STOPPED
        
        # Try graceful shutdown first
        try:
            self._process.terminate()
            await asyncio.wait_for(self._process.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            # Force kill if graceful shutdown times out
            self._process.kill()
            await self._process.wait()
        
        # Cancel the stream task
        if self._stream_task:
            self._stream_task.cancel()
            try:
                await self._stream_task
            except asyncio.CancelledError:
                pass
        
        # Signal end of output
        await self._output_queue.put("[GATEWAY] Process stopped")
    
    async def pause(self) -> None:
        """
        Pause the execution process (SIGSTOP on Unix).
        
        Raises:
            RuntimeError: If gateway is not in RUNNING state.
        """
        if self._state != GatewayState.RUNNING:
            raise RuntimeError(f"Cannot pause gateway in state {self._state}")
        
        if self._process and self._process.pid:
            self._process.send_signal(signal.SIGSTOP)
            self._state = GatewayState.PAUSED
            await self._output_queue.put("[GATEWAY] Process paused")
    
    async def resume(self) -> None:
        """
        Resume a paused execution process (SIGCONT on Unix).
        
        Raises:
            RuntimeError: If gateway is not in PAUSED state.
        """
        if self._state != GatewayState.PAUSED:
            raise RuntimeError(f"Cannot resume gateway in state {self._state}")
        
        if self._process and self._process.pid:
            self._process.send_signal(signal.SIGCONT)
            self._state = GatewayState.RUNNING
            await self._output_queue.put("[GATEWAY] Process resumed")
    
    async def send_input(self, input_text: str) -> None:
        """
        Send input to the process stdin.
        
        Args:
            input_text: Text to send (newline will be appended if not present).
        """
        if self._process is None or self._process.stdin is None:
            return
        
        if not input_text.endswith("\n"):
            input_text += "\n"
        
        self._process.stdin.write(input_text.encode())
        await self._process.stdin.drain()
    
    async def _stream_output(self) -> None:
        """Stream stdout/stderr to the output queue."""
        if self._process is None or self._process.stdout is None:
            return
        
        try:
            while True:
                line = await self._process.stdout.readline()
                if not line:
                    break
                await self._output_queue.put(line.decode().rstrip())
        except asyncio.CancelledError:
            pass
        finally:
            # Mark process as stopped if it exited
            if self._state == GatewayState.RUNNING:
                self._state = GatewayState.STOPPED
                await self._output_queue.put("[GATEWAY] Process exited")
    
    async def wait(self) -> int:
        """
        Wait for the process to complete.
        
        Returns:
            The process exit code.
        """
        if self._process is None:
            return -1
        return await self._process.wait()