package dev.gateway.routing;

import org.springframework.cloud.gateway.event.RefreshRoutesEvent;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for dynamically managing routes to execution containers.
 * 
 * When a project execution is launched, routes are registered here to proxy
 * HTTP requests to the correct container.
 */
@Service
public class DynamicRouteService implements RouteLocator {

    private final Map<String, ProjectRoute> projectRoutes = new ConcurrentHashMap<>();
    private final RouteLocatorBuilder routeLocatorBuilder;
    private final ApplicationEventPublisher eventPublisher;

    public DynamicRouteService(RouteLocatorBuilder routeLocatorBuilder,
            ApplicationEventPublisher eventPublisher) {
        this.routeLocatorBuilder = routeLocatorBuilder;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Registers a route for a project execution container.
     * 
     * @param projectId  The project ID
     * @param targetHost The execution container host
     * @param targetPort The execution container port
     */
    public void addProjectRoute(String projectId, String targetHost, int targetPort) {
        ProjectRoute route = new ProjectRoute(projectId, targetHost, targetPort);
        projectRoutes.put(projectId, route);
        refreshRoutes();
    }

    /**
     * Removes a route when project execution stops.
     * 
     * @param projectId The project ID to remove
     */
    public void removeProjectRoute(String projectId) {
        projectRoutes.remove(projectId);
        refreshRoutes();
    }

    /**
     * Gets all currently registered project routes.
     */
    public Map<String, ProjectRoute> getProjectRoutes() {
        return Map.copyOf(projectRoutes);
    }

    /**
     * Checks if a project has an active route.
     */
    public boolean hasRoute(String projectId) {
        return projectRoutes.containsKey(projectId);
    }

    @Override
    public Flux<Route> getRoutes() {
        RouteLocatorBuilder.Builder builder = routeLocatorBuilder.routes();

        for (Map.Entry<String, ProjectRoute> entry : projectRoutes.entrySet()) {
            String projectId = entry.getKey();
            ProjectRoute route = entry.getValue();

            builder.route("project-" + projectId, r -> r
                    .path("/project/" + projectId + "/**")
                    .filters(f -> f.stripPrefix(2)) // Remove /project/{projectId}
                    .uri("http://" + route.targetHost() + ":" + route.targetPort()));
        }

        return builder.build().getRoutes();
    }

    private void refreshRoutes() {
        eventPublisher.publishEvent(new RefreshRoutesEvent(this));
    }

    /**
     * Represents a route to a project execution container.
     */
    public record ProjectRoute(String projectId, String targetHost, int targetPort) {
    }
}
