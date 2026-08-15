package com.example.designpatterns.realworld.notification;

import com.example.designpatterns.structural.bridge.NotificationBridgeDemo;

public class NotificationPatternShowcase {
  public static String sendSms() {
    return new NotificationBridgeDemo.SmsNotification(new NotificationBridgeDemo.TwilioProvider())
        .send("OTP");
  }
}
