package com.vibhu.sapi.rag;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "app.rag")
public record RagProperties(
    @DefaultValue("true") boolean seedEnabled,
    @DefaultValue("classpath:docs/*.md") String docsPattern,
    @DefaultValue("true") boolean failOnEmpty,
    @DefaultValue("3") int topK,
    @DefaultValue("0.0") double similarityThreshold) {}
