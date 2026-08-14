export type PkiPieceId =
  | 'framework'
  | 'crypto'
  | 'certificate'
  | 'ca'
  | 'trust'
  | 'identity'
  | 'communication'
  | 'authentication'
  | 'encryption'
  | 'signatures'
  | 'implementation';

export type PkiPiece = {
  id: PkiPieceId;
  group: 'building-block' | 'what-it-enables';
  name: string;
  famousAs: string;
  oneLiner: string;
  analogy: string;
  internals: string[];
  mermaid: string;
  java: string;
  javaTitle: string;
  labClass: string;
  pros: string[];
  cons: string[];
  useWhen: string;
  avoidWhen: string;
  memory: string;
  interview: string;
};

export const PKI_SENTENCE =
  'PKI binds a name to a public key with a CA signature so strangers can authenticate, encrypt, and sign without sharing a secret first.';

export const PKI_DEFINITION =
  'PKI is a framework of cryptographic technologies, digital certificates, certificate authorities, and trust mechanisms used to establish identity, enable secure communication, and provide authentication, encryption, and digital signatures.';

export const PKI_PILLARS: {id: PkiPieceId; title: string; job: string}[] = [
  {id: 'certificate', title: 'Certificates', job: 'Nametag on a public key'},
  {id: 'ca', title: 'Certificate authorities', job: 'The notary that signs nametags'},
  {id: 'trust', title: 'Trust mechanisms', job: 'Whose notaries you believe'},
  {id: 'crypto', title: 'Crypto technologies', job: 'RSA, ECDSA, AES, TLS inside the cert'},
];

export const PKI_JOBS: {id: PkiPieceId; title: string; job: string}[] = [
  {id: 'identity', title: 'Identity', job: 'Who is this host or workload?'},
  {id: 'communication', title: 'Secure communication', job: 'TLS handshake uses the cert'},
  {id: 'authentication', title: 'Authentication', job: 'Server auth and mTLS client auth'},
  {id: 'encryption', title: 'Encryption', job: 'Encrypt to the cert public key'},
  {id: 'signatures', title: 'Digital signatures', job: 'Private key signs; cert verifies'},
];

export const PKI_MAP_MERMAID = `flowchart TB
  PKI[PKI framework]
  PKI --> CERT[Digital certificates]
  PKI --> CA[Certificate authorities]
  PKI --> TRUST[Trust store + chain + revocation]
  PKI --> CRYPTO[RSA ECDSA AES TLS]
  CERT --> ID[Establish identity]
  CA --> AUTH[Authentication]
  TRUST --> PIPE[Secure communication]
  CRYPTO --> ENC[Encryption]
  CRYPTO --> SIG[Digital signatures]`;

export const PKI_X509_FIELDS: {field: string; meaning: string; interview: string}[] = [
  {field: 'Subject', meaning: 'Who the cert claims to be (CN). Prefer SAN over CN.', interview: 'Identity label — not the trust decision.'},
  {field: 'SAN', meaning: 'DNS names / URIs / emails the cert is valid for.', interview: 'Hostname verification matches SAN, not vibes.'},
  {field: 'Issuer', meaning: 'Which CA signed this certificate.', interview: 'Walk issuer until you hit a trust anchor.'},
  {field: 'Public key', meaning: 'RSA or EC key bound to the subject.', interview: 'Encrypt-to or verify-with this key.'},
  {field: 'Signature', meaning: 'CA private key signed the TBS bytes.', interview: 'Proves the CA attested this nametag.'},
  {field: 'Validity', meaning: 'notBefore / notAfter.', interview: 'Expired certs fail closed. Monitor expiry.'},
  {field: 'Key Usage / EKU', meaning: 'What the key is allowed to do.', interview: 'serverAuth vs clientAuth vs codeSigning.'},
  {field: 'SKI / AKI', meaning: 'Key identifiers to build the chain.', interview: 'Chain building is not “same CN”.'},
  {field: 'CRL / OCSP', meaning: 'Revocation pointers.', interview: 'Stolen certs must be untrusted before expiry.'},
];

export const PKI_PIECES: PkiPiece[] = [
  {
    id: 'framework',
    group: 'building-block',
    name: 'PKI framework',
    famousAs: 'The deed office',
    oneLiner:
      'PKI is not one algorithm. It is the system that issues, distributes, validates, and revokes certificates so cryptographic keys can be trusted at a distance.',
    analogy:
      'A passport office: crypto is the ink, the certificate is the passport, the CA is the government, the truststore is which governments your border police believe.',
    internals: [
      PKI_DEFINITION,
      'Without PKI, AES/RSA/ECDSA still work — but only between parties who already share a secret or a raw public key. PKI answers “whose public key is this, and do I trust the attester?”',
      'Four moving parts: (1) cryptographic primitives, (2) X.509 digital certificates, (3) certificate authorities that sign them, (4) trust mechanisms (trust anchors, chain building, hostname checks, revocation).',
      'Those parts produce five outcomes: identity, secure communication, authentication, encryption, and digital signatures. TLS, mTLS, signed JWTs with JWKS, code signing, and S/MIME are all PKI applications.',
      'Java/Spring implementation lives in KeyStore (your private key + cert), TrustStore (CAs you believe), PKIX CertPathValidator, and TLS TrustManager. The lab PkiService is a tiny in-process CA so you can see issuance → chain → sign → encrypt-to-cert.',
    ],
    mermaid: PKI_MAP_MERMAID,
    java: `// PKI is a framework. One Spring lab class plays every role:
//   PkiService          — in-process Root CA + issuance + CRL
//   X509Certificate     — digital certificate (nametag + public key)
//   CertPathValidator   — trust mechanism (PKIX chain)
//   RSA-PSS / RSA-OAEP  — signatures and encryption using the cert key
//   TLS / mTLS          — secure communication that consumes the same certs
//
// Memory: algorithms hide or seal bytes. PKI tells you whose key you used.`,
    javaTitle: 'PKI is a framework — lab: PkiService',
    labClass: 'PkiService',
    pros: [
      'Strangers can bootstrap trust without a pre-shared HMAC secret.',
      'One identity object (the cert) drives TLS, signatures, and encrypt-to-public-key.',
      'Revocation and expiry give a lifecycle that raw key files do not.',
    ],
    cons: [
      'Operationally heavy: issuance, rotation, expiry monitors, CRL/OCSP, key ceremony.',
      'A compromised CA or a disabled hostname check collapses the whole model.',
      'People confuse “we have a certificate” with “we encrypted the database”.',
    ],
    useWhen: 'TLS, mTLS, partner signatures, code signing, device identity, S/MIME.',
    avoidWhen: 'Two internal services that already share a vault HMAC and never need third-party verify. PKI is overkill for a webhook secret.',
    memory: 'PKI = nametag + notary + who you believe. Algorithms do the math; PKI does the identity.',
    interview:
      'PKI is a framework of crypto, certificates, CAs, and trust mechanisms. It establishes identity and then reuses that identity for TLS, authentication, encryption-to-cert, and signatures.',
  },
  {
    id: 'crypto',
    group: 'building-block',
    name: 'Cryptographic technologies',
    famousAs: 'The ink in the passport',
    oneLiner:
      'PKI does not replace AES-GCM or RSA-PSS. It wraps those primitives: the cert carries a public key, the CA signs with RSA/ECDSA, TLS uses ECDH + AES-GCM.',
    analogy: 'The passport paper is X.509. The ink is SHA-256, RSA-PSS, ECDSA, AES-GCM. Bad ink makes a pretty booklet that forgers can copy.',
    internals: [
      'Certificate signature: CA computes SHA-256 over the TBS (to-be-signed) fields, then signs with CA private key (RSA-PSS or ECDSA). Verifiers use the CA public key from a trust anchor.',
      'Subject public key: RSA or EC. That key is what you encrypt to, or what verifies the subject’s signatures / TLS CertificateVerify.',
      'TLS 1.3 composes PKI with the five rooms: ECDH (KEY) agrees a secret, AES-GCM/ChaCha20 (LOCK) protects records, the certificate + CertificateVerify (SEAL) prove the server owns the name.',
      'Do not invent a new algorithm inside PKI. Use the same allowlist: RSA-3072+/P-256, SHA-256+, AES-GCM, TLS 1.3. Ban MD5/SHA-1 signatures on certs.',
    ],
    mermaid: `flowchart LR
  TBS[TBS certificate fields] --> H[SHA-256]
  H --> SIG[CA RSA-PSS or ECDSA]
  SIG --> CERT[X.509 cert]
  CERT --> TLS[TLS 1.3 ECDHE + AES-GCM]
  CERT --> OAEP[RSA-OAEP wrap DEK]
  CERT --> PSS[Subject RSA-PSS sign]`,
    java: `// CA signs the certificate (PKI ink)
ContentSigner caSigner =
    new JcaContentSignerBuilder("SHA256WithRSA").build(rootPrivateKey);
X509Certificate leaf =
    new JcaX509CertificateConverter().getCertificate(builder.build(caSigner));

// Subject uses the same key pair for app-level sign / encrypt-to-cert
Signature sig = Signature.getInstance("RSASSA-PSS");
sig.initSign(leafPrivateKey);
sig.update(payload);
byte[] signature = sig.sign();`,
    javaTitle: 'PKI reuses RSA-PSS / SHA-256 / AES-GCM',
    labClass: 'PkiService',
    pros: ['One key pair, many protocols. Standard algorithms, HSMs, and scanners understand them.'],
    cons: ['Algorithm agility still matters: old CAs mint SHA-1 certs; clients must refuse them.'],
    useWhen: 'Any PKI deployment — pick modern primitives and pin them in policy.',
    avoidWhen: 'Custom curves, MD5 certs, export-grade RSA, “disable TLS 1.3 to support a vendor”.',
    memory: 'PKI is policy around famous algorithms, not a sixth cipher.',
    interview: 'PKI uses SHA-256 plus RSA/ECDSA to bind a name to a key. TLS then uses that cert for ECDHE and AES-GCM. I do not treat PKI as a replacement for AES-GCM at rest.',
  },
  {
    id: 'certificate',
    group: 'building-block',
    name: 'Digital certificate',
    famousAs: 'The nametag',
    oneLiner:
      'An X.509 certificate is a signed document: “this public key belongs to payments.example until date D, attested by CA C.” It is not a secret and it is not encryption.',
    analogy: 'A laminated badge. Anyone can read it. The hologram (CA signature) is what stops you printing your own.',
    internals: [
      'X.509 v3: version, serial, signature algorithm, issuer, validity, subject, subject public key, extensions (SAN, KU, EKU, basicConstraints, SKI/AKI, CRLDP, AIA/OCSP).',
      'The CA signs the TBS bytes. Changing SAN after issuance breaks the signature. That is why you cannot “edit a cert” — you re-issue.',
      'Leaf vs CA: basicConstraints CA=false on servers; CA=true on issuers. A leaf must not sign other certs.',
      'PEM is encoding: -----BEGIN CERTIFICATE----- plus Base64 DER. Same rule as the rest of the hub — encoding is not security.',
      'Java type: java.security.cert.X509Certificate. Load with CertificateFactory.getInstance("X.509").',
    ],
    mermaid: `flowchart TD
  PUB[Subject public key] --> TBS[TBS fields]
  NAME[Subject + SAN] --> TBS
  DATES[notBefore notAfter] --> TBS
  KU[KeyUsage EKU] --> TBS
  TBS --> CASIG[CA signature]
  CASIG --> CERT[X.509 leaf]
  CERT --> ANYONE[Anyone can read PEM]
  CASIG --> NEED[Need CA public key to believe it]`,
    java: `CertificateFactory cf = CertificateFactory.getInstance("X.509");
X509Certificate cert = (X509Certificate) cf.generateCertificate(
    new ByteArrayInputStream(pem.getBytes(UTF_8)));

cert.checkValidity();                       // dates
String dn = cert.getSubjectX500Principal().getName();
PublicKey pub = cert.getPublicKey();        // encrypt-to / verify-with
cert.verify(issuerPublicKey);               // CA signature check only
// Full trust = chain + trust anchor + hostname + revocation (see Trust)`,
    javaTitle: 'Read an X.509 certificate — lab: PkiService.parsePem',
    labClass: 'PkiService',
    pros: ['Portable identity document. Browsers, JVMs, openssl, and partners all speak it.'],
    cons: ['Public. Never put a private key in a certificate PEM. People still concatenate them into one file and commit it.'],
    useWhen: 'Any time you must publish a public key with a name and an expiry.',
    avoidWhen: 'As a substitute for AES-GCM field encryption or Argon2id passwords.',
    memory: 'Certificate = public key + name + dates + CA hologram. Not a secret.',
    interview: 'A digital certificate binds a public key to a subject with a CA signature. I verify chain, time, hostname/SAN, usage, and revocation — not just “PEM parsed”.',
  },
  {
    id: 'ca',
    group: 'building-block',
    name: 'Certificate authority',
    famousAs: 'The notary',
    oneLiner:
      'A CA is a trusted issuer. It verifies a CSR (or an automated ACME request), signs a certificate, and later revokes it. Root CAs stay offline; intermediates issue daily.',
    analogy: 'The passport agency. You do not trust a passport because of the photo. You trust it because a government you already believe stamped it.',
    internals: [
      'Hierarchy: Root (trust anchor, often air-gapped) → Intermediate / issuing CA → leaf. Browsers and JVMs ship public roots. Enterprises add private roots to the truststore.',
      'Issuance path: generate key pair → CSR (PKCS#10) with SAN and proof of possession → CA policy / ACME DNS-01 or HTTP-01 → signed cert + chain.',
      'CA private key is the crown jewel. Compromise means every leaf can be forged until the root is removed from truststores. That is why intermediates exist: revoke an intermediate without rotating the root.',
      'Public CAs (Let’s Encrypt, DigiCert) vs private CAs (internal PKI, AWS PCA, cert-manager + private issuer). Payment platforms usually have both: public for browsers, private for mTLS.',
      'Lab PkiService is a private root that issues leaves in memory. Production uses a real CA, HSM, and an issuance API — never a microservice that holds the root private key in a heap dump.',
    ],
    mermaid: `sequenceDiagram
  participant Leaf as Payment service
  participant CA as Issuing CA
  participant Root as Root CA trust anchor
  Leaf->>Leaf: generate key pair
  Leaf->>CA: CSR CN and SAN
  CA->>CA: policy + proof of name
  CA->>CA: sign TBS with CA private key
  CA-->>Leaf: leaf cert + chain
  Note over Root: Root public key lives in TrustStore
  Note over CA: Intermediate can be revoked without replacing Root`,
    java: `// Lab CA — PkiService constructor
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(2048);
KeyPair root = kpg.generateKeyPair();
X500Name issuer = new X500Name("CN=Vibhu Lab Root CA,O=Vibhu Tech Lab");
JcaX509v3CertificateBuilder ca = new JcaX509v3CertificateBuilder(
    issuer, serial, notBefore, notAfter, issuer, root.getPublic());
ca.addExtension(Extension.basicConstraints, true, new BasicConstraints(true));
ca.addExtension(Extension.keyUsage, true,
    new KeyUsage(KeyUsage.keyCertSign | KeyUsage.cRLSign));
ContentSigner signer = new JcaContentSignerBuilder("SHA256WithRSA").build(root.getPrivate());
X509Certificate rootCert = new JcaX509CertificateConverter().getCertificate(ca.build(signer));`,
    javaTitle: 'Build a lab Root CA — PkiService',
    labClass: 'PkiService',
    pros: ['Central policy: expiry, SAN allowlist, key type, revocation. One place to rotate trust.'],
    cons: ['CA outage or key compromise is a company-wide incident. Issuing CA in an app JVM is a lab shortcut, not a design.'],
    useWhen: 'Any certificate you did not generate as a one-off self-signed toy.',
    avoidWhen: 'Self-signed leaves copied to every truststore “to make TLS work” — that is a key-distribution problem, not PKI.',
    memory: 'CA private key stamps passports. Root stays in the vault. Intermediate does daily work.',
    interview: 'A CA verifies identity and signs certificates. I trust a leaf only if I can build a chain to a trust anchor I installed, then check time, name, usage, and revocation.',
  },
  {
    id: 'trust',
    group: 'building-block',
    name: 'Trust mechanisms',
    famousAs: 'Whose notaries you believe',
    oneLiner:
      'Trust is not “the cert decoded”. It is PKIX chain building to a trust anchor, plus time, name, key usage, and revocation. Disable any one of those and you have encryption without identity.',
    analogy: 'Border control: hologram check (signature), issuing country on the approved list (truststore), not expired, name matches the ticket (SAN), not on the wanted list (CRL/OCSP).',
    internals: [
      'Trust anchor: a root CA certificate in a TrustStore (cacerts, a PKCS12, or a custom KeyStore). Java PKIX walks issuer links until it hits that anchor.',
      'Chain building uses issuer DN + AKI/SKI, not “filename order”. Send the intermediate. Missing intermediate is a classic “works in browser, fails in JVM” bug.',
      'Hostname verification: TLS matches the requested DNS name to SAN dNSName (wildcards have rules). Skipping it (NoopHostnameVerifier, trust-all TrustManager) is how MITM wins.',
      'Revocation: CRL (signed list of serials) or OCSP (live ask the CA). Soft-fail OCSP (“if OCSP is down, allow”) is a known weakness. mTLS meshes often pin SPIFFE IDs and short-lived certs instead of CRL.',
      'Pinning: extra policy that the leaf or SPKI must match a known value. Use sparingly — backup pins and a rotation story or you brick the client.',
    ],
    mermaid: `flowchart TD
  LEAF[Leaf cert] --> CHAIN[Build chain via issuer AKI]
  CHAIN --> ANCHOR{Trust anchor in TrustStore?}
  ANCHOR -->|no| FAIL[Untrusted]
  ANCHOR -->|yes| TIME{Dates valid?}
  TIME --> NAME{SAN matches host?}
  NAME --> USAGE{EKU allows this use?}
  USAGE --> REV{Serial revoked?}
  REV -->|all pass| OK[Trusted identity]
  REV -->|any fail| FAIL`,
    java: `TrustAnchor anchor = new TrustAnchor(rootCert, null);
PKIXParameters params = new PKIXParameters(Set.of(anchor));
params.setRevocationEnabled(false); // lab checks its own CRL set
params.setDate(Date.from(clock.instant()));
CertPath path = CertificateFactory.getInstance("X.509")
    .generateCertPath(List.of(leaf));
CertPathValidator.getInstance("PKIX").validate(path, params);
// then SAN hostname check + serial not in revoked set
// lab: PkiService.validate(pem, expectedHost)`,
    javaTitle: 'PKIX path validation — lab: PkiService.validate',
    labClass: 'PkiService',
    pros: ['A single, standard decision procedure. JVM, browsers, and openssl can agree.'],
    cons: ['Easy to accidentally trust-all in Java clients. Expiry and missing intermediates cause outages that look like “TLS is flaky”.'],
    useWhen: 'Every TLS client, every mTLS server, every partner-cert import.',
    avoidWhen: 'Trusting a cert because it “opened in Notepad” or because openssl x509 -text printed a CN.',
    memory: 'Trust = chain + anchor + time + name + usage + revocation. Six gates.',
    interview: 'I validate PKIX to a trust anchor, then hostname/SAN, key usage, and revocation. A parsed PEM is not a trust decision. I never ship trust-all.',
  },
  {
    id: 'identity',
    group: 'what-it-enables',
    name: 'Establish identity',
    famousAs: 'Who are you?',
    oneLiner:
      'PKI identity is a name in SAN/URI that a CA bound to a key. Hosts use DNS SAN. Workloads use SPIFFE URIs. Users use client certs or, more often, JWT after TLS.',
    analogy: 'The badge photo plus the printed name. TLS checks the name against the door you knocked on.',
    internals: [
      'Server identity: you connected to payments.example; the leaf SAN must include payments.example. CN is legacy. IP SANs exist but DNS is the default.',
      'Client identity (mTLS): the server maps certificate SAN/SPIFFE/DN to a workload principal, then still applies authorization. A cert is authentication, not “this user may refund”.',
      'Human identity: smart cards / mTLS to a gateway, then SSO. Do not put the human’s PAN in the certificate.',
      'Identity proof at issuance: ACME DNS-01, corporate CMDB, Kubernetes service account — the CA’s job. A cert is only as good as that proof.',
    ],
    mermaid: `flowchart LR
  DNS[payments.example] --> SAN[SAN dNSName]
  SVID[spiffe://mesh/payment] --> URI[SAN URI]
  SAN --> LEAF[Leaf cert]
  URI --> LEAF
  LEAF --> TLS[TLS hostname check]
  LEAF --> MTLS[mTLS principal]`,
    java: `IssuedCert issued = pki.issue("CN=payments.example", List.of("payments.example"));
PkiService.ValidateResult ok = pki.validate(issued.certificatePem(), "payments.example");
// ok.trusted() && ok.hostnameOk()

PkiService.ValidateResult mitm = pki.validate(issued.certificatePem(), "evil.example");
// hostnameOk false — this is the check people disable to "fix local HTTPS"`,
    javaTitle: 'SAN is identity — lab: PkiService.issue / validate',
    labClass: 'PkiService',
    pros: ['Stable, rotatable identity independent of IP addresses and shared passwords.'],
    cons: ['Wrong SAN (missing www, wrong cluster DNS) is a Sev-1. Automate issuance from the real name source.'],
    useWhen: 'Every TLS hostname, every mesh workload, every partner that presents a cert.',
    avoidWhen: 'Using CN for hostname checks. Using the same leaf cert on five unrelated hostnames “for convenience”.',
    memory: 'Identity lives in SAN. Trust lives in the CA. Authorization is still your API.',
    interview: 'PKI establishes identity by binding a SAN to a public key. I match the name I intended to call, not the CN a vendor printed.',
  },
  {
    id: 'communication',
    group: 'what-it-enables',
    name: 'Secure communication',
    famousAs: 'The pipe that uses PKI',
    oneLiner:
      'TLS is PKI applied to a socket. The handshake authenticates the server (and optionally the client) then derives AES-GCM keys. After the load balancer, you still need field encryption.',
    analogy: 'Armored truck (TLS/PKI) versus vault (AES-GCM at rest). Both, not either.',
    internals: [
      'TLS 1.3: ClientHello with key_share → ServerHello + certificate + CertificateVerify. Client PKIX-validates the cert, checks SAN, then ECDH+HKDF. App data is AEAD.',
      'The certificate does not encrypt the HTTP body by itself. It authenticates the handshake so the AEAD keys belong to the named server.',
      'Termination: LB presents the cert, then HTTP to pods is plaintext unless you mTLS the mesh or encrypt fields. PKI at the edge ≠ PKI to the database.',
      'Cipher suites and protocol versions are policy on top of PKI. Allow TLS 1.3, refuse old RSA key-transport suites.',
    ],
    mermaid: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: ClientHello + ECDHE share
  S->>C: cert chain + CertificateVerify
  C->>C: PKIX + SAN + time + revocation
  C->>S: derived AES-GCM keys
  Note over C,S: PKI authenticated the pipe
  Note over S: DB and Kafka still need AES-GCM`,
    java: `server:
  ssl:
    enabled: true
    key-store: file:/var/ssl/server.p12
    key-store-password: \${SERVER_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    trust-store: file:/var/ssl/ca.p12
    trust-store-password: \${TRUSTSTORE_PASSWORD}
    client-auth: need   # mTLS

# Hostname verification stays on. No NoopHostnameVerifier.`,
    javaTitle: 'Spring Boot TLS consumes PKI',
    labClass: 'SecurityConfig',
    pros: ['Universal, hardware-accelerated, understood by every interviewer and every firewall team.'],
    cons: ['Cert expiry is an outage class. Termination hides leftover plaintext hops.'],
    useWhen: 'Every network hop you do not fully control — and most that you do.',
    avoidWhen: 'As the only control for PII that lands in logs, warehouses, or support tools.',
    memory: 'TLS = PKI + ECDHE + AES-GCM on the wire. Vault is a different room.',
    interview: 'Secure communication in PKI is TLS: validate the cert, then AEAD. I still AES-GCM PII at rest because TLS ends at the proxy.',
  },
  {
    id: 'authentication',
    group: 'what-it-enables',
    name: 'Authentication',
    famousAs: 'Prove you own the name',
    oneLiner:
      'Server authentication: the server presents a cert and signs the handshake. Client authentication (mTLS): the client does the same. PKI authenticates machines; JWT/OIDC usually authenticates users.',
    analogy: 'The building checks your employee badge (mTLS). The app still checks whether you may open the vault (JWT/RBAC).',
    internals: [
      'Proof of possession: CertificateVerify (TLS 1.3) proves the presenter holds the private key matching the cert. A stolen PEM without the key cannot authenticate.',
      'mTLS client-auth=need rejects connections with no/untrusted client cert. Map SAN/SPIFFE to a principal. Combine with network policies.',
      'User auth: browsers use server PKI (https) then cookies/OIDC. Mutual user certs exist (smart cards) but are rare in payment APIs.',
      'JWT RS256/ES256 is PKI-adjacent: JWKS publishes certs/keys with kid. Validate iss/aud/exp as well as the signature. kid injection against an attacker-supplied JWKS is a classic fail.',
    ],
    mermaid: `flowchart TD
  S[Server cert + CertificateVerify] --> SA[Server authenticated]
  C[Client cert + CertificateVerify] --> CA[Client authenticated mTLS]
  SA --> APP[App still checks JWT scopes]
  CA --> APP`,
    java: `http.x509(x -> x.subjectPrincipalRegex("CN=(.*?)(?:,|$)"))
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/actuator/health").permitAll()
        .anyRequest().authenticated());

// mTLS authenticates the workload.
// Then: SecurityContext principal → tenant → method security.
// A trusted client cert is not a blank check to decrypt every row.`,
    javaTitle: 'mTLS authenticates the caller — then authorize',
    labClass: 'PkiService',
    pros: ['Phishing-resistant for workloads. No shared password to leak in a ticket.'],
    cons: ['Client cert distribution and rotation. Users hate installing certs — keep mTLS for machines.'],
    useWhen: 'Service-to-service, partner APIs, admin planes, Kafka SSL.',
    avoidWhen: 'Replacing app authorization. “They had a cert” is not “they may refund”.',
    memory: 'PKI authenticates. Your API authorizes. JWT is claims; mTLS is the channel identity.',
    interview: 'PKI authentication is proof of possession of the cert private key. mTLS authenticates workloads. I still enforce tenant and scope in the application.',
  },
  {
    id: 'encryption',
    group: 'what-it-enables',
    name: 'Encryption with certificates',
    famousAs: 'Encrypt to the nametag',
    oneLiner:
      'A certificate’s public key is an encryption target. Wrap an AES DEK with RSA-OAEP (or ECDH) so only the private key holder can read the payload. This is hybrid encryption with identity attached.',
    analogy: 'Drop a locked suitcase through the slot printed on the badge. Only the badge owner has the padlock key.',
    internals: [
      'Do not RSA-encrypt the file. Generate AES-256 DEK → AES-GCM payload → RSA-OAEP wrap DEK with cert.getPublicKey(). Store encryptedDek + iv + ciphertext.',
      'S/MIME and XML-Enc are this pattern with more MIME/XML. Partner file drops still use it.',
      'TLS encryption is ephemeral ECDH, not “RSA encrypt the HTTP body with the cert” (that was TLS 1.2 RSA key transport, removed in 1.3).',
      'Lab: POST /api/crypto/pki/encrypt-to-cert with the leaf PEM. Decrypt with the lab-held private key for that serial.',
    ],
    mermaid: `flowchart LR
  CERT[Leaf cert public key] --> OAEP[RSA-OAEP wrap DEK]
  DEK[Random AES-256 DEK] --> GCM[AES-GCM payload]
  OAEP --> WIRE[encryptedDek + ciphertext]
  GCM --> WIRE
  WIRE --> PRIV[Recipient private key]
  PRIV --> OPEN[Unwrap DEK then decrypt]`,
    java: `X509Certificate cert = pki.parsePem(certificatePem);
Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
rsa.init(Cipher.ENCRYPT_MODE, cert.getPublicKey());
byte[] wrappedDek = rsa.doFinal(aesDek.getEncoded());
byte[] blob = aes.encryptBytes(aesDek, plaintext.getBytes(UTF_8));
// lab: PkiService.encryptToCertificate`,
    javaTitle: 'Encrypt to a certificate — lab: PkiService.encryptToCertificate',
    labClass: 'PkiService',
    pros: ['Anyone with the PEM can encrypt to you. You never share a symmetric key with the sender.'],
    cons: ['Lost private key = lost data unless you dual-encrypt or escrow. Cert expiry ≠ DEK expiry — keep keyId/serial with ciphertext.'],
    useWhen: 'Partner file exchange, email-like payloads, “encrypt to this service’s current cert”.',
    avoidWhen: 'Hot path field encryption (use KMS envelope). TLS 1.3 already handles the wire.',
    memory: 'Encrypt to the cert = hybrid encryption + identity. Still AES-GCM for the bytes.',
    interview: 'PKI encryption means wrapping a DEK with the certificate public key. I never RSA the JSON. Serial/keyId stays with the ciphertext so rotation works.',
  },
  {
    id: 'signatures',
    group: 'what-it-enables',
    name: 'Digital signatures',
    famousAs: 'The CA hologram — and yours',
    oneLiner:
      'Two signatures matter. The CA signed the certificate. The subject signs messages with the matching private key. Verifiers use the cert public key after they trust the cert.',
    analogy: 'Notary stamp on the badge (CA). Your handwritten signature on a contract (leaf private key). Check the badge first, then the signature.',
    internals: [
      'Order of operations: validate the cert (trust gates) → verify the application signature with cert.getPublicKey(). Verifying a signature with an untrusted cert is theater.',
      'RSA-PSS or ECDSA for new work. JWT PS256/ES256. XML-DSig and CMS/PKCS#7 for partners.',
      'Code signing and document signing are the same primitive with different EKU and timestamping (TSA).',
      'Lab: PkiService.sign(serial, payload) uses the issued leaf key; verify(certPem, payload, sig) checks the cert then RSA-PSS.',
    ],
    mermaid: `sequenceDiagram
  participant S as Signer
  participant V as Verifier
  S->>S: RSA-PSS sign with leaf private key
  S->>V: payload + signature + cert chain
  V->>V: PKIX + time + name + revocation
  V->>V: verify signature with cert public key
  alt trusted and sig ok
    V-->>V: accept
  else
    V-->>V: reject
  end`,
    java: `String sig = pki.sign(issued.serial(), "pay:42");
boolean ok = pki.verify(issued.certificatePem(), "pay:42", sig);
boolean bad = pki.verify(issued.certificatePem(), "pay:43", sig);
// lab: POST /api/crypto/pki/sign  and  /verify`,
    javaTitle: 'Sign with the cert key — lab: PkiService.sign / verify',
    labClass: 'PkiService',
    pros: ['Public verify, non-repudiation with custody, same cert you already use for TLS.'],
    cons: ['Must ship the chain. Must rotate kid/serial. Stolen private key forges until revocation is actually checked.'],
    useWhen: 'Partner webhooks, JWT, artifacts, documents, CertificateVerify in TLS.',
    avoidWhen: 'HMAC-sized internal callbacks where both sides already share a vault secret.',
    memory: 'First trust the cert. Then verify the signature. Never the reverse.',
    interview: 'Digital signatures in PKI: CA signs the cert; subject signs the payload. I validate the cert before I honor the application signature.',
  },
  {
    id: 'implementation',
    group: 'what-it-enables',
    name: 'Java / Spring implementation',
    famousAs: 'Keystore, truststore, PKIX, lab CA',
    oneLiner:
      'Keystore holds your private key plus certificate chain. Truststore holds CAs you believe. Spring Boot server.ssl.* wires them into Tomcat. The lab CA lets you exercise issuance without openssl.',
    analogy: 'Keystore is your badge printer’s safe. Truststore is the list of governments at the border. Spring is the door that uses both.',
    internals: [
      'PKCS12 is the modern Java keystore type (not JKS). Aliases identify entries. Passwords from a secret manager, never Git.',
      'server.ssl.key-store = identity. server.ssl.trust-store = CAs. client-auth=need for mTLS. RestTemplate/WebClient need a matching SSL bundle (Spring Boot 3.1 ssl bundles).',
      'CertPathValidator PKIX is the programmatic trust API. HostnameVerifier is separate — set both.',
      'Rotation: new alias or new file, overlapping validity, reload SSL bundle or rolling restart, keep old cert until clients drain.',
      'Lab endpoints: issue, validate, sign, verify, encrypt-to-cert, revoke, GET CA PEM. Private keys stay in process memory and are labeled lab-only on issue.',
    ],
    mermaid: `sequenceDiagram
  participant Client
  participant API as PkiController
  participant PKI as PkiService
  participant AES as AesEncryptionService
  Client->>API: POST /api/crypto/pki/issue
  API->>PKI: issue CN + SAN
  PKI-->>Client: serial + cert PEM + lab private PEM
  Client->>API: POST /api/crypto/pki/validate
  PKI->>PKI: PKIX + SAN + CRL
  Client->>API: POST /api/crypto/pki/encrypt-to-cert
  API->>PKI: RSA-OAEP wrap DEK
  PKI->>AES: AES-GCM payload
  Client->>API: POST /api/crypto/pki/sign
  PKI-->>Client: RSA-PSS signature`,
    java: `cd spring-encryption-lab && mvn test

curl -s localhost:8093/api/crypto/pki/ca | jq .subject

curl -s -X POST localhost:8093/api/crypto/pki/issue \\
  -H 'Content-Type: application/json' \\
  -d '{"cn":"CN=payments.example","san":["payments.example"]}'

curl -s -X POST localhost:8093/api/crypto/pki/validate \\
  -H 'Content-Type: application/json' \\
  -d '{"certificatePem":"...","hostname":"payments.example"}'`,
    javaTitle: 'Lab API — PkiController on :8093',
    labClass: 'PkiController',
    pros: ['One mental model from openssl to Spring SSL bundles to CertPathValidator.'],
    cons: ['Reloading certs without downtime needs the right server (Netty SSL bundle vs Tomcat file watch). Test it.'],
    useWhen: 'Every Spring service that speaks HTTPS or verifies partner certs.',
    avoidWhen: 'Generating roots inside the payment JVM in production. Lab only.',
    memory: 'Keystore = me. Truststore = who I believe. PKIX = the checklist. Lab CA = practice.',
    interview: 'I put the private key and chain in a PKCS12 keystore, CAs in a truststore, validate PKIX plus hostname, and automate rotation. The lab CA is for learning issuance, not for prod.',
  },
];
