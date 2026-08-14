import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Equals × hashCode combinations across HashMap, LinkedHashMap,
 * ConcurrentHashMap, and TreeMap.
 *
 * Experiment per map: put(a), put(b), put(a), get(new a).
 *
 * Run:
 *   javac -d out src/EqHashMapLab.java && java -cp out EqHashMapLab
 */
public class EqHashMapLab {

  enum Mode {
    NONE,
    BOTH,
    HC1_EQ_TRUE,
    HC1_NO_EQ,
    NO_HC_EQ_TRUE,
    HC_OK_NO_EQ,
    NO_HC_EQ_OK
  }

  static class Employee {
    final String name;
    final Mode mode;

    Employee(String name, Mode mode) {
      this.name = name;
      this.mode = mode;
    }

    @Override
    public int hashCode() {
      return switch (mode) {
        case NONE, NO_HC_EQ_TRUE, NO_HC_EQ_OK -> System.identityHashCode(this);
        case BOTH, HC_OK_NO_EQ -> Objects.hashCode(name);
        case HC1_EQ_TRUE, HC1_NO_EQ -> 1;
      };
    }

    @Override
    public boolean equals(Object o) {
      return switch (mode) {
        case NONE, HC1_NO_EQ, HC_OK_NO_EQ -> this == o;
        case BOTH, NO_HC_EQ_OK -> {
          if (this == o) yield true;
          if (!(o instanceof Employee e)) yield false;
          yield Objects.equals(name, e.name);
        }
        case HC1_EQ_TRUE, NO_HC_EQ_TRUE -> true;
      };
    }

    @Override
    public String toString() {
      return "Employee[" + name + "]";
    }
  }

  static void experiment(String label, Map<Employee, String> map, Mode mode) {
    map.put(new Employee("a", mode), "emp1");
    map.put(new Employee("b", mode), "emp2");
    map.put(new Employee("a", mode), "emp1 OVERRIDDEN");
    String got = map.get(new Employee("a", mode));
    System.out.printf("%-18s %-14s size=%d get=%s%n", label, mode, map.size(), got);
  }

  public static void main(String[] args) {
    System.out.println("Verified equals/hashCode combos (Java " + System.getProperty("java.version") + ")");
    System.out.println("put(a), put(b), put(a), get(new a)\n");

    for (Mode mode : Mode.values()) {
      experiment("HashMap", new HashMap<>(), mode);
      experiment("LinkedHashMap", new LinkedHashMap<>(), mode);
      experiment("ConcurrentHashMap", new ConcurrentHashMap<>(), mode);
      // TreeMap: order by name — demonstrates hashCode is irrelevant for placement
      experiment(
          "TreeMap",
          new TreeMap<>(Comparator.comparing((Employee e) -> e.name)),
          mode);
      System.out.println();
    }

    System.out.println("Notes:");
    System.out.println("- HashMap / LinkedHashMap / ConcurrentHashMap share equals+hashCode rules.");
    System.out.println("- TreeMap uses Comparator/Comparable; broken equals/hashCode still size=2 here.");
    System.out.println("- ConcurrentHashMap rejects null keys (NPE).");
  }
}
