package com.example.designpatterns.realworld.banking;

import com.example.designpatterns.creational.abstractfactory.RegionalBankingFactoryDemo;
import com.example.designpatterns.structural.adapter.LegacyPaymentAdapterDemo;

public class BankingPatternShowcase {
  public static String europePaymentRail() {
    return new RegionalBankingFactoryDemo.EuropeBankingFactory().paymentService().pay();
  }

  public static String legacySettlement() {
    return new LegacyPaymentAdapterDemo.PaymentAdapter(
            new LegacyPaymentAdapterDemo.LegacyPaymentApi())
        .pay("acct-1", 50);
  }
}
