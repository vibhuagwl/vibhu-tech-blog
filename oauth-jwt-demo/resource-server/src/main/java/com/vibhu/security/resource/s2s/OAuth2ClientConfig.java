package com.vibhu.security.resource.s2s;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.AuthorizedClientServiceOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.InMemoryOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProvider;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

@Configuration
public class OAuth2ClientConfig {

  @Bean
  OAuth2AuthorizedClientService authorizedClientService(
      ClientRegistrationRepository registrations) {
    return new InMemoryOAuth2AuthorizedClientService(registrations);
  }

  @Bean
  OAuth2AuthorizedClientManager authorizedClientManager(
      ClientRegistrationRepository registrations, OAuth2AuthorizedClientService clientService) {
    OAuth2AuthorizedClientProvider provider =
        OAuth2AuthorizedClientProviderBuilder.builder().clientCredentials().build();
    AuthorizedClientServiceOAuth2AuthorizedClientManager manager =
        new AuthorizedClientServiceOAuth2AuthorizedClientManager(registrations, clientService);
    manager.setAuthorizedClientProvider(provider);
    return manager;
  }
}
