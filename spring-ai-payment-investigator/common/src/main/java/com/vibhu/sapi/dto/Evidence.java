package com.vibhu.sapi.dto;

public record Evidence(
    String sourceType, String sourceId, String summary, String confidence) {}
