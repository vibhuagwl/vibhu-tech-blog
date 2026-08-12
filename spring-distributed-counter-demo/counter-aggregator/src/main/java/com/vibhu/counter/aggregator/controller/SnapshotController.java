package com.vibhu.counter.aggregator.controller;

import com.vibhu.counter.aggregator.store.SnapshotStore;
import com.vibhu.counter.common.dto.SnapshotResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/snapshots")
public class SnapshotController {
    private final SnapshotStore snapshotStore;

    public SnapshotController(SnapshotStore snapshotStore) {
        this.snapshotStore = snapshotStore;
    }

    @GetMapping("/{resourceId}")
    public SnapshotResponse get(@PathVariable String resourceId) {
        return snapshotStore.get(resourceId);
    }
}
