package com.vibhu.msp.decompose;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Demonstrates decomposition by business capability — each capability owns its data boundary. Maps
 * to curriculum Part 01 (Decomposition patterns).
 */
public final class PackageBoundariesDemo {

  public record Capability(String name, String ownerTeam, Set<String> ownedEntities) {}

  public record ServiceBoundary(String serviceName, Capability capability, boolean ownsDatabase) {}

  private final Map<String, ServiceBoundary> boundaries = new LinkedHashMap<>();

  public PackageBoundariesDemo register(ServiceBoundary boundary) {
    boundaries.put(boundary.serviceName(), Objects.requireNonNull(boundary));
    return this;
  }

  public ServiceBoundary boundaryFor(String serviceName) {
    ServiceBoundary boundary = boundaries.get(serviceName);
    if (boundary == null) {
      throw new IllegalArgumentException("Unknown service: " + serviceName);
    }
    return boundary;
  }

  public boolean violatesDataOwnership(String serviceA, String serviceB, String entity) {
    ServiceBoundary a = boundaryFor(serviceA);
    ServiceBoundary b = boundaryFor(serviceB);
    boolean aOwns = a.capability().ownedEntities().contains(entity);
    boolean bOwns = b.capability().ownedEntities().contains(entity);
    return aOwns && bOwns && !serviceA.equals(serviceB);
  }

  public Map<String, ServiceBoundary> allBoundaries() {
    return Map.copyOf(boundaries);
  }
}
