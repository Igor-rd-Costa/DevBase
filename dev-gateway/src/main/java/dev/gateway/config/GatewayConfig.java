package dev.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Gateway configuration properties.
 */
@Configuration
public class GatewayConfig {

    @Value("${gateway.websocket.port:8081}")
    private int websocketPort;

    @Value("${gateway.backend.url:http://localhost:8000}")
    private String backendUrl;

    public int getWebsocketPort() {
        return websocketPort;
    }

    public String getBackendUrl() {
        return backendUrl;
    }
}
