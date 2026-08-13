package com.vibhu.spring.nplusone.config;

import com.vibhu.spring.nplusone.domain.Author;
import com.vibhu.spring.nplusone.repo.AuthorRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoDataLoader implements ApplicationRunner {
  private final AuthorRepository authors;

  public DemoDataLoader(AuthorRepository authors) {
    this.authors = authors;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (authors.count() > 0) {
      return;
    }
    Author ada = new Author("Ada");
    ada.addBook("Notes on the Analytical Engine");
    ada.addBook("Correspondence");

    Author grace = new Author("Grace");
    grace.addBook("COBOL and Compilers");
    grace.addBook("Bug report: moth");

    Author alan = new Author("Alan");
    alan.addBook("On Computable Numbers");

    authors.save(ada);
    authors.save(grace);
    authors.save(alan);
  }
}
