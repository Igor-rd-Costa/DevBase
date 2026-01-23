package dev.gateway.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for streaming console output from execution containers.
 * 
 * Clients connect to receive real-time console output from running
 * applications.
 * Output is streamed via reactive Sinks for backpressure handling.
 */
@Component
public class ConsoleWebSocketHandler implements WebSocketHandler {

    // Map of project ID to console output sink
    private final Map<String, Sinks.Many<String>> consoleSinks = new ConcurrentHashMap<>();

    // Map of session ID to project ID for cleanup
    private final Map<String, String> sessionProjects = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // Extract project ID from query params
        String projectId = session.getHandshakeInfo()
                .getUri()
                .getQuery();

        if (projectId == null || projectId.isEmpty()) {
            return session.close();
        }

        // Parse projectId from query string (e.g., "projectId=abc123")
        String parsedProjectId = parseProjectId(projectId);
        if (parsedProjectId == null) {
            return session.close();
        }

        sessionProjects.put(session.getId(), parsedProjectId);

        // Get or create sink for this project
        Sinks.Many<String> sink = consoleSinks.computeIfAbsent(
                parsedProjectId,
                k -> Sinks.many().multicast().onBackpressureBuffer());

        // Stream console output to client
        Flux<WebSocketMessage> output = sink.asFlux()
                .map(session::textMessage);

        // Handle incoming messages (e.g., for stdin input)
        Mono<Void> input = session.receive()
                .doOnNext(message -> handleClientMessage(parsedProjectId, message))
                .then();

        return Mono.zip(session.send(output), input)
                .doFinally(signal -> cleanup(session.getId()))
                .then();
    }

    /**
     * Publishes console output for a project.
     * Called by the execution service when output is received from containers.
     * 
     * @param projectId The project ID
     * @param output    The console output line
     */
    public void publishConsoleOutput(String projectId, String output) {
        Sinks.Many<String> sink = consoleSinks.get(projectId);
        if (sink != null) {
            sink.tryEmitNext(output);
        }
    }

    /**
     * Handles messages received from WebSocket clients.
     * Can be used for stdin input to execution containers.
     */
    private void handleClientMessage(String projectId, WebSocketMessage message) {
        // TODO: Forward stdin input to execution container
        String payload = message.getPayloadAsText();
        // Implementation will depend on how execution containers handle stdin
    }

    /**
     * Cleans up resources when a session disconnects.
     */
    private void cleanup(String sessionId) {
        String projectId = sessionProjects.remove(sessionId);
        if (projectId != null) {
            // Only remove sink if no more sessions are subscribed
            // This is simplified - production would track session count
        }
    }

    /**
     * Parses project ID from query string.
     */
    private String parseProjectId(String query) {
        for (String param : query.split("&")) {
            String[] keyValue = param.split("=");
            if (keyValue.length == 2 && "projectId".equals(keyValue[0])) {
                return keyValue[1];
            }
        }
        return null;
    }

    /**
     * Removes the console sink for a project when execution stops.
     */
    public void removeConsoleSink(String projectId) {
        Sinks.Many<String> sink = consoleSinks.remove(projectId);
        if (sink != null) {
            sink.tryEmitComplete();
        }
    }
}
