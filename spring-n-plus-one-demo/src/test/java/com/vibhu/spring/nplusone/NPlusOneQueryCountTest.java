package com.vibhu.spring.nplusone;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.spring.nplusone.config.QueryCountInspector;
import com.vibhu.spring.nplusone.web.AuthorController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class NPlusOneQueryCountTest {
  @Autowired AuthorController controller;

  @BeforeEach
  void reset() {
    QueryCountInspector.reset();
  }

  @Test
  void badPathIsOnePlusN() {
    // 3 authors seeded → expect 1 authors select + 3 books selects (>= 4)
    controller.bad();
    assertThat(QueryCountInspector.count()).isGreaterThanOrEqualTo(4);
  }

  @Test
  void joinFetchIsSingleDigitOneOrTwoQueries() {
    QueryCountInspector.reset();
    controller.joinFetch();
    // distinct join fetch is typically 1 select (sometimes +1 for tx)
    assertThat(QueryCountInspector.count()).isLessThanOrEqualTo(2);
  }

  @Test
  void entityGraphIsSingleDigitOneOrTwoQueries() {
    QueryCountInspector.reset();
    controller.entityGraph();
    assertThat(QueryCountInspector.count()).isLessThanOrEqualTo(2);
  }

  @Test
  void batchPathFarFewerThanOnePlusN() {
    QueryCountInspector.reset();
    controller.batch();
    // 1 authors + 1 batched books IN (...)  (allow small overhead)
    assertThat(QueryCountInspector.count()).isLessThanOrEqualTo(3);
  }
}
