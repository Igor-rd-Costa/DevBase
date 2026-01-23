package dev.gateway.auth;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Global filter that validates all requests through the backend before
 * proxying.
 * 
 * This implements the "backend proxy" authentication model where all gateway
 * connections are validated through the main backend first.
 */
public class BackendAuthFilter implements GlobalFilter, Ordered {

    private final WebClient webClient;

    public BackendAuthFilter(WebClient webClient) {
        this.webClient = webClient;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Extract project ID from path (e.g., /project/{projectId}/...)
        String path = request.getPath().value();
        String projectId = extractProjectId(path);

        if (projectId == null) {
            // Non-project routes don't need auth validation
            return chain.filter(exchange);
        }

        // Get authorization header for backend validation
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || authHeader.isEmpty()) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // Validate with backend
        return validateWithBackend(projectId, authHeader)
                .flatMap(isValid -> {
                    if (isValid) {
                        return chain.filter(exchange);
                    } else {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }
                })
                .onErrorResume(error -> {
                    exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
                    return exchange.getResponse().setComplete();
                });
    }

    /**
     * Extracts project ID from request path.
     * Expected format: /project/{projectId}/...
     */
    private String extractProjectId(String path) {
        if (path == null || !path.startsWith("/project/")) {
            return null;
        }

        String[] parts = path.split("/");
        if (parts.length >= 3) {
            return parts[2];
        }
        return null;
    }

    /**
     * Validates project access with the backend.
     * 
     * @param projectId  The project ID to validate access for
     * @param authHeader The authorization header from the client
     * @return Mono<Boolean> indicating if access is allowed
     */
    private Mono<Boolean> validateWithBackend(String projectId, String authHeader) {
        return webClient.get()
                .uri("/configured-projects/{projectId}/validate", projectId)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .toBodilessEntity()
                .map(response -> response.getStatusCode().is2xxSuccessful())
                .onErrorReturn(false);
    }

    @Override
    public int getOrder() {
        // Run before other filters
        return -1;
    }
}
