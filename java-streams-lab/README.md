# Java Streams Lab

Interview-focused demos for the `/java-streams` hub.

```bash
mvn -q test
mvn -q exec:java -Dexec.mainClass=com.vibhu.streams.StreamsLabMain
mvn -q exec:java -Dexec.mainClass=com.vibhu.streams.GroupingByInterviewGuide
```

Covers: grouping/averaging, nth distinct salary, flatMap revenue, first non-repeated char,
parallel sum vs racy forEach, teeing min/max.

`GroupingByInterviewGuide` is the full `Collectors.groupingBy` interview study class (overloads,
downstream collectors, nested grouping, concurrent/parallel, 20 coding problems, cheat sheet).
