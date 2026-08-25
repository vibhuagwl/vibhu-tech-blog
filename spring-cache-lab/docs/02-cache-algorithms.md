# 02 — Cache algorithms

| Algorithm | Evicts |
|-----------|--------|
| LRU | Least recently used |
| LFU | Least frequently used |
| FIFO | Oldest inserted |
| TTL | Time expired |

Implementations in `algorithm/`: `LruCache`, `ManualLruCache`, `LfuCache`, `TtlCache`.

Spring Cache does **not** implement LRU/LFU — Caffeine/Redis policies do.
