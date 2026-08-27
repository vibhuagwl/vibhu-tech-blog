import java.util.ArrayList;
import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.TreeSet;

/**
 * Comparator patterns: multi-level sort, nulls, PriorityQueue, TreeSet uniqueness.
 *
 * <p>Run: javac src/*.java && java -cp src ComparatorLab
 */
public class ComparatorLab {

  static final class Employee {
    final String dept;
    final int id;
    final String name;

    Employee(String dept, int id, String name) {
      this.dept = dept;
      this.id = id;
      this.name = name;
    }

    String dept() {
      return dept;
    }

    int id() {
      return id;
    }

    String name() {
      return name;
    }

    @Override
    public String toString() {
      return dept + "/" + id + ":" + name;
    }
  }

  static void multiLevelSort() {
    System.out.println("--- Multi-level Comparator ---");
    Comparator<Employee> byDeptThenId =
        Comparator.comparing(Employee::dept).thenComparingInt(Employee::id);

    TreeSet<Employee> set = new TreeSet<>(byDeptThenId);
    set.add(new Employee("ENG", 2, "alice"));
    set.add(new Employee("ENG", 1, "bob"));
    set.add(new Employee("HR", 1, "carol"));
    System.out.println("Sorted dept then id: " + set);
  }

  static void nullsLast() {
    System.out.println("\n--- nullsLast on dept ---");
    Comparator<Employee> cmp =
        Comparator.comparing(Employee::dept, Comparator.nullsLast(String::compareTo))
            .thenComparingInt(Employee::id);

    TreeSet<Employee> set = new TreeSet<>(cmp);
    set.add(new Employee(null, 1, "no-dept"));
    set.add(new Employee("ENG", 2, "eng"));
    System.out.println("null dept sorts last: " + set);
  }

  static void priorityQueuePollVsIterate() {
    System.out.println("\n--- PriorityQueue: poll order vs iteration ---");
    PriorityQueue<Employee> pq = new PriorityQueue<>(Comparator.comparingInt(Employee::id));

    pq.add(new Employee("ENG", 30, "a"));
    pq.add(new Employee("ENG", 10, "b"));
    pq.add(new Employee("ENG", 20, "c"));

    System.out.println("Iteration (heap layout, NOT sorted): " + new ArrayList<>(pq));
    System.out.print("Poll order (min-heap by id): ");
    while (!pq.isEmpty()) {
      System.out.print(pq.poll() + " ");
    }
    System.out.println();
  }

  static void treeSetCompareZeroDuplicate() {
    System.out.println("\n--- TreeSet: compare==0 drops duplicate ---");
    Comparator<Employee> deptOnly = Comparator.comparing(Employee::dept);

    TreeSet<Employee> set = new TreeSet<>(deptOnly);
    set.add(new Employee("ENG", 1, "alice"));
    set.add(new Employee("ENG", 99, "bob"));
    System.out.println("Dept-only comparator: size=" + set.size() + " contents=" + set);
    System.out.println("Both ENG but different ids — second put replaced first (compare==0).");
  }

  public static void main(String[] args) {
    System.out.println("ComparatorLab — Java " + System.getProperty("java.version"));
    multiLevelSort();
    nullsLast();
    priorityQueuePollVsIterate();
    treeSetCompareZeroDuplicate();
  }
}
