/** Failure-injection test catalog + Spring Kafka test sketches (Java 21). */

export const CHAOS_TESTS: {name: string; asserts: string}[] = [
  {name: 'testTransientFailureEventuallySucceeds', asserts: 'Succeeds within backoff; no DLT; offset advances once'},
  {name: 'testPermanentFailureGoesToDlt', asserts: 'Validation → DLT; source committed after DLT; no infinite retry'},
  {name: 'testPoisonMessageGoesDirectlyToDlt', asserts: 'NotRetryable; 0 hot retries; raw payload on DLT'},
  {name: 'testDltPublishFailureDoesNotLoseMessage', asserts: 'Recoverer throws; source NOT committed; seek retries; metric fired'},
  {name: 'testCrashAfterDltPublishBeforeOffsetCommit', asserts: 'Redelivery; DLT deduped by (topic,partition,offset)'},
  {name: 'testDuplicateDltPublishIsHandled', asserts: 'Unique constraint / header dedupe; one business effect'},
  {name: 'testConsumerRebalanceDuringProcessing', asserts: 'Second owner idempotent; no double charge'},
  {name: 'testDeserializationFailure', asserts: 'EHD → DLT with bytes; listener not required for typed object'},
  {name: 'testKeyDeserializationFailure', asserts: 'EHD on key serde; record recoverable'},
  {name: 'testSchemaRegistryUnavailable', asserts: 'Retries; no DLT storm; recovers when SR up'},
  {name: 'testBatchPartialFailure', asserts: 'BLFE index; A,B done; C recovered; D+ redelivered'},
  {name: 'testTransactionRollback', asserts: 'Offsets not committed; ARP path invoked'},
  {name: 'testTransactionalDltRecovery', asserts: 'commitRecovered semantics; no loss'},
  {name: 'testReplayIsIdempotent', asserts: 'Second replay no double side effect'},
  {name: 'testReplayDoesNotCreateInfiniteLoop', asserts: 'replayCount>=MAX → quarantine'},
  {name: 'testOrderingViolationPark', asserts: 'Later event held while prior open DLT'},
  {name: 'testExternalDbCommitThenKafkaFailure', asserts: 'Redelivery hits UNIQUE; no double mutate'},
  {name: 'testKafkaCommitThenDbFailure', asserts: 'Outbox/CDC repairs or alert; document gap'},
  {name: 'testDltAclFailure', asserts: 'No source commit; Sev1'},
  {name: 'testDltTopicUnavailable', asserts: 'Seek+alert until topic exists'},
  {name: 'testDltRecordTooLarge', asserts: 'Fallback headers-only recoverer or fail safe'},
];

export const CHAOS_TEST_CODE = `@SpringBootTest
@Testcontainers
class DlqFailureInjectionIT {
  @Container static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("apache/kafka:3.8.0"));

  @Test
  void testDltPublishFailureDoesNotLoseMessage() {
    // Point recoverer at a denied DLT topic ACL
    assertThat(consumerLag(MAIN)).isGreaterThan(0);
    assertThat(dltCount()).isZero();
    assertThat(meterRegistry.counter("kafka.dlt.publish.failure").count()).isGreaterThan(0);
  }

  @Test
  void testReplayDoesNotCreateInfiniteLoop() {
    row.setReplayCount(3);
    assertThatThrownBy(() -> replay.replayOne(row, "tester"))
      .isInstanceOf(ReplayRejectedException.class);
    assertThat(quarantineCount()).isEqualTo(1);
  }

  @Test
  void testExternalDbCommitThenKafkaFailure() {
    // Stub offset commit failure after DB success
    assertThat(payments.find("pay-1")).isPresent();
    // redelivery
    assertThat(payments.find("pay-1")).isPresent(); // still one row
    assertThat(chargeClient.charges("pay-1")).isEqualTo(1);
  }
}`;

export const IMPL_CLASSIFIER = `public final class FailureClassifier {
  public enum Kind { TRANSIENT, PERMANENT, POISON, UNKNOWN }

  public Kind classify(Throwable t) {
    Throwable c = NestedExceptionUtils.getMostSpecificCause(t);
    if (c instanceof JsonParseException || c instanceof SerializationException) return Kind.POISON;
    if (c instanceof ValidationException || c instanceof IllegalArgumentException) return Kind.PERMANENT;
    if (c instanceof QueryTimeoutException || c instanceof CannotAcquireLockException) return Kind.TRANSIENT;
    if (c instanceof WebClientResponseException.ServiceUnavailable) return Kind.TRANSIENT;
    if (c instanceof WebClientResponseException.BadRequest) return Kind.PERMANENT;
    if (c instanceof WebClientResponseException.TooManyRequests) return Kind.TRANSIENT;
    return Kind.UNKNOWN;
  }
}`;

export const IMPL_CONFIG = `@Configuration
@EnableKafka
public class KafkaDlqConfig {
  @Bean
  DeadLetterPublishingRecoverer recoverer(KafkaTemplate<String, byte[]> bytesTpl) {
    DeadLetterPublishingRecoverer r = new DeadLetterPublishingRecoverer(bytesTpl,
      (rec, ex) -> new TopicPartition(rec.topic() + ".DLT", rec.partition()));
    r.setFailIfSendResultIsError(true);
    return r;
  }

  @Bean
  CommonErrorHandler errorHandler(DeadLetterPublishingRecoverer recoverer) {
    DefaultErrorHandler eh = new DefaultErrorHandler(recoverer, new ExponentialBackOff(1_000L, 2.0));
    eh.setRetryListeners((record, ex, delivery) -> { /* metrics */ });
    eh.addNotRetryableExceptions(ValidationException.class, JsonParseException.class);
    eh.setResetStateOnRecoveryFailure(true);
    return eh;
  }

  @Bean
  ErrorHandlingDeserializer<PaymentEvent> valueDeser(JsonDeserializer<PaymentEvent> delegate) {
    return new ErrorHandlingDeserializer<>(delegate);
  }
}`;
