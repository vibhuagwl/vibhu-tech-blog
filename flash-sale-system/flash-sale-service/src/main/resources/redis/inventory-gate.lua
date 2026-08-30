-- Atomic inventory gate. Returns:
--   1  acquired
--   0  not enough stock
--  -1  key missing (fail closed — warm-up must SET the key)
-- WHY Lua: GET then DECR without this script races two buyers on stock=1.
local stock = redis.call('GET', KEYS[1])
if not stock then
  return -1
end
if tonumber(stock) < tonumber(ARGV[1]) then
  return 0
end
redis.call('DECRBY', KEYS[1], ARGV[1])
return 1
