package com.vibhu.security.support.client;

import com.vibhu.security.pii.common.dto.CreateCustomerRequest;
import com.vibhu.security.pii.common.dto.CustomerRecord;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class CustomerServiceClient {

    private final RestClient restClient;

    public CustomerServiceClient(@Qualifier("customerServiceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public CustomerRecord create(CreateCustomerRequest request) {
        return restClient.post()
                .uri("/internal/customers")
                .body(request)
                .retrieve()
                .body(CustomerRecord.class);
    }

    public CustomerRecord get(UUID id) {
        return restClient.get()
                .uri("/internal/customers/{id}", id)
                .retrieve()
                .body(CustomerRecord.class);
    }
}
