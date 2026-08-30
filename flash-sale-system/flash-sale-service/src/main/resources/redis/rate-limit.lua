-- Fixed-window counter. KEYS[1]=rl:user:{id}  ARGV[1]=max per second.
local n = redis.call('INCR', KEYS[1])
if n == 1 then
  redis.call('EXPIRE', KEYS[1], 1)
end
if n > tonumber(ARGV[1]) then
  return 0
end
return 1
