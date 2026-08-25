/** Spring annotations, SpEL, keys. */

export const ENABLE_CACHING = `WHAT: @EnableCaching turns on Spring's cache infrastructure.
WHY: Registers CacheInterceptor via AOP proxies (proxy mode by default).

FLOW:
  Client → Spring Proxy → CacheInterceptor → @Cacheable method → target bean

INTERNAL: AnnotationCacheOperationSource reads @Cacheable/@CachePut/@CacheEvict;
CacheAspectSupport looks up CacheManager/Cache, applies SpEL keys.

PRODUCTION: proxy mode ≠ AspectJ; self-invocation skips the proxy (see Advanced).
MEMORY: Annotations work through the proxy — not magic bytecode by default.`;

export const CACHEABLE = `WHAT: Check cache first; on miss run method and store result.
WHY: Avoid repeated expensive DB/remote calls.

First GET /users/1 → MISS → DB → put → return
Second GET /users/1 → HIT → return (no DB)

@Cacheable("users")
public User getUser(Long id) { return repo.findById(id).orElse(null); }

MEMORY: @Cacheable = "check cache first".`;

export const PARAMS = `Common @Cacheable attributes:

cacheNames / value   — which named Cache region
key                  — SpEL for cache key
keyGenerator         — bean name of KeyGenerator
cacheManager         — which CacheManager bean
cacheResolver        — dynamic Cache selection
condition            — SpEL BEFORE method (skip cache ops if false)
unless               — SpEL AFTER method (do not store if true)
sync                 — synchronize loads for same key in this JVM

condition = "#id > 0"     → BEFORE
unless = "#result == null" → AFTER

MEMORY: condition BEFORE · unless AFTER

sync=true: single-flight per key inside one JVM (stampede help locally);
does NOT coordinate across pods — need Redis lock / L1 for distributed stampede.

Spring constraint (important): sync=true cannot be combined with unless on the same @Cacheable.`;

export const PUT_EVICT = `@CachePut  = always execute method AND update cache (write refresh)
@CacheEvict = remove key or allEntries from cache

@CachePut(cacheNames="users", key="#user.id")
User updateUser(User user) { return repo.save(user); }

@CacheEvict(cacheNames="users", key="#id")
void deleteUser(Long id) { repo.deleteById(id); }

@CacheEvict(cacheNames="users", allEntries=true)
void flushUsers() { ... }

beforeInvocation=true → evict BEFORE method (even if method throws)
default (false) → evict AFTER successful method

MEMORY: Put = refresh · Evict = forget`;

export const CACHING_CONFIG = `@Caching combines multiple put/evict operations on one method
  (e.g. update product → put product-by-id + evict product-list).

@CacheConfig(cacheNames="users") on class → shared defaults for methods.
MEMORY: @CacheConfig = DRY for cacheNames/keyGenerator/cacheManager.`;

export const KEYS_SPEL = `Default SimpleKeyGenerator:
  0 args → SimpleKey.EMPTY
  1 arg  → that arg (if suitable)
  n args → SimpleKey(args...)

Examples:
  key = "#id"
  key = "#user.id"
  key = "#id + ':' + #type"
  key = "T(java.util.Objects).hash(#a,#b)"

SpEL roots:
  #id / #user     method args by name
  #result          after invocation (unless / @CachePut)
  #root.methodName #root.target #args

Multi-tenant: key = "#tenantId + ':' + #id"  (or KeyGenerator)

BAD: key always "user" → one slot for all users (collision)
GOOD: "user:" + id · versioned "user:v2:" + id

Custom KeyGenerator bean → keyGenerator = "tenantKeyGenerator"

MEMORY: Wrong key = wrong data or silent overwrite.`;

export const ANNOTATION_CODE = `@Service
@CacheConfig(cacheNames = "products")
public class ProductService {
  private final ProductRepository repo;

  @Cacheable(key = "#id", condition = "#id > 0", unless = "#result == null")
  public Product get(Long id) { return repo.findById(id).orElse(null); }

  @Cacheable(cacheNames = "productsSynced", key = "#id", sync = true)
  public Product getSynced(Long id) { return repo.findById(id).orElseThrow(); }

  @CachePut(key = "#product.id")
  public Product save(Product product) { return repo.save(product); }

  @CacheEvict(key = "#id")
  public void delete(Long id) { repo.deleteById(id); }

  @Caching(evict = {
      @CacheEvict(key = "#product.id"),
      @CacheEvict(cacheNames = "productLists", allEntries = true)
  })
  public Product rename(Product product) { return repo.save(product); }
}`;
