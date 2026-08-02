# google gmail labels list

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an
`aux4/mock` server, so the command runs against a realistic labels list while the
GET request is asserted with `aux4 mock verify` — without a real mailbox.

## against a local mock API

```beforeAll
aux4 aux4 pkger install aux4/mock
```

```afterAll
aux4 mock stop --port 18974 2>/dev/null
pkill -f "18974" 2>/dev/null
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

### should return the labels from the API

```execute
aux4 mock start --port 18974 >/dev/null 2>&1
sleep 1
aux4 mock stub --port 18974 --method GET --path /users/me/labels --status 200 --body '{"labels":[{"id":"INBOX","name":"INBOX","type":"system"},{"id":"SENT","name":"SENT","type":"system"},{"id":"Label_1","name":"Work","type":"user"}]}' >/dev/null 2>&1
aux4 google gmail labels list --tokenFile google-token.json --apiUrl http://127.0.0.1:18974/api
```

```expect:partial
"name":"Work"
```

### should GET the labels resource with a bearer token

```execute
aux4 mock verify --port 18974 --method GET --path /users/me/labels --header "authorization=Bearer test-access-token"
```

```expect:partial
verify ok
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail labels list --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18974/api
```

```error:partial
no token found for provider "google"
```
