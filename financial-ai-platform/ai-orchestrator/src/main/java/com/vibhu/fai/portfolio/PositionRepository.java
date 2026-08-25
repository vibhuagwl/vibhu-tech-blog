package com.vibhu.fai.portfolio;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PositionRepository extends JpaRepository<Position, Long> {
  List<Position> findByPortfolioId(String portfolioId);
}
