package com.vibhu.spring.nplusone.web;

import com.vibhu.spring.nplusone.domain.Author;
import com.vibhu.spring.nplusone.repo.AuthorRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.hibernate.Session;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/authors")
public class AuthorController {
  private final AuthorRepository authors;
  private final EntityManager entityManager;

  public AuthorController(AuthorRepository authors, EntityManager entityManager) {
    this.authors = authors;
    this.entityManager = entityManager;
  }

  /** Classic N+1: find authors, then touch books per author inside the transaction. */
  @GetMapping("/bad")
  @Transactional(readOnly = true)
  public List<AuthorResponse> bad() {
    List<Author> list = authors.findAllAuthors();
    return list.stream().map(AuthorResponse::from).toList(); // getBooks() triggers N selects
  }

  @GetMapping("/join-fetch")
  @Transactional(readOnly = true)
  public List<AuthorResponse> joinFetch() {
    return authors.findAllWithBooksJoinFetch().stream().map(AuthorResponse::from).toList();
  }

  @GetMapping("/entity-graph")
  @Transactional(readOnly = true)
  public List<AuthorResponse> entityGraph() {
    return authors.findAllWithBooksEntityGraph().stream().map(AuthorResponse::from).toList();
  }

  /** Enables Hibernate batch fetching for this session only — N queries become ~1 IN (...). */
  @GetMapping("/batch")
  @Transactional(readOnly = true)
  public List<AuthorResponse> batch() {
    entityManager.unwrap(Session.class).setFetchBatchSize(16);
    return authors.findAllAuthors().stream().map(AuthorResponse::from).toList();
  }

  @GetMapping("/dto")
  @Transactional(readOnly = true)
  public List<AuthorBookRow> dto() {
    return authors.findAuthorBookRows();
  }
}
