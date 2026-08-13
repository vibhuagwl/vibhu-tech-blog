package com.vibhu.spring.cache.config;

import java.lang.reflect.Method;
import java.util.Arrays;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.stereotype.Component;

@Component("tenantKeyGen")
public class TenantKeyGenerator implements KeyGenerator {
  @Override
  public Object generate(Object target, Method method, Object... params) {
    String tenant = TenantContext.get();
    return tenant + ":" + Arrays.deepToString(params);
  }
}
