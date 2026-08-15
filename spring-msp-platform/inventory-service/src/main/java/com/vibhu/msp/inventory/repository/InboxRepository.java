package com.vibhu.msp.inventory.repository;

import com.vibhu.msp.inventory.entity.InboxEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InboxRepository extends JpaRepository<InboxEntity, String> {}
