package com.vibhu.msp.lb;

import java.util.List;

public interface LoadBalancer<T> {
    T select(List<T> candidates);
}
