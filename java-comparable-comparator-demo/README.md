# Java Comparable / Comparator — lab

Companion for `/java-comparable-comparator`.

```bash
javac src/*.java
java -cp src ComparableLab
java -cp src ComparatorLab
java -cp src PredictOutputLab
```

Or compile to `out/`:

```bash
javac -d out src/*.java
java -cp out ComparableLab
```

## Labs

| Class | Covers |
|---|---|
| `ComparableLab` | Employee `Comparable`, `Integer.compare`, subtraction overflow, BigDecimal `TreeSet` vs `HashSet` |
| `ComparatorLab` | Multi-level `Comparator`, `nullsLast`, `PriorityQueue` poll vs iterate, `TreeSet` `compare==0` duplicates |
| `PredictOutputLab` | Runnable predict-the-output snippets |

Java 8+ (tested on Java 21).
