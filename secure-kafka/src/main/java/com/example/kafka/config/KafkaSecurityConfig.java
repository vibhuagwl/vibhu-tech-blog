package com.example.kafka.config;

import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.config.SslConfigs;
import org.apache.kafka.common.security.auth.SecurityProtocol;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * Shared Kafka <em>client</em> security properties.
 * <p>
 * This is not a Spring Security {@code SecurityFilterChain}. HTTP JWT validation lives in
 * {@link SecurityConfig}. Kafka identity is SASL/OAUTHBEARER over TLS, then broker ACLs.
 */
@Component
public class KafkaSecurityConfig {

    private static final String OAUTH_LOGIN_MODULE = "org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule";

    private final KafkaAppProperties properties;

    public KafkaSecurityConfig(KafkaAppProperties properties) {
        this.properties = properties;
    }

    public Map<String, Object> producerSecurityProperties() {
        KafkaAppProperties.Security security = properties.getSecurity();
        return securityProperties(security.getProducerClientId(), security.getProducerClientSecret());
    }

    public Map<String, Object> consumerSecurityProperties() {
        KafkaAppProperties.Security security = properties.getSecurity();
        return securityProperties(security.getConsumerClientId(), security.getConsumerClientSecret());
    }

    private Map<String, Object> securityProperties(String clientId, String clientSecret) {
        Map<String, Object> props = new HashMap<>();
        if (!properties.isSecurityEnabled()) {
            return props;
        }
        KafkaAppProperties.Security security = properties.getSecurity();
        props.put("security.protocol", security.getProtocol());
        if (usesSasl(security.getProtocol())) {
            props.put(SaslConfigs.SASL_MECHANISM, security.getSaslMechanism());
            if ("OAUTHBEARER".equalsIgnoreCase(security.getSaslMechanism())) {
                props.put(SaslConfigs.SASL_LOGIN_CALLBACK_HANDLER_CLASS, security.getLoginCallbackHandlerClass());
                props.put(SaslConfigs.SASL_OAUTHBEARER_TOKEN_ENDPOINT_URL, security.getTokenEndpoint());
                props.put(SaslConfigs.SASL_JAAS_CONFIG, oauthJaas(clientId, clientSecret, security.getScope()));
            } else {
                props.put(SaslConfigs.SASL_JAAS_CONFIG,
                        jaasForMechanism(security.getSaslMechanism(), clientId, clientSecret));
            }
        }
        putSsl(props, security);
        return props;
    }

    private static boolean usesSasl(String protocol) {
        return SecurityProtocol.SASL_SSL.name()
                .equals(protocol) || SecurityProtocol.SASL_PLAINTEXT.name()
                .equals(protocol);
    }

    /**
     * JAAS for Kafka's {@code OAuthBearerLoginModule}. Options are {@code clientId},
     * {@code clientSecret}, and optional {@code scope} — the names Kafka's
     * {@code OAuthBearerLoginCallbackHandler} reads (Kafka 3.1+).
     */
    public static String oauthJaas(String clientId, String clientSecret, String scope) {
        StringBuilder jaas = new StringBuilder(OAUTH_LOGIN_MODULE).append(" required clientId=\"")
                .append(escapeJaas(clientId))
                .append("\" clientSecret=\"")
                .append(escapeJaas(clientSecret))
                .append('"');
        if (StringUtils.hasText(scope)) {
            jaas.append(" scope=\"")
                    .append(escapeJaas(scope))
                    .append('"');
        }
        return jaas.append(';')
                .toString();
    }

    static String jaasForMechanism(String mechanism, String username, String password) {
        if ("PLAIN".equalsIgnoreCase(mechanism) || "SCRAM-SHA-256".equalsIgnoreCase(mechanism) || "SCRAM-SHA-512".equalsIgnoreCase(
                mechanism)) {
            String module = "PLAIN".equalsIgnoreCase(mechanism) ? "org.apache.kafka.common.security.plain.PlainLoginModule" : "org.apache.kafka.common.security.scram.ScramLoginModule";
            return module + " required username=\"" + escapeJaas(username) + "\" password=\"" + escapeJaas(password) + "\";";
        }
        throw new IllegalArgumentException("Unsupported SASL mechanism: " + mechanism);
    }

    private static void putSsl(Map<String, Object> props, KafkaAppProperties.Security security) {
        if (!usesSsl(security.getProtocol())) {
            return;
        }
        if (StringUtils.hasText(security.getTruststoreLocation())) {
            props.put(SslConfigs.SSL_TRUSTSTORE_LOCATION_CONFIG, security.getTruststoreLocation());
            props.put(SslConfigs.SSL_TRUSTSTORE_PASSWORD_CONFIG, security.getTruststorePassword());
            props.put(SslConfigs.SSL_TRUSTSTORE_TYPE_CONFIG, "PKCS12");
        }
        if (StringUtils.hasText(security.getKeystoreLocation())) {
            props.put(SslConfigs.SSL_KEYSTORE_LOCATION_CONFIG, security.getKeystoreLocation());
            props.put(SslConfigs.SSL_KEYSTORE_PASSWORD_CONFIG, security.getKeystorePassword());
            props.put(SslConfigs.SSL_KEY_PASSWORD_CONFIG,
                    StringUtils.hasText(security.getKeyPassword()) ? security.getKeyPassword() : security.getKeystorePassword());
            props.put(SslConfigs.SSL_KEYSTORE_TYPE_CONFIG, "PKCS12");
        }
        props.put(SslConfigs.SSL_ENDPOINT_IDENTIFICATION_ALGORITHM_CONFIG, "https");
    }

    private static boolean usesSsl(String protocol) {
        return SecurityProtocol.SSL.name()
                .equals(protocol) || SecurityProtocol.SASL_SSL.name()
                .equals(protocol);
    }

    private static String escapeJaas(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}
