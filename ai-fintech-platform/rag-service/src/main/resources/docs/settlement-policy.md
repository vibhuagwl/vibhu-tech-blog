# Settlement Policy

Payments settle T+1 for HSBC rail. Failed payments are not settled until retried successfully or manually cancelled.

Ops must not mark PAY-123 as settled while status=FAILED.
