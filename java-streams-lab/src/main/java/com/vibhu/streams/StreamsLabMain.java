package com.vibhu.streams;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Runnable demos used by the Java Streams interview hub.
 */
public final class StreamsLabMain {

    record Employee(long id, String name, String department, double salary, LocalDate joiningDate,
                    List<String> skills) {
    }

    record OrderItem(String product, BigDecimal unitPrice, int qty) {
    }

    record Order(long id, List<OrderItem> items) {
    }

    record Customer(String name, List<Order> orders) {
    }

    public static void main(String[] args) {
        List<Employee> emps = List.of(new Employee(1,
                        "Ada",
                        "ENG",
                        180_000,
                        LocalDate.of(2018, 1, 1),
                        List.of("Java", "Kafka")),
                new Employee(2, "Grace", "ENG", 160_000, LocalDate.of(2019, 3, 1), List.of("Java")),
                new Employee(3, "Alan", "RISK", 140_000, LocalDate.of(2020, 5, 1), List.of("SQL")),
                new Employee(4, "Edsger", "ENG", 160_000, LocalDate.of(2017, 2, 1), List.of("Java", "C")),
                new Employee(5, "Barbara", "HR", 95_000, LocalDate.of(2021, 8, 1), List.of("People")));

        System.out.println("=== avg salary by department ===");
        Map<String, Double> avg = emps.stream()
                .collect(Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)));
        avg.forEach((k, v) -> System.out.println(k + " -> " + v));

        System.out.println("=== second highest DISTINCT salary ===");
        Optional<Double> second = emps.stream()
                .map(Employee::salary)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .skip(1)
                .findFirst();
        System.out.println(second.orElseThrow());

        System.out.println("=== top 3 ENG by salary ===");
        emps.stream()
                .filter(e -> "ENG".equals(e.department()))
                .sorted(Comparator.comparingDouble(Employee::salary)
                        .reversed())
                .limit(3)
                .map(Employee::name)
                .forEach(System.out::println);

        System.out.println("=== ecommerce revenue ===");
        var items = List.of(new OrderItem("UPI-Fee", new BigDecimal("10.00"), 2),
                new OrderItem("Card", new BigDecimal("5.50"), 1));
        List<Customer> customers = List.of(new Customer("Priya", List.of(new Order(1, items))));
        BigDecimal revenue = customers.stream()
                .flatMap(c -> c.orders()
                        .stream())
                .flatMap(o -> o.items()
                        .stream())
                .map(i -> i.unitPrice()
                        .multiply(BigDecimal.valueOf(i.qty())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        System.out.println(revenue);

        System.out.println("=== first non-repeated char ===");
        System.out.println(firstNonRepeated("swiss").orElse('?'));

        System.out.println("=== teeing min/max salary ===");
        var minMax = emps.stream()
                .collect(Collectors.teeing(Collectors.minBy(Comparator.comparingDouble(Employee::salary)),
                        Collectors.maxBy(Comparator.comparingDouble(Employee::salary)),
                        (min, max) -> Map.of("min",
                                min.orElseThrow()
                                        .name(),
                                "max",
                                max.orElseThrow()
                                        .name())));
        System.out.println(minMax);

        System.out.println("=== parallel sum (correct) ===");
        System.out.println(List.of(1, 2, 3, 4, 5)
                .parallelStream()
                .mapToInt(Integer::intValue)
                .sum());

        System.out.println("=== API matrix: ofNullable / takeWhile / summaryStatistics ===");
        System.out.println(java.util.stream.Stream.ofNullable(null)
                .toList());
        System.out.println(List.of(1, 2, 3, 4, 5)
                .stream()
                .takeWhile(n -> n < 4)
                .toList());
        System.out.println(java.util.stream.IntStream.rangeClosed(1, 5)
                .summaryStatistics());

        System.out.println("=== API matrix: concat / toUnmodifiableSet ===");
        System.out.println(java.util.stream.Stream.concat(java.util.stream.Stream.of("a"),
                        java.util.stream.Stream.of("b"))
                .toList());
        System.out.println(List.of("x", "x", "y")
                .stream()
                .collect(Collectors.toUnmodifiableSet()));

        System.out.println("=== Priority: group anagrams ===");
        System.out.println(groupAnagrams(List.of("eat", "tea", "tan", "ate", "nat", "bat")));

        System.out.println("=== Priority: above department average ===");
        Map<String, Double> deptAvg = emps.stream()
                .collect(Collectors.groupingBy(Employee::department, Collectors.averagingDouble(Employee::salary)));
        emps.stream()
                .filter(e -> e.salary() > deptAvg.get(e.department()))
                .map(Employee::name)
                .forEach(System.out::println);

        System.out.println("=== Priority: top 2 per department ===");
        System.out.println(topNPerDepartment(emps, 2));
    }

    static List<List<String>> groupAnagrams(List<String> words) {
        return words.stream()
                .collect(Collectors.groupingBy(w -> w.chars()
                        .sorted()
                        .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                        .toString()))
                .values()
                .stream()
                .map(List::copyOf)
                .toList();
    }

    static Map<String, List<String>> topNPerDepartment(List<Employee> emps, int n) {
        return emps.stream()
                .collect(Collectors.groupingBy(Employee::department,
                        Collectors.collectingAndThen(Collectors.toList(),
                                list -> list.stream()
                                        .sorted(Comparator.comparingDouble(Employee::salary)
                                                .reversed())
                                        .limit(n)
                                        .map(Employee::name)
                                        .toList())));
    }

    static Optional<Character> firstNonRepeated(String s) {
        return s.chars()
                .mapToObj(c -> (char) c)
                .collect(Collectors.groupingBy(c -> c, LinkedHashMap::new, Collectors.counting()))
                .entrySet()
                .stream()
                .filter(e -> e.getValue() == 1L)
                .map(Map.Entry::getKey)
                .findFirst();
    }

    private StreamsLabMain() {
    }
}
