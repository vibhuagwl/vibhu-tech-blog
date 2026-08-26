package com.vibhu.sapi.orchestrator.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

/**
 * Loads {@code skills/payment-investigation/SKILL.md} plus {@code tools/*.md} from the classpath
 * (copied from the repo {@code skills/} folder at build time).
 *
 * <p>Used as the ChatClient standing system prompt and prepended on every
 * {@code AiExecutionHarness} model call.
 */
@Component
public class InvestigationSkillService {

  private static final Logger log = LoggerFactory.getLogger(InvestigationSkillService.class);

  private final String systemPrompt;
  private final int toolDocCount;

  public InvestigationSkillService(SkillProperties properties) {
    if (!properties.enabled()) {
      this.systemPrompt = "";
      this.toolDocCount = 0;
      log.info("Investigation skill loading disabled");
      return;
    }
    LoadedSkill loaded = load(properties);
    this.systemPrompt = loaded.prompt();
    this.toolDocCount = loaded.toolDocs();
    log.info(
        "Loaded investigation skill from {} ({} tool docs, {} chars)",
        properties.location(),
        toolDocCount,
        systemPrompt.length());
  }

  public String systemPrompt() {
    return systemPrompt;
  }

  public int toolDocCount() {
    return toolDocCount;
  }

  private static LoadedSkill load(SkillProperties properties) {
    PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
    String base = trimSlash(properties.location());
    try {
      Resource skillMd = resolver.getResource(base + "/SKILL.md");
      if (!skillMd.exists() || !skillMd.isReadable()) {
        return missing(properties, "SKILL.md not found at " + base + "/SKILL.md");
      }
      StringBuilder prompt = new StringBuilder(read(skillMd).strip());
      Resource[] toolDocs = resolver.getResources(base + "/tools/*.md");
      Arrays.sort(toolDocs, Comparator.comparing(InvestigationSkillService::resourceName));
      List<String> loadedTools = new ArrayList<>();
      for (Resource toolDoc : toolDocs) {
        if (!toolDoc.exists() || !toolDoc.isReadable()) {
          continue;
        }
        prompt.append("\n\n---\n").append(read(toolDoc).strip());
        loadedTools.add(resourceName(toolDoc));
      }
      if (loadedTools.isEmpty()) {
        return missing(properties, "No tool docs found at " + base + "/tools/*.md");
      }
      return new LoadedSkill(prompt.toString(), loadedTools.size());
    } catch (IOException ex) {
      return missing(properties, "Failed to load skills: " + ex.getMessage());
    }
  }

  private static LoadedSkill missing(SkillProperties properties, String message) {
    if (properties.failOnMissing()) {
      throw new IllegalStateException(message);
    }
    log.warn(message);
    return new LoadedSkill("", 0);
  }

  private static String read(Resource resource) throws IOException {
    try (InputStream in = resource.getInputStream()) {
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  private static String resourceName(Resource resource) {
    return resource.getFilename() == null ? resource.getDescription() : resource.getFilename();
  }

  private static String trimSlash(String location) {
    if (location.endsWith("/")) {
      return location.substring(0, location.length() - 1);
    }
    return location;
  }

  private record LoadedSkill(String prompt, int toolDocs) {}
}
