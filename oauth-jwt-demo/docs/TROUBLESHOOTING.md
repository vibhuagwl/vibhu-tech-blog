# Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| 401 | missing/expired/bad sig/wrong iss | Bearer, clock, JWKS, issuer |
| 403 | missing scope/role | claims vs @PreAuthorize |
| invalid_client | bad id/secret | Basic auth encoding |
| invalid_grant | bad code/refresh/PKCE | rerun flow; verifier |
| redirect_uri mismatch | not exact | register exact URI |
| CORS | origin / * + credentials | explicit origins |
