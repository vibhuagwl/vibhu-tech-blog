package com.vibhu.spring.nplusone.web;

import com.vibhu.spring.nplusone.domain.Author;
import java.util.List;

public record AuthorResponse(Long id, String name, List<String> bookTitles) {
  public static AuthorResponse from(Author author) {
    List<String> titles = author.getBooks().stream().map(b -> b.getTitle()).toList();
    return new AuthorResponse(author.getId(), author.getName(), titles);
  }
}
