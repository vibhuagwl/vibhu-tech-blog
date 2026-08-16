#!/usr/bin/env python3
"""Generate lib/java-streams/*.ts problem modules — interview-grade catalog."""
from __future__ import annotations
import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "lib" / "java-streams"
OUT.mkdir(parents=True, exist_ok=True)
problems: list[dict] = []

def add(**kw):
    for req in ("id","category","difficulty","title","problem","input","output","solution","pipeline","why","timeComplexity","spaceComplexity","trap","senior"):
        if req not in kw: raise SystemExit(f"missing {req} in {kw.get('id')}")
    problems.append(kw)

def emit(name: str, const: str, items: list[dict]):
    body=[]
    for p in items:
        lines=[]
        for k,v in p.items():
            if v is None: continue
            lines.append(f"    {k}: {json.dumps(v)},")
        body.append("  {\n" + "\n".join(lines) + "\n  }")
    (OUT/f"{name}.ts").write_text(
        "import type {StreamProblem} from './types';\n\n"
        f"export const {const}: StreamProblem[] = [\n" + ",\n".join(body) + ",\n];\n"
    )

def rows(category, items):
    for row in items:
        d={
            "id":row[0],"category":category,"difficulty":row[1],"title":row[2],"problem":row[3],
            "input":row[4],"output":row[5],"solution":row[6],"pipeline":row[7],"why":row[8],
            "timeComplexity":row[9],"spaceComplexity":row[10],"trap":row[11],"senior":row[12],
            "tags":[category],
        }
        if len(row)>13 and row[13]:
            d["alternative"]=row[13]
        if len(row)>14 and row[14]:
            d["javaSince"]=row[14]
        add(**d)

# === FUNDAMENTALS ===
rows("fundamentals",[
("f01","Beginner","Stream from List","Create a Stream from a List and print each element.",
 'List.of("java","spring","kafka")',"java / spring / kafka",
 'List.of("java","spring","kafka").stream().forEach(System.out::println);',
 "List → stream → forEach","Canonical collection source.","O(n)","O(1)",
 "Reusing Stream after terminal op.","Prefer forEach for pure side effects; Streams for composition.",None,"Java 8"),
("f02","Beginner","Stream from Set","Stream departments and sort for stable output.",
 'Set.copyOf(List.of("ENG","HR","ENG"))',"[ENG, HR]",
 'Set.copyOf(List.of("ENG","HR","ENG")).stream().sorted().toList();',
 "Set → stream → sorted → toList","Set unique; sorted for display.","O(n log n)","O(n)",
 "Assuming HashSet order.","Document ordering contracts.",None,"Java 8/16"),
("f03","Beginner","Stream Map entries","Print map entries as key=value.",
 'Map.of("a",1,"b",2)',"a=1, b=2 (unordered)",
 'Map.of("a",1,"b",2).entrySet().stream().forEach(e -> System.out.println(e.getKey()+"="+e.getValue()));',
 "entrySet → stream → forEach","Maps aren't Stream sources.","O(n)","O(1)",
 "map.stream() won't compile.","LinkedHashMap if order matters.",None,"Java 8"),
("f04","Beginner","Stream object array","Join String[] with commas.",
 '["u","p","i"]',"u,p,i",
 'Arrays.stream(new String[]{"u","p","i"}).collect(Collectors.joining(","));',
 "Arrays.stream → joining","Arrays.stream for arrays.","O(n)","O(n)",
 "Stream.of(Object[]) pitfall.","Know Stream.of vs Arrays.stream.",None,"Java 8"),
("f05","Intermediate","Primitive IntStream sum","Sum int[] without boxing.",
 "[1,2,3,4]","10",
 "int sum = Arrays.stream(new int[]{1,2,3,4}).sum();",
 "int[] → IntStream → sum","Avoid boxing.","O(n)","O(1)",
 "Stream<Integer> on large arrays.","Primitives matter at 10M+.",None,"Java 8"),
("f06","Intermediate","String chars vowels","Count vowels with chars().",
 '"Meridian"',"4",
 'long v="Meridian".toLowerCase().chars().filter(c->"aeiou".indexOf(c)>=0).count();',
 "chars → filter → count","IntStream of UTF-16 units.","O(n)","O(1)",
 "chars() vs codePoints() for emoji.","Prefer codePoints for Unicode.",None,"Java 8"),
("f07","Intermediate","Stream.generate random","Generate 5 random doubles safely.",
 "n=5","5 doubles",
 "Stream.generate(Math::random).limit(5).toList();",
 "generate → limit → toList","Bound infinite sources.","O(k)","O(k)",
 "collect without limit hangs.","RandomGenerator (17+) for tests.",None,"Java 8"),
("f08","Intermediate","iterate evens","First 10 even numbers from 0.",
 "seed=0","[0,2,4,6,8,10,12,14,16,18]",
 "Stream.iterate(0,n->n+2).limit(10).toList();",
 "iterate → limit → toList","Lazy arithmetic sequence.","O(k)","O(k)",
 "Miss Java 9 predicate iterate.","iterate(seed,hasNext,next) Java 9.",None,"Java 8/9"),
("f09","Advanced","Fibonacci iterate pairs","First 10 Fibonacci numbers.",
 "n=10","[0,1,1,2,3,5,8,13,21,34]",
 "Stream.iterate(new long[]{0,1},p->new long[]{p[1],p[0]+p[1]}).limit(10).map(p->p[0]).toList();",
 "iterate(pair) → map → limit","State in pairs.","O(k)","O(k)",
 "Parallelizing iterate.","Keep sequential; BigInteger for large n.",None,"Java 8"),
("f10","Intermediate","Limit infinite safely","Take first 3 naturals.",
 "iterate(1,i->i+1)","[1,2,3]",
 "Stream.iterate(1,i->i+1).limit(3).toList();",
 "iterate → limit → toList","Guard infinite sources.","O(k)","O(k)",
 "Terminal on infinite stream.","Enforce limit/takeWhile in libraries.",None,"Java 8"),
("f11","Intermediate","Box and unbox","IntStream → List → mapToInt sum.",
 "1..5","15",
 "IntStream.rangeClosed(1,5).boxed().toList().stream().mapToInt(Integer::intValue).sum();",
 "boxed → mapToInt → sum","Unbox for math.","O(n)","O(n)",
 "map(Integer::intValue) still boxes stream.","Repeated boxing is silent tax.",None,"Java 8"),
("f12","Beginner","Stream.of","Count explicit values.",
 "NEFT,RTGS,UPI","3",
 'long n=Stream.of("NEFT","RTGS","UPI").count();',
 "Stream.of → count","Ad-hoc streams.","O(n)","O(1)",
 "of(null) pitfalls.","ofNullable Java 9.",None,"Java 8/9"),
("f13","Advanced","parallel sum range","Parallel sum 1..1e6.",
 "1..1000000","500000500000",
 "long sum=LongStream.rangeClosed(1,1_000_000).parallel().sum();",
 "range → parallel → sum","Associative reduction.","O(n/p)","O(1)",
 "parallel on tiny/IO.","commonPool; never block IO.",None,"Java 8"),
("f14","Advanced","Files.lines","Count non-blank lines with try-with-resources.",
 "payments.csv","N",
 'try(Stream<String> s=Files.lines(Path.of("payments.csv"))){ long n=s.filter(l->!l.isBlank()).count(); }',
 "Files.lines → filter → count","Must close.","O(lines)","O(1)",
 "Leaking file descriptors.","Always try-with-resources.",None,"Java 8"),
])

# Continue in same file - FILTER through many categories
# I'll append more via a second write for maintainability of this shell heredoc size

print("partA", len(problems))
Path("/tmp/js_problems.json").write_text(json.dumps(problems))
# Don't emit yet - more parts will merge
