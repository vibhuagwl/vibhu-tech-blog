package com.example.designpatterns.creational.prototype;

import java.util.HashMap;
import java.util.Map;

public class ReportConfigurationPrototypeDemo {
    public static final class ReportConfiguration implements Cloneable {
        private final String reportName;
        private final Map<String, String> filters;
        public ReportConfiguration(String reportName, Map<String, String> filters) { this.reportName = reportName; this.filters = new HashMap<>(filters); }
        public ReportConfiguration deepCopy() { return new ReportConfiguration(reportName, filters); }
        public void putFilter(String key, String value) { filters.put(key, value); }
        public String filter(String key) { return filters.get(key); }
    }
}
