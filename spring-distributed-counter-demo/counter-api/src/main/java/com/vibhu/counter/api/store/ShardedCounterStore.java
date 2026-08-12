package com.vibhu.counter.api.store;

import com.vibhu.counter.api.config.CounterProperties;
import com.vibhu.counter.common.dto.ShardValue;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.CRC32;

@Component
public class ShardedCounterStore {
    private final int shardCount;
    private final ConcurrentHashMap<ShardKey, AtomicLong> counters = new ConcurrentHashMap<>();

    public ShardedCounterStore(CounterProperties properties) {
        this.shardCount = properties.shardCount();
    }

    public ShardKey chooseShard(String resourceId, String stableShardHint) {
        int shard = stableShardHint == null || stableShardHint.isBlank()
                ? ThreadLocalRandom.current().nextInt(shardCount)
                : Math.floorMod(crc32(resourceId + ":" + stableShardHint), shardCount);
        return new ShardKey(resourceId, shard);
    }

    public long increment(ShardKey shardKey, long delta) {
        return counters.computeIfAbsent(shardKey, ignored -> new AtomicLong()).addAndGet(delta);
    }

    public long sum(String resourceId) {
        return counters.entrySet().stream()
                .filter(entry -> entry.getKey().resourceId().equals(resourceId))
                .mapToLong(entry -> entry.getValue().get())
                .sum();
    }

    public Map<Integer, Long> shardMap(String resourceId) {
        Map<Integer, Long> result = new TreeMap<>();
        for (int shard = 0; shard < shardCount; shard++) {
            result.put(shard, counters.getOrDefault(new ShardKey(resourceId, shard), new AtomicLong()).get());
        }
        return result;
    }

    public List<ShardValue> shardValues(String resourceId) {
        List<ShardValue> values = new ArrayList<>();
        shardMap(resourceId).forEach((shard, value) ->
                values.add(new ShardValue(shard, new ShardKey(resourceId, shard).redisKey(), value))
        );
        return values;
    }

    private static int crc32(String value) {
        CRC32 crc32 = new CRC32();
        crc32.update(value.getBytes(StandardCharsets.UTF_8));
        return (int) crc32.getValue();
    }
}
