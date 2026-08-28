# Certificate Rotation (Zero Downtime)

## Dual-trust window

```
Phase 1: Add new CA to truststore (keep old CA)
Phase 2: Rotate broker certs (rolling, one broker/AZ at a time)
Phase 3: Rotate client truststores / redeploy apps
Phase 4: Remove old CA from truststore after all peers updated
```

## Broker rolling procedure

1. Generate new cert signed by new CA (or renewed same CA)
2. Update K8s Secret `kafka-tls` with new keystore
3. Rolling restart broker pod (one at a time)
4. Verify URP=0, active controller=1 after each bounce
5. Monitor auth failure metrics during roll

## Client rotation

- Mount truststore from Secret; update Secret → rolling pod restart
- SCRAM password rotation: `kafka-configs --alter` new password → update Secrets Manager → rolling app deploy

## Alerts

- Cert expiry < 30 days → warning
- Cert expiry < 7 days → page platform team
