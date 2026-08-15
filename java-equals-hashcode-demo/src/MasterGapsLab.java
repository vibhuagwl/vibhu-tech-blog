import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.WeakHashMap;

/** Senior/Lead gap demos: BigDecimal, float zeros, inheritance symmetry, WeakHashMap. */
public class MasterGapsLab {

  static class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
      if (!(o instanceof Point p)) return false;
      return x == p.x && y == p.y;
    }
    @Override public int hashCode() { return Objects.hash(x, y); }
  }

  static class ColoredPoint extends Point {
    final String color;
    ColoredPoint(int x, int y, String color) { super(x, y); this.color = color; }
    @Override public boolean equals(Object o) {
      if (!(o instanceof ColoredPoint cp)) return false;
      return super.equals(cp) && Objects.equals(color, cp.color);
    }
    @Override public int hashCode() { return Objects.hash(super.hashCode(), color); }
  }

  public static void main(String[] args) {
    System.out.println("== BigDecimal ==");
    BigDecimal a = new BigDecimal("1.0");
    BigDecimal b = new BigDecimal("1.00");
    System.out.println("equals=" + a.equals(b) + " compareTo=" + a.compareTo(b));
    Map<BigDecimal, String> hm = new HashMap<>();
    hm.put(a, "A");
    hm.put(b, "B");
    System.out.println("HashMap size=" + hm.size());
    Map<BigDecimal, String> tm = new TreeMap<>();
    tm.put(a, "A");
    tm.put(b, "B");
    System.out.println("TreeMap size=" + tm.size() + " get=" + tm.get(a));

    System.out.println("\n== Double +0.0 vs -0.0 ==");
    double aPrim = 0.0, bPrim = -0.0;
    Double p0 = aPrim;
    Double n0 = bPrim;
    System.out.println("primitive == " + (aPrim == bPrim) + " Double.equals=" + p0.equals(n0));
    System.out.println("hash +0=" + p0.hashCode() + " hash -0=" + n0.hashCode());

    System.out.println("\n== Inheritance symmetry ==");
    Point p = new Point(1, 2);
    ColoredPoint cp = new ColoredPoint(1, 2, "red");
    System.out.println("p.equals(cp)=" + p.equals(cp) + " cp.equals(p)=" + cp.equals(p));

    System.out.println("\n== WeakHashMap (illustrative) ==");
    WeakHashMap<Point, String> weak = new WeakHashMap<>();
    Point key = new Point(9, 9);
    weak.put(key, "meta");
    System.out.println("before clear strong ref size=" + weak.size());
    key = null;
    System.gc();
    System.out.println("after null+gc size=" + weak.size() + " (may still be 1 — GC timing not guaranteed)");

    System.out.println("\n== put replacement keeps first key instance ==");
    record Emp(String name) {}
    Map<Emp, String> map = new HashMap<>();
    Emp k1 = new Emp("a");
    Emp k2 = new Emp("a");
    map.put(k1, "v1");
    map.put(k2, "v2");
    Emp stored = map.keySet().iterator().next();
    System.out.println("size=" + map.size() + " value=" + map.get(new Emp("a"))
        + " storedKey==k1=" + (stored == k1) + " storedKey==k2=" + (stored == k2));
  }
}
