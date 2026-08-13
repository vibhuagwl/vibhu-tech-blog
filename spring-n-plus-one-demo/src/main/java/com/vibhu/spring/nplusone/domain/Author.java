package com.vibhu.spring.nplusone.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "authors")
public class Author {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;

  /**
   * LAZY is the usual default for collections — and the root of N+1 when touched in a loop.
   * Batch fetching is enabled only in AuthorController.batch() via Session#setFetchBatchSize.
   */
  @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
  private List<Book> books = new ArrayList<>();

  protected Author() {}

  public Author(String name) {
    this.name = name;
  }

  public void addBook(String title) {
    Book book = new Book(title, this);
    books.add(book);
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public List<Book> getBooks() {
    return books;
  }
}
