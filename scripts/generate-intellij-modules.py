#!/usr/bin/env python3
"""Regenerate shared IntelliJ *.iml + .idea/modules.xml for every Maven leaf module.

Run from repo root after adding/removing a Maven lab:
  python3 scripts/generate-intellij-modules.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def artifact_id(pom_text: str, fallback: str) -> str:
    text = re.sub(r"<parent>.*?</parent>", "", pom_text, flags=re.S)
    m = re.search(r"<artifactId>\s*([^<]+)\s*</artifactId>", text)
    return m.group(1).strip() if m else fallback


def packaging(pom_text: str) -> str:
    m = re.search(r"<packaging>\s*([^<]+)\s*</packaging>", pom_text)
    return m.group(1).strip() if m else "jar"


def iml_content(has_main: bool, has_test: bool, has_res: bool, has_tres: bool) -> str:
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<module type="JAVA_MODULE" version="4">',
        '  <component name="NewModuleRootManager" inherit-compiler-output="true">',
        "    <exclude-output />",
        '    <content url="file://$MODULE_DIR$">',
    ]
    if has_main:
        lines.append(
            '      <sourceFolder url="file://$MODULE_DIR$/src/main/java" isTestSource="false" />'
        )
    if has_res:
        lines.append(
            '      <sourceFolder url="file://$MODULE_DIR$/src/main/resources" type="java-resource" />'
        )
    if has_test:
        lines.append(
            '      <sourceFolder url="file://$MODULE_DIR$/src/test/java" isTestSource="true" />'
        )
    if has_tres:
        lines.append(
            '      <sourceFolder url="file://$MODULE_DIR$/src/test/resources" type="java-test-resource" />'
        )
    lines += [
        '      <excludeFolder url="file://$MODULE_DIR$/target" />',
        "    </content>",
        '    <orderEntry type="inheritedJdk" />',
        '    <orderEntry type="sourceFolder" forTests="false" />',
        "  </component>",
        "</module>",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    modules: list[tuple[str, str, bool, bool, bool, bool]] = []
    for pom in sorted(ROOT.rglob("pom.xml")):
        rel = pom.relative_to(ROOT)
        s = str(rel)
        if any(x in s for x in [".git", "node_modules", "target"]):
            continue
        if s == "pom.xml":
            continue
        text = pom.read_text(errors="ignore")
        pkg = packaging(text)
        d = pom.parent
        aid = artifact_id(text, d.name)
        main_java = d / "src/main/java"
        test_java = d / "src/test/java"
        res = d / "src/main/resources"
        tres = d / "src/test/resources"
        has_main = main_java.is_dir() and any(main_java.rglob("*.java"))
        has_test = test_java.is_dir() and any(test_java.rglob("*.java"))
        has_res = res.is_dir() and any(res.iterdir())
        has_tres = tres.is_dir() and any(tres.iterdir())
        if pkg == "pom" and not has_main and not has_test:
            continue
        if not has_main and not has_test and not has_res and not has_tres:
            continue
        modules.append(
            (d.relative_to(ROOT).as_posix(), aid, has_main, has_test, has_res, has_tres)
        )

    idea = ROOT / ".idea"
    idea.mkdir(exist_ok=True)

    mod_xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<project version="4">',
        '  <component name="ProjectModuleManager">',
        "    <modules>",
    ]
    for rel, aid, *flags in modules:
        iml_rel = f"{rel}/{aid}.iml"
        (ROOT / iml_rel).write_text(iml_content(*flags))
        mod_xml.append(
            f'      <module fileurl="file://$PROJECT_DIR$/{iml_rel}" filepath="$PROJECT_DIR$/{iml_rel}" />'
        )
    mod_xml += ["    </modules>", "  </component>", "</project>", ""]
    (idea / "modules.xml").write_text("\n".join(mod_xml))

    (idea / "misc.xml").write_text(
        """<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ExternalStorageConfigurationManager" enabled="true" />
  <component name="MavenProjectsManager">
    <option name="originalFiles">
      <list>
        <option value="$PROJECT_DIR$/pom.xml" />
      </list>
    </option>
  </component>
  <component name="ProjectRootManager" version="2" languageLevel="JDK_21" default="true" project-jdk-name="21" project-jdk-type="JavaSDK" />
</project>
"""
    )
    (idea / "compiler.xml").write_text(
        """<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="CompilerConfiguration">
    <bytecodeTargetLevel target="21" />
  </component>
</project>
"""
    )
    print(f"Wrote {len(modules)} IntelliJ modules")


if __name__ == "__main__":
    main()
