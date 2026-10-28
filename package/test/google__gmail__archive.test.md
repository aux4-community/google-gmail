# google gmail archive

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an
`aux4/mock` server, so the request is asserted without touching a real mailbox.
Archiving removes the `INBOX` label with `users.messages.batchModify`; it does
not add the `TRASH` label.

## against a local mock API

```beforeAll
aux4 aux4 pkger install aux4/mock
```

```afterAll
aux4 mock stop --port 18974
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

### should archive messages by removing INBOX

```timeout
30000
```

```execute
aux4 mock start --port 18974 && sleep 1 && printf '' | aux4 mock stub --port 18974 --method POST --path /users/me/messages/batchModify --status 204 && aux4 google gmail archive --id 18abc123 --tokenFile google-token.json --apiUrl http://127.0.0.1:18974/api
```

```expect:partial
Archived
```

### should POST one archive request with both IDs and the INBOX removal

```execute
aux4 mock reset --port 18974 --requests && aux4 google gmail archive --id 18abc123 --id 29def456 --tokenFile google-token.json --apiUrl http://127.0.0.1:18974/api && aux4 mock verify --port 18974 --method POST --path /users/me/messages/batchModify --header "authorization=Bearer test-access-token" --body-contains '18abc123' --body-contains '29def456' --body-contains '"removeLabelIds":["INBOX"]'
```

```expect:partial
verify ok
```

## validation

### should require at least one message ID

```execute
aux4 google gmail archive --tokenFile google-token.json --apiUrl http://127.0.0.1:18974/api
```

```error:partial
archive: at least one message id is required
```

### should report a missing Google token

```execute
aux4 google gmail archive --id 18abc123 --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18974/api
```

```error:partial
no token found for provider "google"
```
