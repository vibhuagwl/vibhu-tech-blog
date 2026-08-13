package com.vibhu.spring.nplusone.web;

/** Interface projection — no entity graph walk, no lazy loads. */
public interface AuthorBookRow {
  String getAuthorName();
  String getBookTitle();
}
