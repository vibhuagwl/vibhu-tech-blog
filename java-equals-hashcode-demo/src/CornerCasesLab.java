import java.util.Comparator;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;

/** Corner cases: mutable keys, equals vs compareTo, IdentityHashMap, LRU. */
public class CornerCasesLab {

  static class MutableEmp {
    String name;
    MutableEmp(String name) { this.name = name; }
    @Override public boolean equals(Object o) {
      return o instanceof MutableEmp e && Objects.equals(name, e.name);
    }
    @Override public int hashCode() { return Objects.hashCode(name); }
    @Override public String toString() { return "M[" + name + "]"; }
  }

  static class BadKey implements Comparable<BadKey> {
    final int id;
    final String tag;
    BadKey(int id, String tag) { this.id = id; this.tag = tag; }
    @Override public boolean equals(Object o) {
      return o instanceof BadKey b && id == b.id && Objects.equals(tag, b.tag);
    }
    @Override public int hashCode() { return Objects.hash(id, tag); }
    @Override public int compareTo(BadKey o) { return Integer.compare(id, o.id); }
    @Override public String toString() { return "Bad[" + id + "," + tag + "]"; }
  }

  public static void main(String[] args) {
    System.out.println("== Mutable key ==");
    Map<MutableEmp, String> hm = new HashMap<>();
    MutableEmp k = new MutableEmp("a");
    hm.put(k, "v");
    k.name = "b";
    System.out.println("get after mutate=" + hm.get(k) + " get(a)=" + hm.get(new MutableEmp("a")) + " size=" + hm.size());

    System.out.println("\n== equals false, compareTo 0 ==");
    BadKey a = new BadKey(1, "x");
    BadKey b = new BadKey(1, "y");
    System.out.println("equals=" + a.equals(b) + " compareTo=" + a.compareTo(b));
    Map<BadKey, String> hash = new HashMap<>();
    hash.put(a, "A");
    hash.put(b, "B");
    System.out.println("HashMap size=" + hash.size());
    Map<BadKey, String> tree = new TreeMap<>();
    tree.put(a, "A");
    tree.put(b, "B");
    System.out.println("TreeMap size=" + tree.size() + " value=" + tree.get(a));

    System.out.println("\n== IdentityHashMap ==");
    record Emp(String name) {}
    IdentityHashMap<Emp, String> id = new IdentityHashMap<>();
    Emp e1 = new Emp("a");
    Emp e2 = new Emp("a");
    id.put(e1, "1");
    id.put(e2, "2");
    System.out.println("equals=" + e1.equals(e2) + " IdentityHashMap size=" + id.size());

    System.out.println("\n== LRU LinkedHashMap ==");
    LinkedHashMap<String, String> lru = new LinkedHashMap<>(16, 0.75f, true) {
      @Override
      protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
        return size() > 3;
      }
    };
    lru.put("a", "1");
    lru.put("b", "2");
    lru.put("c", "3");
    lru.get("a");
    lru.put("d", "4");
    System.out.println("LRU keys=" + lru.keySet());

    System.out.println("\n== CHM putIfAbsent ==");
    ConcurrentHashMap<Emp, String> chm = new ConcurrentHashMap<>();
    chm.putIfAbsent(new Emp("a"), "v1");
    chm.putIfAbsent(new Emp("a"), "v2");
    System.out.println("CHM get=" + chm.get(new Emp("a")));

    System.out.println("\n== Comparator overflow-safe ==");
    Comparator<Integer> safe = Integer::compare;
    System.out.println("compare MIN,MAX=" + safe.compare(Integer.MIN_VALUE, Integer.MAX_VALUE));
  }
}
