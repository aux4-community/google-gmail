# google gmail trash

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by a local
echo server so the trash request can be asserted without touching a real mailbox.
`trash` moves one or more messages to the Bin via `users.messages.batchModify`
(adding the `TRASH` label — reversible), guarded by a `confirm:` prompt that
`--yes` bypasses.

## against a local mock API

```beforeAll
nohup node mock-echo.js 18973 >/dev/null 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:18973/ 2>/dev/null && break; sleep 0.25; done
```

```afterAll
pkill -f "18973" 2>/dev/null
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

### should POST a single message to batchModify with the TRASH label

```execute
aux4 google gmail trash --id 18abc123 --yes true --tokenFile google-token.json --apiUrl http://127.0.0.1:18973
```

```expect:partial
"method": "POST"
```

```expect:partial
"path": "/users/me/messages/batchModify"
```

```expect:partial
"authorization": "Bearer test-access-token"
```

```expect:partial
"18abc123"
```

```expect:partial
"TRASH"
```

### should trash multiple messages in one batchModify call

```execute
aux4 google gmail trash --id 18abc123 --id 29def456 --yes true --tokenFile google-token.json --apiUrl http://127.0.0.1:18973
```

```expect:partial
"path": "/users/me/messages/batchModify"
```

```expect:partial
"18abc123"
```

```expect:partial
"29def456"
```

## confirmation guard

### should abort without --yes and never call the API

```execute
aux4 google gmail trash --id 18abc123 --tokenFile google-token.json --apiUrl http://127.0.0.1:18973 </dev/null
```

```error:partial
User aborted
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail trash --id 18abc123 --yes true --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18973
```

```error:partial
no token found for provider "google"
```
