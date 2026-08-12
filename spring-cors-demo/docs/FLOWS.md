# CORS flows

## Simple GET (public)

1. `GET /api/public/ping` + `Origin: http://localhost:5500`
2. Response includes `Access-Control-Allow-Origin: http://localhost:5500`
3. JS can read JSON

## Preflight + credentialed POST

1. Browser sends `OPTIONS /api/transfers` with `Access-Control-Request-Method: POST`
2. Server returns allow methods/headers/origin + `Allow-Credentials: true`
3. Browser sends real `POST` with `Authorization` + JSON body
4. JS reads `ACCEPTED`

## Blocked origin

1. `Origin: http://evil.example`
2. Spring `CorsFilter` rejects with **403 Invalid CORS request**
3. No `Access-Control-Allow-Origin` — JS cannot proceed
