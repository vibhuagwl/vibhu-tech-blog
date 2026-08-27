import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;
import java.util.TreeSet;

/**
 * Runnable predict-the-output snippets for interview drills.
 *
 * <p>Run: javac src/*.java && java -cp src PredictOutputLab
 */
public class PredictOutputLab {

  static void predict1_treeSetSize() {
    TreeSet<String> set = new TreeSet<>();
    set.add("B");
    set.add("A");
    set.add("A");
    System.out.println("P1 TreeSet add B,A,A → size=" + set.size() + " first=" + set.first());
  }

  static void predict2_subtractionOverflow() {
    int a = Integer.MIN_VALUE;
    int b = Integer.MAX_VALUE;
    System.out.println("P2 (MIN - MAX) sign: " + ((a - b) > 0 ? "positive" : "non-positive"));
  }

  static void predict3_bigDecimalSets() {
    BigDecimal x = new BigDecimal("1.0");
    BigDecimal y = new BigDecimal("1.00");
    TreeSet<BigDecimal> tree = new TreeSet<>();
    tree.add(x);
    tree.add(y);
    System.out.println("P3 TreeSet 1.0 + 1.00 → size=" + tree.size());
  }

  static void predict4_priorityQueuePeek() {
    PriorityQueue<Integer> pq = new PriorityQueue<>();
    pq.add(5);
    pq.add(1);
    pq.add(3);
    System.out.println("P4 PQ peek after add 5,1,3 → " + pq.peek());
    System.out.println("P4 PQ iteration (unsorted): " + new ArrayList<>(pq));
  }

  static void predict5_stableSort() {
    List<String> items = new ArrayList<>(List.of("a-2", "b-1", "a-1"));
    Collections.sort(items, Comparator.comparing(s -> s.charAt(0)));
    System.out.println("P5 stable sort by first char: " + items);
  }

  static void predict6_reversedComparator() {
    Comparator<Integer> asc = Comparator.naturalOrder();
    Comparator<Integer> desc = asc.reversed();
    TreeSet<Integer> set = new TreeSet<>(desc);
    set.add(1);
    set.add(3);
    set.add(2);
    System.out.println("P6 TreeSet reversed natural: " + set);
  }

  public static void main(String[] args) {
    System.out.println("PredictOutputLab — Java " + System.getProperty("java.version") + "\n");
    predict1_treeSetSize();
    predict2_subtractionOverflow();
    predict3_bigDecimalSets();
    predict4_priorityQueuePeek();
    predict5_stableSort();
    predict6_reversedComparator();
  }
}
