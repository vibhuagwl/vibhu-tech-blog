package com.vibhu.fai.web;

import com.vibhu.fai.common.dto.PositionView;
import com.vibhu.fai.common.security.AuthContext;
import com.vibhu.fai.portfolio.PortfolioService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {
  private final PortfolioService portfolios;

  public PortfolioController(PortfolioService portfolios) {
    this.portfolios = portfolios;
  }

  @GetMapping("/{portfolioId}")
  public List<PositionView> get(
      @PathVariable String portfolioId,
      @RequestHeader(value = "X-Tenant-Id", defaultValue = "TENANT-1") String tenantId) {
    return portfolios.getPositions(portfolioId, new AuthContext(tenantId, "user-demo", "ANALYST"));
  }
}
