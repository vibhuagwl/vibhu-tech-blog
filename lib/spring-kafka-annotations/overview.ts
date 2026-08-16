/** Mental model, classification, decision tree, don't-confuse. */

export const PAGE_MEMORY =
  'Annotations configure Spring — not the Kafka broker. @KafkaListener owns consume; @RetryableTopic owns hop-retry; @DltHandler owns DLT consume; @SendTo owns reply produce; @Transactional owns Spring TX boundary.';

export const MENTAL_MODEL = `Spring Kafka Annotation
        |
        v
Spring container / framework behavior
        |
        v
Kafka Producer / Consumer API (clients)
        |
        v
Kafka Broker (stores topics — does NOT run annotations)`;

export const MENTAL_NOTE =
  'Spring Kafka annotations do NOT configure the Kafka broker directly. @KafkaListener configures how the Spring application consumes records. @RetryableTopic instructs Spring how to implement non-blocking retry — Kafka itself does not “retry.”';

export const CLASSIFICATION: string[][] = [
  ['@EnableKafka', 'Infrastructure', '', '✓', '', '', '', ''],
  ['@EnableKafkaRetryTopic', 'Infrastructure', '', '✓', '✓', '✓', '✓', ''],
  ['@KafkaListener', 'Consumer', '', '✓', '', '', '', ''],
  ['@KafkaHandler', 'Consumer', '', '✓', '', '', '', ''],
  ['@KafkaListeners', 'Consumer', '', '✓', '', '', '', ''],
  ['@RetryableTopic', 'Retry / Error', '', '✓', '✓', '✓', '✓', ''],
  ['@Backoff', 'Retry', '', '✓', '✓', '✓', '', ''],
  ['@DltHandler', 'DLT', '', '✓', '✓', '', '✓', ''],
  ['@SendTo', 'Messaging', '✓', '✓', '', '', '', ''],
  ['@Transactional', 'Transaction', '✓', '✓', '', '', '', '✓'],
];

export const CLASS_HEADERS = [
  'Annotation',
  'Category',
  'Producer',
  'Consumer',
  'Error',
  'Retry',
  'DLT',
  'Txn',
];

export const DECISION_TREE = `I need to consume Kafka
        |
        v
@KafkaListener
        |
        +--> multiple payload types on one topic?
        |       +--> @KafkaHandler (class-level listener)
        |
        +--> transient failures need delayed retry without blocking partition?
        |       +--> @RetryableTopic (+ @Backoff)
        |       +--> else DefaultErrorHandler (blocking) — see /kafka-dlq
        |
        +--> handle terminal failures in-app?
        |       +--> @DltHandler (with @RetryableTopic)
        |
        +--> publish method return value?
        |       +--> @SendTo
        |
        +--> Kafka transaction required?
                +--> KafkaTransactionManager + @Transactional
                +--> NOT the same as DB @Transactional alone`;

export const DONT_CONFUSE = `                    SPRING KAFKA
                         |
          +--------------+--------------+
          |              |              |
       CONSUME         RETRY          PRODUCE
          |              |              |
 @KafkaListener    @RetryableTopic   @SendTo
 @KafkaHandler     @Backoff          KafkaTemplate
 @KafkaListeners   @DltHandler
                         |
                        DLT

                         |
                    TRANSACTION
                         |
                  @Transactional

@KafkaListener     = Spring consumer abstraction
@RetryableTopic    = Spring retry-topic abstraction
@DltHandler        = Spring DLT consumer handler
@SendTo            = Spring listener-result publishing
@Transactional     = Spring transaction abstraction
KafkaTemplate      = Spring producer abstraction
Kafka broker       = does NOT execute these annotations`;

export const VERSION_NOTE =
  'Verified against Spring Kafka 3.2.x / 3.3.x annotation APIs (@RetryableTopic attributes include exceptionBasedDltRouting since 3.2, sameIntervalTopicReuseStrategy default SINGLE_TOPIC). Pair with Boot 3.x + Java 21+. Broker configs live on /kafka-properties — not here.';
