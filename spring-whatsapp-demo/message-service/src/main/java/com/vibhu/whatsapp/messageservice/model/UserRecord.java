package com.vibhu.whatsapp.messageservice.model;

import com.vibhu.whatsapp.common.dto.UserView;

public record UserRecord(String userId, String displayName, String phone) {
  public UserView toView() {
    return new UserView(userId, displayName, phone);
  }
}
