package dev.gateway.config;

import dev.gateway.auth.BackendAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * WebClient configuration for backend communication.
 */
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(GatewayConfig gatewayConfig) {
        return WebClient.builder()
                .baseUrl(gatewayConfig.getBackendUrl())
                .build();
    }

    @Bean
    public BackendAuthFilter backendAuthFilter(WebClient webClient) {
        return new BackendAuthFilter(webClient);
    }
}
