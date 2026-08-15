package com.vibhu.spring.nplusone.repo;

import com.vibhu.spring.nplusone.domain.Author;
import com.vibhu.spring.nplusone.web.AuthorBookRow;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuthorRepository extends JpaRepository<Author, Long> {

  /** Bad baseline: loads authors only — books stay lazy. */
  @Query("select a from Author a order by a.id")
  List<Author> findAllAuthors();

  /** Fix 1: join fetch collection in one query. */
  @Query("select distinct a from Author a left join fetch a.books order by a.id")
  List<Author> findAllWithBooksJoinFetch();

  /** Fix 2: entity graph — attributePaths loaded eagerly for this query only. */
  @EntityGraph(attributePaths = "books")
  @Query("select a from Author a order by a.id")
  List<Author> findAllWithBooksEntityGraph();

  /** Fix 4: DTO / interface projection — SQL selects only needed columns. */
  @Query(
      """
      select a.name as authorName, b.title as bookTitle
      from Author a
      left join a.books b
      order by a.id, b.id
      """)
  List<AuthorBookRow> findAuthorBookRows();
}
