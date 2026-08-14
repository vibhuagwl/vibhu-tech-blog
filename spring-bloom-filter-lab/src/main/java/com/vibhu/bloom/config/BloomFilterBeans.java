package com.vibhu.bloom.config;

import com.vibhu.bloom.core.BloomFilter;
import com.vibhu.bloom.core.BloomFilterConfig;
import com.vibhu.bloom.core.DoubleHashStrategy;
import com.vibhu.bloom.service.BloomFilterMetrics;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BloomFilterBeans {

  @Bean
  BloomFilterConfig bloomFilterConfig(BloomProperties props) {
    return BloomFilterConfig.of(props.expectedInsertions(), props.falsePositiveRate());
  }

  @Bean
  BloomFilter<String> userIdBloomFilter(BloomFilterConfig config) {
    return new BloomFilter<>(config, new DoubleHashStrategy(), s -> s.getBytes(java.nio.charset.StandardCharsets.UTF_8));
  }

  @Bean
  BloomFilterMetrics bloomFilterMetrics(MeterRegistry registry, BloomFilter<String> userIdBloomFilter) {
    return new BloomFilterMetrics(registry, userIdBloomFilter);
  }
}
