package com.vibhu.msp.notification.repository;

import com.vibhu.msp.notification.entity.InboxEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InboxRepository extends JpaRepository<InboxEntity, String> {}
