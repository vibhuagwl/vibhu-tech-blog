package com.vibhu.msp.payment.repository;

import com.vibhu.msp.payment.entity.InboxEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InboxRepository extends JpaRepository<InboxEntity, String> {}
