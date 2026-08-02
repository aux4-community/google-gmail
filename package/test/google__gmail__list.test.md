# google gmail list

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an
`aux4/mock` server, so the command runs against a realistic message list while the
GET request and its query parameters are asserted with `aux4 mock verify` and
`aux4 mock requests` — without a real mailbox.

## against a local mock API

```beforeAll
aux4 aux4 pkger install aux4/mock
```

```afterAll
aux4 mock stop --port 18971 2>/dev/null
pkill -f "18971" 2>/dev/null
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

### should return the messages list from the API

```execute
aux4 mock start --port 18971 >/dev/null 2>&1
sleep 1
aux4 mock stub --port 18971 --method GET --path /users/me/messages --status 200 --body '{"messages":[{"id":"18f8a9b0c1d2e3f4","threadId":"18f8a9b0c1d2e3f4"},{"id":"18f8a9b0c1d2e3aa","threadId":"18f8a9b0c1d2e3aa"}],"nextPageToken":"09876543210","resultSizeEstimate":2}' >/dev/null 2>&1
aux4 google gmail list --tokenFile google-token.json --apiUrl http://127.0.0.1:18971/api
```

```expect:partial
"resultSizeEstimate":2
```

### should GET the messages resource with a bearer token and no request body

```execute
aux4 mock verify --port 18971 --method GET --path /users/me/messages --header "authorization=Bearer test-access-token"
```

```expect:partial
verify ok
```

### should send no query parameters when no filters are given

```execute
aux4 mock requests --port 18971 --method GET --path /users/me/messages | aux4 json get --path '$.0.query'
```

```error:partial
field 'query' not found
```

### should send the filters as decoded query parameters

```execute
aux4 mock reset --port 18971 --requests >/dev/null 2>&1
aux4 google gmail list --query "is:unread from:a@b.com" --maxResults 5 --labelIds INBOX,UNREAD --tokenFile google-token.json --apiUrl http://127.0.0.1:18971/api >/dev/null 2>&1
aux4 mock requests --port 18971 --method GET --path /users/me/messages | aux4 json get --path '$.0.query.q'
```

```expect
"is:unread from:a@b.com"
```

### should pass maxResults through as a query parameter

```execute
aux4 mock requests --port 18971 --method GET --path /users/me/messages | aux4 json get --path '$.0.query.maxResults'
```

```expect
"5"
```

### should pass labelIds through as a query parameter

```execute
aux4 mock requests --port 18971 --method GET --path /users/me/messages | aux4 json get --path '$.0.query.labelIds'
```

```expect
"UNREAD"
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail list --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18971/api
```

```error:partial
no token found for provider "google"
```
