# Java custom objects as Map keys — lab

Companion for `/java-equals-hashcode`.

```bash
javac -d out src/*.java
java -cp out EqHashMapLab
java -cp out CornerCasesLab
java -cp out MasterGapsLab
```

## Labs

| Class | Covers |
|---|---|
| `EqHashMapLab` | Seven equals×hashCode modes × HashMap / LinkedHashMap / ConcurrentHashMap / TreeMap |
| `CornerCasesLab` | Mutable key, equals vs compareTo, IdentityHashMap, LRU, CHM putIfAbsent, Integer.compare |
| `MasterGapsLab` | BigDecimal, ±0.0, inheritance symmetry, WeakHashMap, put key-instance retention |

Java 21+.
