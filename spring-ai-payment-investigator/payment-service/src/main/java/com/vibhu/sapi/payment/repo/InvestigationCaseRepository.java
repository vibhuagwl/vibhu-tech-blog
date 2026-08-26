package com.vibhu.sapi.payment.repo;

import com.vibhu.sapi.payment.entity.InvestigationCaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestigationCaseRepository extends JpaRepository<InvestigationCaseEntity, String> {}
