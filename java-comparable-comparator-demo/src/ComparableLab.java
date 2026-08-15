import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

/**
 * Comparable fundamentals: natural order, Integer.compare, overflow trap, BigDecimal.
 *
 * Run: javac src/*.java && java -cp src ComparableLab
 */
public class ComparableLab {

  static final class Employee implements Comparable<Employee> {
    final int id;
    final String name;

    Employee(int id, String name) {
      this.id = id;
      this.name = name;
    }

    @Override
    public int compareTo(Employee other) {
      return Integer.compare(id, other.id);
    }

    @Override
    public boolean equals(Object o) {
      return o instanceof Employee e && id == e.id;
    }

    @Override
    public int hashCode() {
      return Integer.hashCode(id);
    }

    @Override
    public String toString() {
      return "Employee{id=" + id + ", name=" + name + "}";
    }
  }

  /** Classic overflow trap: subtraction flips sign near Integer extremes. */
  static final class BadEmployee implements Comparable<BadEmployee> {
    final int id;

    BadEmployee(int id) {
      this.id = id;
    }

    @Override
    public int compareTo(BadEmployee other) {
      return this.id - other.id;
    }

    @Override
    public String toString() {
      return "BadEmployee{id=" + id + "}";
    }
  }

  static void naturalOrderDemo() {
    System.out.println("--- Natural order (Comparable) ---");
    TreeSet<Employee> set = new TreeSet<>();
    set.add(new Employee(3, "alice"));
    set.add(new Employee(1, "bob"));
    set.add(new Employee(2, "carol"));
    System.out.println("TreeSet iteration (sorted by id): " + set);
    System.out.println("first=" + set.first() + " last=" + set.last());
  }

  static void overflowDemo() {
    System.out.println("\n--- Subtraction overflow trap ---");
    BadEmployee low = new BadEmployee(Integer.MIN_VALUE);
    BadEmployee high = new BadEmployee(Integer.MAX_VALUE);
    int bad = low.compareTo(high);
    int good = Integer.compare(low.id, high.id);
    System.out.println("(MIN_VALUE - MAX_VALUE) as compare result: " + bad + " (positive — wrong!)");
    System.out.println("Integer.compare(MIN, MAX): " + good + " (negative — correct)");
  }

  static void bigDecimalTrap() {
    System.out.println("\n--- BigDecimal: equals vs compareTo ---");
    BigDecimal a = new BigDecimal("1.0");
    BigDecimal b = new BigDecimal("1.00");
    System.out.println("a.equals(b): " + a.equals(b));
    System.out.println("a.compareTo(b): " + a.compareTo(b));

    Set<BigDecimal> hash = new HashSet<>();
    hash.add(a);
    hash.add(b);
    System.out.println("HashSet size (equals distinguishes scale): " + hash.size());

    Set<BigDecimal> tree = new TreeSet<>();
    tree.add(a);
    tree.add(b);
    System.out.println("TreeSet size (compareTo==0 collapses): " + tree.size());
  }

  public static void main(String[] args) {
    System.out.println("ComparableLab — Java " + System.getProperty("java.version"));
    naturalOrderDemo();
    overflowDemo();
    bigDecimalTrap();
  }
}
