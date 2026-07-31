# google gmail labels list

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by a local
echo server so the labels request can be asserted without a real mailbox.

## against a local mock API

```beforeAll
nohup node mock-echo.js 18974 >/dev/null 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:18974/ 2>/dev/null && break; sleep 0.25; done
```

```afterAll
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

### should GET the labels resource with a bearer token

```execute
aux4 google gmail labels list --tokenFile google-token.json --apiUrl http://127.0.0.1:18974
```

```expect:partial
"method": "GET"
```

```expect:partial
"path": "/users/me/labels"
```

```expect:partial
"authorization": "Bearer test-access-token"
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail labels list --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18974
```

```error:partial
no token found for provider "google"
```
