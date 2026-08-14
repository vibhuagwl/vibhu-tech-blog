-- Atomic token-bucket consume for a single Redis hash key.
-- KEYS[1] = rate_limit hash (tokens, ts)
-- ARGV[1] = capacity
-- ARGV[2] = refill_rate (tokens per period)
-- ARGV[3] = period_ms
-- ARGV[4] = now_ms (server-supplied; Redis TIME is an alternative)
-- ARGV[5] = cost (tokens to consume, usually 1)
-- ARGV[6] = ttl_ms (idle expiry so abandoned keys vanish)
--
-- Returns: {allowed (0|1), remaining (floor), retry_after_ms, limit (capacity)}
-- Cluster: keep this a SINGLE-KEY script so hash-slot routing stays local.

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local period_ms = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local cost = tonumber(ARGV[5])
local ttl = tonumber(ARGV[6])

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if tokens == nil or ts == nil then
  tokens = capacity
  ts = now
end

local elapsed = now - ts
if elapsed < 0 then
  elapsed = 0
end

local refill = (elapsed / period_ms) * refill_rate
tokens = math.min(capacity, tokens + refill)
ts = now

local allowed = 0
local retry_after_ms = 0

if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
else
  local needed = cost - tokens
  retry_after_ms = math.ceil((needed / refill_rate) * period_ms)
end

redis.call('HSET', key, 'tokens', tokens, 'ts', ts)
redis.call('PEXPIRE', key, ttl)

local remaining = math.floor(tokens)
return {allowed, remaining, retry_after_ms, capacity}
