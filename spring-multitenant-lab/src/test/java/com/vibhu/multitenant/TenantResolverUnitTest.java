package com.vibhu.multitenant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.multitenant.config.MultiTenantProperties;
import com.vibhu.multitenant.exception.TenantExceptions;
import com.vibhu.multitenant.tenant.context.TenantContext;
import com.vibhu.multitenant.tenant.resolver.HeaderTenantResolver;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class TenantResolverUnitTest {

  @Test
  void headerResolverReadsXTenantId() {
    MultiTenantProperties props = new MultiTenantProperties();
    HeaderTenantResolver resolver = new HeaderTenantResolver(props);
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("X-Tenant-ID", "Walmart");
    assertThat(resolver.resolveSlug(request)).contains("walmart");
  }

  @Test
  void requireTenantThrowsWhenEmpty() {
    TenantContext.clear();
    assertThatThrownBy(TenantContext::requireTenantId).isInstanceOf(IllegalStateException.class);
  }

  @Test
  void forbiddenExceptionIs403() {
    assertThat(TenantExceptions.forbidden().httpStatus()).isEqualTo(403);
    assertThat(TenantExceptions.mismatch().code()).isEqualTo("tenant_mismatch");
  }
}
