# Spring Security CORS Demo

End-to-end CORS lab for the Spring Security hub.

## Architecture

```text
Browser page at http://localhost:5500
        │  fetch() with Origin header
        ▼
API at http://localhost:8091  (Spring Security + CorsConfigurationSource)
```

Different scheme/host/port = different origin → browser enforces CORS.

## Run API

```bash
cd spring-cors-demo
mvn test
mvn spring-boot:run
```

API lab: http://localhost:8091

## Run frontend (second origin)

```bash
cd spring-cors-demo/frontend
python3 -m http.server 5500
```

Open http://localhost:5500 — try Public / Me / Transfer buttons.

## Interview punchline

> CORS is a browser policy. Spring only advertises which origins may read responses. It is not an authZ substitute. `Allow-Origin: *` cannot be combined with `Allow-Credentials: true`.
