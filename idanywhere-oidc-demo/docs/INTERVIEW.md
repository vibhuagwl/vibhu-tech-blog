# Interview notes

## Punchline
> IDAnywhere is our enterprise OIDC IdP on ADFS. The app is an OAuth client — we never see the password. APIs validate JWTs from IDAnywhere JWKS and authorize from AD group claims.

## Contrast
- Local form login = you own credentials.
- Local Spring AS (`oauth-jwt-demo`) = you own the IdP.
- IDAnywhere = corporate owns authn; you still own API authz.

## Follow-ups
- OAuth vs OIDC?
- Why not send `id_token` to APIs?
- How do you map AD groups to `@PreAuthorize`?
- What breaks when IDAnywhere is down?
- PKCE for public clients vs confidential web apps
