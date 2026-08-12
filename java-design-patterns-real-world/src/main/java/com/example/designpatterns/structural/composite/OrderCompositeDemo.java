package com.example.designpatterns.structural.composite;

import java.util.ArrayList;
import java.util.List;

public class OrderCompositeDemo {
    public interface OrderComponent { int total(); }
    public record Product(String sku, int price) implements OrderComponent { public int total(){ return price; } }
    public static final class Bundle implements OrderComponent {
        private final List<OrderComponent> children = new ArrayList<>();
        public Bundle add(OrderComponent component){ children.add(component); return this; }
        public int total(){ return children.stream().mapToInt(OrderComponent::total).sum(); }
    }
}
