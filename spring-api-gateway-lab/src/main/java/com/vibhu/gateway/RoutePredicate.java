package com.vibhu.gateway;

import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

/** Minimal path/method predicate matcher for interview routing demos. */
public final class RoutePredicate {
  private final Pattern path;
  private final String method; // null = any

  public RoutePredicate(String pathGlob, String method) {
    this.path = Pattern.compile(globToRegex(pathGlob));
    this.method = method == null ? null : method.toUpperCase(Locale.ROOT);
  }

  public boolean matches(String requestPath, String requestMethod) {
    Objects.requireNonNull(requestPath, "path");
    if (method != null && !method.equalsIgnoreCase(requestMethod)) {
      return false;
    }
    return path.matcher(requestPath).matches();
  }

  private static String globToRegex(String glob) {
    StringBuilder sb = new StringBuilder("^");
    for (int i = 0; i < glob.length(); i++) {
      char c = glob.charAt(i);
      if (c == '*' && i + 1 < glob.length() && glob.charAt(i + 1) == '*') {
        sb.append(".*");
        i++;
      } else if (c == '*') {
        sb.append("[^/]*");
      } else if ("\\.[]{}()+-^$|".indexOf(c) >= 0) {
        sb.append('\\').append(c);
      } else {
        sb.append(c);
      }
    }
    return sb.append('$').toString();
  }
}
