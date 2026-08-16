export const HANDLER_CODE = `@KafkaListener(topics = "events.v1", groupId = "event-router")
public class EventListener {

  @KafkaHandler
  public void onOrder(OrderCreated event) { ... }

  @KafkaHandler
  public void onPayment(PaymentCreated event) { ... }

  @KafkaHandler(isDefault = true)
  public void unknown(Object payload) {
    // log + metric — or throw to DLT path
  }
}`;

export const HANDLER_FLOW = `Kafka record
     |
deserialization → payload type
     |
@KafkaHandler method selection by assignable type
     |
invoke matched method
     |
ambiguity / no match → default handler or fail`;

export const HANDLER_NOTES = `One class-level @KafkaListener → one container / consumer group.
@KafkaHandler methods share that consumer — they are NOT separate groups.

Prefer when: polymorphic event topic with stable Java types.
Avoid when: types collide, deser is weak, or you need different error/retry policies per type
(use separate @KafkaListener + type headers / different topics instead).

Ambiguous matches (two handlers equally applicable) fail at runtime — keep type hierarchy clean.`;

export const LISTENERS_CODE = `@KafkaListeners({
  @KafkaListener(topics = "orders.v1", groupId = "billing", containerFactory = "jsonFactory"),
  @KafkaListener(topics = "payments.v1", groupId = "billing", containerFactory = "avroFactory")
})
public void onEither(@Payload Object payload) { ... }`;

export const LISTENERS_NOTES =
  '@KafkaListeners is a repeatable container for multiple @KafkaListener declarations on one method. Useful when one method should bind to several topic/group/factory combinations without duplicating method bodies. Each annotation still creates its own container subscription semantics as configured.';
