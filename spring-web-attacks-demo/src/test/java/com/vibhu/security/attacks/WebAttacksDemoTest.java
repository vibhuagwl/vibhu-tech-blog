package com.vibhu.security.attacks;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class WebAttacksDemoTest {
  @Autowired MockMvc mvc;

  @Test
  void xssGoodEscapesScript() throws Exception {
    MvcResult result =
        mvc.perform(get("/xss/good").param("name", "<script>alert(1)</script>"))
            .andExpect(status().isOk())
            .andReturn();
    String html = result.getResponse().getContentAsString();
    assertThat(html).contains("&lt;script&gt;");
    assertThat(html).doesNotContain("<script>alert(1)</script>");
  }

  @Test
  void xssApiGoodEscapes() throws Exception {
    MvcResult result =
        mvc.perform(get("/xss/api/good").param("name", "<img onerror=alert(1)>"))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(result.getResponse().getContentAsString()).contains("&lt;img");
  }

  @Test
  void sqliBadOrBypassReturnsAllRows() throws Exception {
    MvcResult result =
        mvc.perform(get("/sqli/bad").param("q", "electronics' OR '1'='1"))
            .andExpect(status().isOk())
            .andReturn();
    String body = result.getResponse().getContentAsString();
    assertThat(body).contains("Keyboard");
    assertThat(body).contains("Desk"); // furniture leaked via injection
  }

  @Test
  void sqliGoodRejectsInjectionAsLiteral() throws Exception {
    MvcResult result =
        mvc.perform(get("/sqli/good").param("q", "electronics' OR '1'='1"))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(result.getResponse().getContentAsString()).isEqualTo("[]");
  }

  @Test
  void rateLimitReturns429() throws Exception {
    for (int i = 0; i < 20; i++) {
      mvc.perform(get("/ddos/ping")).andExpect(status().isOk());
    }
    mvc.perform(get("/ddos/ping")).andExpect(status().isTooManyRequests());
  }
}
