-- Atomic fixed-window counter for a single Redis hash key.
-- KEYS[1] = rate_limit hash (window_start, count)
-- ARGV[1] = limit (max requests per window)
-- ARGV[2] = window_ms
-- ARGV[3] = now_ms
-- ARGV[4] = cost (usually 1)
-- ARGV[5] = ttl_ms
--
-- Returns: {allowed (0|1), remaining, retry_after_ms, limit}

local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local ttl = tonumber(ARGV[5])

local data = redis.call('HMGET', key, 'window_start', 'count')
local window_start = tonumber(data[1])
local count = tonumber(data[2])

if window_start == nil or count == nil then
  window_start = math.floor(now / window_ms) * window_ms
  count = 0
end

if now - window_start >= window_ms then
  window_start = math.floor(now / window_ms) * window_ms
  count = 0
end

local allowed = 0
local retry_after_ms = 0

if count + cost <= limit then
  count = count + cost
  allowed = 1
else
  local window_end = window_start + window_ms
  retry_after_ms = math.max(window_end - now, 1)
end

redis.call('HSET', key, 'window_start', window_start, 'count', count)
redis.call('PEXPIRE', key, ttl)

local remaining = math.max(0, limit - count)
return {allowed, remaining, retry_after_ms, limit}
