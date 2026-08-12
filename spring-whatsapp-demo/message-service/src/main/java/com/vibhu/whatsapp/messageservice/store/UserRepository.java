package com.vibhu.whatsapp.messageservice.store;

import com.vibhu.whatsapp.messageservice.model.UserRecord;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class UserRepository {
    private final ConcurrentMap<String, UserRecord> usersById = new ConcurrentHashMap<>();

    public UserRecord save(UserRecord user) {
        usersById.put(user.userId(), user);
        return user;
    }

    public Optional<UserRecord> findById(String userId) {
        return Optional.ofNullable(usersById.get(userId));
    }
}
