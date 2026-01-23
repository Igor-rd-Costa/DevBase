package dev.gateway.execution;

import dev.gateway.routing.DynamicRouteService;
import dev.gateway.websocket.ConsoleWebSocketHandler;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for managing project execution processes.
 * 
 * Handles launching processes (for non-Docker projects) and streaming
 * their console output to connected WebSocket clients.
 */
@Service
public class ExecutionService {

    private final ConsoleWebSocketHandler consoleHandler;
    private final DynamicRouteService routeService;
    private final Map<String, Process> runningProcesses = new ConcurrentHashMap<>();

    public ExecutionService(ConsoleWebSocketHandler consoleHandler,
            DynamicRouteService routeService) {
        this.consoleHandler = consoleHandler;
        this.routeService = routeService;
    }

    /**
     * Starts a project execution with the given command.
     * 
     * @param projectId        The project ID
     * @param workingDirectory The working directory (mounted project path)
     * @param command          The command to execute
     * @return Mono indicating completion
     */
    public Mono<Void> startExecution(String projectId, String workingDirectory, String... command) {
        return Mono.fromCallable(() -> {
            ProcessBuilder builder = new ProcessBuilder(command);
            builder.directory(new java.io.File(workingDirectory));
            builder.redirectErrorStream(true);

            Process process = builder.start();
            runningProcesses.put(projectId, process);

            // Stream stdout/stderr to WebSocket clients
            streamOutput(projectId, process);

            return null;
        }).then();
    }

    /**
     * Stops a running project execution.
     * 
     * @param projectId The project ID
     */
    public void stopExecution(String projectId) {
        Process process = runningProcesses.remove(projectId);
        if (process != null) {
            process.destroyForcibly();
        }
        routeService.removeProjectRoute(projectId);
        consoleHandler.removeConsoleSink(projectId);
    }

    /**
     * Streams process output to WebSocket clients.
     */
    private void streamOutput(String projectId, Process process) {
        Thread outputThread = new Thread(() -> {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    consoleHandler.publishConsoleOutput(projectId, line);
                }
            } catch (Exception e) {
                consoleHandler.publishConsoleOutput(projectId,
                        "[ERROR] Stream interrupted: " + e.getMessage());
            } finally {
                runningProcesses.remove(projectId);
            }
        });
        outputThread.setDaemon(true);
        outputThread.setName("console-" + projectId);
        outputThread.start();
    }

    /**
     * Checks if a project has an active execution.
     */
    public boolean isRunning(String projectId) {
        Process process = runningProcesses.get(projectId);
        return process != null && process.isAlive();
    }
}
