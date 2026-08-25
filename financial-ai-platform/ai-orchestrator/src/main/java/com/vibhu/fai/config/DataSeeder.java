package com.vibhu.fai.config;

import com.vibhu.fai.market.MarketPrice;
import com.vibhu.fai.market.MarketPriceRepository;
import com.vibhu.fai.payment.Payment;
import com.vibhu.fai.payment.PaymentRepository;
import com.vibhu.fai.payment.PaymentStatus;
import com.vibhu.fai.portfolio.Position;
import com.vibhu.fai.portfolio.PositionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

  @Bean
  CommandLineRunner seed(
      PaymentRepository payments, PositionRepository positions, MarketPriceRepository prices) {
    return args -> {
      if (payments.count() > 0) {
        return;
      }
      Instant now = Instant.now();
      payments.save(
          new Payment(
              "TXN-1001",
              new BigDecimal("250000"),
              "INR",
              PaymentStatus.FAILED,
              "AC04",
              "Account closed",
              "ACC-9",
              "TENANT-1",
              now));
      payments.save(
          new Payment(
              "TXN-1002",
              new BigDecimal("15000"),
              "INR",
              PaymentStatus.SUCCESS,
              "00",
              null,
              "ACC-9",
              "TENANT-1",
              now));
      payments.save(
          new Payment(
              "TXN-1003",
              new BigDecimal("5000"),
              "INR",
              PaymentStatus.FAILED,
              "AM04",
              "Insufficient funds",
              "ACC-9",
              "TENANT-1",
              now));
      payments.save(
          new Payment(
              "TXN-1004",
              new BigDecimal("80000"),
              "INR",
              PaymentStatus.PROCESSING,
              null,
              null,
              "ACC-9",
              "TENANT-1",
              now));

      prices.save(new MarketPrice("INFY", new BigDecimal("1450"), now));
      prices.save(new MarketPrice("TCS", new BigDecimal("3800"), now));
      prices.save(new MarketPrice("HDFC", new BigDecimal("1600"), now));
      prices.save(new MarketPrice("RELIANCE", new BigDecimal("2900"), now));

      positions.save(new Position("PORT-100", "INFY", new BigDecimal("100"), new BigDecimal("1600"), "TENANT-1"));
      positions.save(new Position("PORT-100", "TCS", new BigDecimal("50"), new BigDecimal("4000"), "TENANT-1"));
      positions.save(new Position("PORT-100", "HDFC", new BigDecimal("20"), new BigDecimal("1550"), "TENANT-1"));
      positions.save(
          new Position("PORT-100", "RELIANCE", new BigDecimal("10"), new BigDecimal("2800"), "TENANT-1"));
    };
  }
}
