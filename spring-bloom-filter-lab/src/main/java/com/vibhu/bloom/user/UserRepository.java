package com.vibhu.bloom.user;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<UserEntity, String> {

  @Query("select u.id from UserEntity u")
  List<String> findAllIds();
}
