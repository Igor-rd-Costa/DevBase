import asyncio
import sys
import os
import json
import signal
from devgateway.gateway.gateway import Gateway

async def main():
    """
    Entrypoint for the Gateway Agent running inside a container.
    
    It reads configuration from environment variables and uses the Gateway class
    to manage the actual project process, streaming its output to stdout.
    """
    project_id = os.environ.get("GATEWAY_PROJECT_ID", "default")
    working_dir = os.environ.get("GATEWAY_WORKING_DIR", "/app")
    command_str = os.environ.get("GATEWAY_COMMAND", "[]")
    
    try:
        command = json.loads(command_str)
        if not isinstance(command, list):
            command = [str(command)]
    except json.JSONDecodeError:
        command = command_str.split()

    if not command or command == [""]:
        print("[GATEWAY] Error: No command provided. "
              "The GATEWAY_COMMAND environment variable must be set to the command you want to execute "
              "(e.g., '[\"npm\", \"start\"]' or 'python main.py').", file=sys.stderr)
        sys.exit(1)

    print(f"[GATEWAY] Starting project {project_id} with command: {' '.join(command)}")
    
    gateway = Gateway(project_id, working_dir, command)
    
    # Task to pipe output from the Gateway queue to the container's stdout
    async def pipe_output():
        queue = gateway.output_queue
        while True:
            line = await queue.get()
            print(line, flush=True)
            # Stop piping when we see a termination message
            if "[GATEWAY] Process stopped" in line or "[GATEWAY] Process exited" in line:
                break

    # Start the project process
    try:
        await gateway.run()
    except Exception as e:
        print(f"[GATEWAY] Error starting process: {e}", file=sys.stderr)
        sys.exit(1)
        
    output_task = asyncio.create_task(pipe_output())
    
    # Wait for the process to complete
    exit_code = await gateway.wait()
    
    # Wait a bit for remaining output to be piped
    try:
        await asyncio.wait_for(output_task, timeout=2.0)
    except asyncio.TimeoutError:
        output_task.cancel()
    
    print(f"[GATEWAY] Agent exiting with code {exit_code}")
    sys.exit(exit_code)

if __name__ == "__main__":
    # Ensure signals are handled properly
    # Note: Docker stop sends SIGTERM. SIGSTOP/SIGCONT for pause/resume are handled by Docker.
    asyncio.run(main())
