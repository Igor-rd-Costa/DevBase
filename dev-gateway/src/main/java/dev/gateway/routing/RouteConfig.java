package dev.gateway.routing;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

/**
 * Dynamic route configuration for project execution containers.
 * 
 * Routes are configured based on project IDs and their target execution
 * containers. Frontend apps (NextJS, Angular) and backend services are
 * routed through this gateway.
 */
@Configuration
public class RouteConfig {

    /**
     * Base routes for gateway.
     * 
     * Dynamic project routes will be added programmatically when
     * execution containers are launched.
     */
    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                // Health check endpoint
                .route("health", r -> r
                        .path("/health")
                        .filters(f -> f.setStatus(HttpStatus.OK))
                        .uri("no://op"))
                .build();
    }
}
