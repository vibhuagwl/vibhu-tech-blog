-- Release lock only if we still own the token. Never DEL another pod's lock.
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
