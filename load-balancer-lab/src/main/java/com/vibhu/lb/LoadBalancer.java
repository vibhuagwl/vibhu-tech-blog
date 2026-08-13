package com.vibhu.lb;

import java.util.List;

public interface LoadBalancer {
  Server select(List<Server> servers);
}
