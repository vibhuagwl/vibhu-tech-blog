package com.vibhu.msp.order.repository;

import com.vibhu.msp.order.entity.InboxEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InboxRepository extends JpaRepository<InboxEntity, String> {}
