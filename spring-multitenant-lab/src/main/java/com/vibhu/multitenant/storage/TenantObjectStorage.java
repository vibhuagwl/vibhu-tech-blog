package com.vibhu.multitenant.storage;

import com.vibhu.multitenant.config.MultiTenantProperties;
import com.vibhu.multitenant.tenant.context.TenantContext;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Object keys are always tenant-prefixed:
 *
 * <pre>tenant-a/orders/123.pdf</pre>
 *
 * Never store {@code /orders/123.pdf} — that leaks across tenants via guessable paths.
 */
@Service
public class TenantObjectStorage {

  private final Path root;

  public TenantObjectStorage(MultiTenantProperties properties) throws IOException {
    this.root = Path.of(properties.getObjectStorage().getRoot());
    Files.createDirectories(root);
  }

  public Path storeOrderFile(UUID orderId, byte[] content, String filename) throws IOException {
    String slug = TenantContext.requireTenantSlug();
    Path dir = root.resolve(slug).resolve("orders").resolve(orderId.toString());
    Files.createDirectories(dir);
    Path file = dir.resolve(sanitize(filename));
    Files.write(file, content);
    return file;
  }

  public Path resolve(String tenantSlug, UUID orderId, String filename) {
    return root.resolve(tenantSlug)
        .resolve("orders")
        .resolve(orderId.toString())
        .resolve(sanitize(filename));
  }

  private String sanitize(String filename) {
    return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
  }
}
