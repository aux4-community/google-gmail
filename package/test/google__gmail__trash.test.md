# google gmail trash

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an
`aux4/mock` server, so the trash request is asserted with `aux4 mock verify`
without touching a real mailbox. `trash` moves one or more messages to the Bin via
`users.messages.batchModify` (adding the `TRASH` label — reversible), guarded by a
`confirm:` prompt that `--yes` bypasses.

## against a local mock API

```beforeAll
aux4 aux4 pkger install aux4/mock
```

```afterAll
aux4 mock stop --port 18973 2>/dev/null
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

### should confirm the messages were moved to Trash

```execute
aux4 mock start --port 18973 >/dev/null 2>&1
sleep 1
printf '' | aux4 mock stub --port 18973 --method POST --path /users/me/messages/batchModify --status 204 >/dev/null 2>&1
aux4 google gmail trash --id 18abc123 --yes true --tokenFile google-token.json --apiUrl http://127.0.0.1:18973/api
```

```expect:partial
Trash
```

### should POST a single message to batchModify with the TRASH label and a bearer token

```execute
aux4 mock verify --port 18973 --method POST --path /users/me/messages/batchModify --header "authorization=Bearer test-access-token" --body-contains '18abc123' --body-contains '"addLabelIds":["TRASH"]'
```

```expect:partial
verify ok
```

### should trash multiple messages in one batchModify call

```execute
aux4 mock reset --port 18973 --requests >/dev/null 2>&1
aux4 google gmail trash --id 18abc123 --id 29def456 --yes true --tokenFile google-token.json --apiUrl http://127.0.0.1:18973/api >/dev/null 2>&1
aux4 mock verify --port 18973 --method POST --path /users/me/messages/batchModify --body-contains '18abc123' --body-contains '29def456'
```

```expect:partial
verify ok
```

## confirmation guard

### should abort without --yes and never call the API

```execute
aux4 mock reset --port 18973 --requests >/dev/null 2>&1
aux4 google gmail trash --id 18abc123 --tokenFile google-token.json --apiUrl http://127.0.0.1:18973/api </dev/null
```

```error:partial
User aborted
```

### should not have recorded any batchModify request after aborting

```execute
aux4 mock verify --port 18973 --method POST --path /users/me/messages/batchModify
```

```error:partial
verify failed
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail trash --id 18abc123 --yes true --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18973/api
```

```error:partial
no token found for provider "google"
```
