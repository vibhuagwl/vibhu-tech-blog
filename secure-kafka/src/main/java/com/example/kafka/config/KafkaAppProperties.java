package com.example.kafka.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.kafka")
public class KafkaAppProperties {

    /**
     * When false (tests / local PLAINTEXT), SASL/SSL client properties are not applied.
     */
    private boolean securityEnabled = true;
    private String paymentsTopic = "payments";
    private String dltTopic = "payments.DLT";
    private String consumerGroup = "payment-service";
    private final Security security = new Security();

    public boolean isSecurityEnabled() {
        return securityEnabled;
    }

    public void setSecurityEnabled(boolean securityEnabled) {
        this.securityEnabled = securityEnabled;
    }

    public String getPaymentsTopic() {
        return paymentsTopic;
    }

    public void setPaymentsTopic(String paymentsTopic) {
        this.paymentsTopic = paymentsTopic;
    }

    public String getDltTopic() {
        return dltTopic;
    }

    public void setDltTopic(String dltTopic) {
        this.dltTopic = dltTopic;
    }

    public String getConsumerGroup() {
        return consumerGroup;
    }

    public void setConsumerGroup(String consumerGroup) {
        this.consumerGroup = consumerGroup;
    }

    public Security getSecurity() {
        return security;
    }

    public static class Security {
        private String protocol = "SASL_SSL";
        private String saslMechanism = "OAUTHBEARER";
        /**
         * Kafka-instantiated login callback. Default is Apache Kafka's production handler
         * ({@code OAuthBearerLoginCallbackHandler}), not a Spring Security filter.
         */
        private String loginCallbackHandlerClass =
                "org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginCallbackHandler";
        private String tokenEndpoint;
        private String producerClientId;
        private String producerClientSecret;
        private String consumerClientId;
        private String consumerClientSecret;
        private String scope = "kafka";
        private String truststoreLocation;
        private String truststorePassword;
        private String keystoreLocation;
        private String keystorePassword;
        private String keyPassword;

        public String getProtocol() {
            return protocol;
        }

        public void setProtocol(String protocol) {
            this.protocol = protocol;
        }

        public String getSaslMechanism() {
            return saslMechanism;
        }

        public void setSaslMechanism(String saslMechanism) {
            this.saslMechanism = saslMechanism;
        }

        public String getLoginCallbackHandlerClass() {
            return loginCallbackHandlerClass;
        }

        public void setLoginCallbackHandlerClass(String loginCallbackHandlerClass) {
            this.loginCallbackHandlerClass = loginCallbackHandlerClass;
        }

        public String getTokenEndpoint() {
            return tokenEndpoint;
        }

        public void setTokenEndpoint(String tokenEndpoint) {
            this.tokenEndpoint = tokenEndpoint;
        }

        public String getProducerClientId() {
            return producerClientId;
        }

        public void setProducerClientId(String producerClientId) {
            this.producerClientId = producerClientId;
        }

        public String getProducerClientSecret() {
            return producerClientSecret;
        }

        public void setProducerClientSecret(String producerClientSecret) {
            this.producerClientSecret = producerClientSecret;
        }

        public String getConsumerClientId() {
            return consumerClientId;
        }

        public void setConsumerClientId(String consumerClientId) {
            this.consumerClientId = consumerClientId;
        }

        public String getConsumerClientSecret() {
            return consumerClientSecret;
        }

        public void setConsumerClientSecret(String consumerClientSecret) {
            this.consumerClientSecret = consumerClientSecret;
        }

        public String getScope() {
            return scope;
        }

        public void setScope(String scope) {
            this.scope = scope;
        }

        public String getTruststoreLocation() {
            return truststoreLocation;
        }

        public void setTruststoreLocation(String truststoreLocation) {
            this.truststoreLocation = truststoreLocation;
        }

        public String getTruststorePassword() {
            return truststorePassword;
        }

        public void setTruststorePassword(String truststorePassword) {
            this.truststorePassword = truststorePassword;
        }

        public String getKeystoreLocation() {
            return keystoreLocation;
        }

        public void setKeystoreLocation(String keystoreLocation) {
            this.keystoreLocation = keystoreLocation;
        }

        public String getKeystorePassword() {
            return keystorePassword;
        }

        public void setKeystorePassword(String keystorePassword) {
            this.keystorePassword = keystorePassword;
        }

        public String getKeyPassword() {
            return keyPassword;
        }

        public void setKeyPassword(String keyPassword) {
            this.keyPassword = keyPassword;
        }
    }
}
