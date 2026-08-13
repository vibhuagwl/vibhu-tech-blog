package com.vibhu.hadron.service;

import com.vibhu.hadron.config.HadronProperties;
import com.vibhu.hadron.domain.DlqStatus;
import com.vibhu.hadron.repository.DeadLetterMessageRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DeadLetterRetentionJob {

  private static final Logger log = LoggerFactory.getLogger(DeadLetterRetentionJob.class);

  private final DeadLetterMessageRepository repository;
  private final HadronProperties properties;

  public DeadLetterRetentionJob(DeadLetterMessageRepository repository, HadronProperties properties) {
    this.repository = repository;
    this.properties = properties;
  }

  @Scheduled(cron = "0 30 3 * * *")
  @Transactional
  public int cleanup() {
    Instant cutoff = Instant.now().minus(properties.getDlq().getRetentionDays(), ChronoUnit.DAYS);
    int removed =
        repository.deleteExpired(EnumSet.of(DlqStatus.RESOLVED, DlqStatus.IGNORED, DlqStatus.REPLAYED), cutoff);
    if (removed > 0) {
      log.info("DLQ retention deleted {} rows older than {}", removed, cutoff);
    }
    return removed;
  }
}
