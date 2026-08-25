package com.vibhu.fai.approval;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRepository extends JpaRepository<ApprovalRequest, Long> {}
