# google gmail get

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an
`aux4/mock` server, so the command runs against a realistic message resource while
the GET request for a single message (path and `format` query) is asserted with
`aux4 mock verify` and `aux4 mock requests` — without a real mailbox.

## against a local mock API

```beforeAll
aux4 aux4 pkger install aux4/mock
```

```afterAll
aux4 mock stop --port 18972 2>/dev/null
pkill -f "18972" 2>/dev/null
```

```file:google-token.json
{
  "clientId": "test-client",
  "clientSecret": "test-secret",
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
  "tokenUrl": "https://oauth2.googleapis.com/token",
  "scopes": "https://www.googleapis.com/auth/gmail.modify",
  "accessToken": "test-access-token",
  "refreshToken": "test-refresh-token",
  "expiresAt": "2099-12-31T23:59:59Z"
}
```

### should return the message resource for the requested id

```execute
aux4 mock start --port 18972 >/dev/null 2>&1
sleep 1
aux4 mock stub --port 18972 --method GET --path /users/me/messages/{id} --status 200 --body '{"id":"${path.id}","threadId":"18f8a9b0c1d2e3f4","labelIds":["INBOX","IMPORTANT"],"snippet":"Hi there, this is a preview","payload":{"headers":[{"name":"Subject","value":"Weekly update"},{"name":"From","value":"sally@example.com"}]}}' >/dev/null 2>&1
aux4 google gmail get 18abc123 --tokenFile google-token.json --apiUrl http://127.0.0.1:18972/api
```

```expect:partial
"id":"18abc123"
```

### should GET the message resource with the default full format

```execute
aux4 mock verify --port 18972 --method GET --path /users/me/messages/18abc123
```

```expect:partial
verify ok
```

### should request the full format by default

```execute
aux4 mock requests --port 18972 --method GET --path /users/me/messages/18abc123 | aux4 json get --path '$.0.query.format'
```

```expect
"full"
```

### should send a bearer token and no request body

```execute
aux4 mock verify --port 18972 --method GET --path /users/me/messages/18abc123 --header "authorization=Bearer test-access-token"
```

```expect:partial
verify ok
```

### should honor the requested format

```execute
aux4 mock reset --port 18972 --requests >/dev/null 2>&1
aux4 google gmail get 18abc123 --format metadata --tokenFile google-token.json --apiUrl http://127.0.0.1:18972/api >/dev/null 2>&1
aux4 mock requests --port 18972 --method GET --path /users/me/messages/18abc123 | aux4 json get --path '$.0.query.format'
```

```expect
"metadata"
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail get 18abc123 --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18972/api
```

```error:partial
no token found for provider "google"
```
