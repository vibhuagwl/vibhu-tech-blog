# Java Comparable / Comparator — lab

Companion for `/java-comparable-comparator`.

```bash
mvn -q compile
mvn -q exec:java -Dexec.mainClass=ComparableLab
mvn -q exec:java -Dexec.mainClass=ComparatorLab
mvn -q exec:java -Dexec.mainClass=PredictOutputLab
```

## Labs

| Class | Covers |
|---|---|
| `ComparableLab` | Employee `Comparable`, `Integer.compare`, subtraction overflow, BigDecimal `TreeSet` vs `HashSet` |
| `ComparatorLab` | Multi-level `Comparator`, `nullsLast`, `PriorityQueue` poll vs iterate, `TreeSet` `compare==0` duplicates |
| `PredictOutputLab` | Runnable predict-the-output snippets |

Java 21+.
