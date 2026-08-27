# IDE setup — Java labs (fixelliJ / Cursor / VS Code)

## Why you see “Java file is located outside of the module source root”

This repo is a **Next.js content site** plus many **standalone Spring/Maven labs**. If the IDE opens only the folder tree and does not import Maven, every `src/main/java/**/*.java` file is treated as plain text — not on a module source root — so nothing compiles and the yellow banner appears on every Java file.

## Fix in IntelliJ IDEA (recommended)

1. **File → Close Project** (if already open as a plain directory).
2. **File → Open…** and select the repo root **`pom.xml`** (not only the folder), then **Open as Project**.
3. Trust the project; wait for Maven import to finish (status bar).
4. **File → Project Structure → Project SDK** → **JDK 21**.
5. **View → Tool Windows → Maven** → click **Reload All Maven Projects** if modules look incomplete.

You can also keep the folder open and use **Maven tool window → + →** add the root `pom.xml` (or each lab’s `pom.xml`).

### Optional: work on one lab only

**File → Open…** → choose a single lab folder (e.g. `spring-cache-lab/` or its `pom.xml`). That lab imports cleanly without loading every sibling project.

## Fix in Cursor / VS Code

1. Install the **Extension Pack for Java** (and Maven).
2. Open the **repo root** (this workspace already enables `java.import.maven.enabled` and imports `**/pom.xml`).
3. Command Palette → **Java: Clean Java Language Server Workspace** → reload when prompted.
4. Wait for “Importing Maven projects…” to finish.

Do **not** exclude lab folders under `java.import.exclusions` (only `node_modules`, `target`, `.next`, `out`, `frontend`).

## Build from the terminal

Root `pom.xml` is an **aggregator only** (does not unify Spring Boot parents). Prefer building inside a lab:

```bash
cd spring-ai-payment-investigator   # or any other lab
./mvnw -DskipTests package          # or mvn if no wrapper
```

Validate the aggregator listing:

```bash
mvn -N validate
```
