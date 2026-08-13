# Spring Web Attacks Lab — XSS · SQL Injection · DDoS defenses

Educational Spring Boot lab (port **8093**):

| Topic | Bad | Safe / defense |
|---|---|---|
| **XSS** | `/xss/bad?name=…` reflects raw HTML | `/xss/good` Thymeleaf-escaped · `/xss/api/good` encoded JSON |
| **SQL injection** | `/sqli/bad?q=…` string-concat SQL | `/sqli/good?q=…` `PreparedStatement` |
| **DDoS (app layer)** | — | `/ddos/ping` IP rate limit → **429** |

This lab teaches **defense**. It does not include attack tooling.

```bash
cd spring-web-attacks-demo
mvn test
mvn spring-boot:run
```

Open http://127.0.0.1:8093/
