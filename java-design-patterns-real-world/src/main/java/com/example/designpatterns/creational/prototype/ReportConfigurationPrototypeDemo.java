package com.example.designpatterns.creational.prototype;

import java.util.HashMap;
import java.util.Map;

/**
 * PATTERN: Prototype
 *
 * <p>WHEN TO IMPLEMENT - Creating from scratch is expensive or error-prone, and you need many
 * similar instances with small deltas. - You clone a template (report config, fee schedule) then
 * tweak per use case.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Prefer an explicit {@code copy()} / {@code cloneConfig()} API
 * over Object.clone() (fragile, checked Cloneable). 2. Decide shallow vs deep copy deliberately —
 * nested mutable maps/lists must be deep-copied if callers mutate them. 3. Keep prototypes
 * registered in a catalog/map keyed by template id. 4. After copy, mutate only the clone; never
 * mutate the shared prototype in place. 5. Document which fields are identity vs configuration so
 * copies do not leak shared mutable state.
 *
 * <p>DO NOT USE WHEN - Construction is cheap and a Builder/factory with parameters is clearer.
 */
public class ReportConfigurationPrototypeDemo {
  public static final class ReportConfiguration implements Cloneable {
    private final String reportName;
    private final Map<String, String> filters;

    public ReportConfiguration(String reportName, Map<String, String> filters) {
      this.reportName = reportName;
      this.filters = new HashMap<>(filters);
    }

    public ReportConfiguration deepCopy() {
      return new ReportConfiguration(reportName, filters);
    }

    public void putFilter(String key, String value) {
      filters.put(key, value);
    }

    public String filter(String key) {
      return filters.get(key);
    }
  }
}
