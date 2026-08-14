package com.vibhu.msp.eip;

import java.util.ArrayList;
import java.util.List;

/** EIP Splitter — one message into many. Maps to curriculum Part 19. */
public final class Splitter {

  public <T> List<T> split(List<T> batch) {
    return new ArrayList<>(batch);
  }

  public List<String> splitCsvLine(String line) {
    return List.of(line.split(","));
  }
}
