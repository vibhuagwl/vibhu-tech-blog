package com.vibhu.bloom.config;

import com.vibhu.bloom.service.BloomFilterService;
import com.vibhu.bloom.user.UserEntity;
import com.vibhu.bloom.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UserBloomSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(UserBloomSeeder.class);

  private final BloomProperties props;
  private final UserRepository users;
  private final BloomFilterService bloom;

  public UserBloomSeeder(BloomProperties props, UserRepository users, BloomFilterService bloom) {
    this.props = props;
    this.users = users;
    this.bloom = bloom;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (users.count() == 0 && props.seedUsers() > 0) {
      log.info("Seeding {} demo users", props.seedUsers());
      for (int i = 1; i <= props.seedUsers(); i++) {
        String id = "user-" + i;
        users.save(new UserEntity(id, "User " + i, "user" + i + "@example.com"));
      }
    }
    bloom.rebuildFromDatabase();
  }
}
