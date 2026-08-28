# Java custom objects as Map keys — lab

Companion for `/java-equals-hashcode`.

```bash
mvn -q compile
mvn -q exec:java -Dexec.mainClass=EqHashMapLab
mvn -q exec:java -Dexec.mainClass=CornerCasesLab
mvn -q exec:java -Dexec.mainClass=MasterGapsLab
```

## Labs

| Class | Covers |
|---|---|
| `EqHashMapLab` | Seven equals×hashCode modes × HashMap / LinkedHashMap / ConcurrentHashMap / TreeMap |
| `CornerCasesLab` | Mutable key, equals vs compareTo, IdentityHashMap, LRU, CHM putIfAbsent, Integer.compare |
| `MasterGapsLab` | BigDecimal, ±0.0, inheritance symmetry, WeakHashMap, put key-instance retention |

Java 21+.
