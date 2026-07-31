# google gmail list

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by a local
echo server so the GET request and its query string can be asserted without a real
mailbox.

## against a local mock API

```beforeAll
nohup node mock-echo.js 18971 >/dev/null 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:18971/ 2>/dev/null && break; sleep 0.25; done
```

```afterAll
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

### should GET the messages resource with a bearer token

```execute
aux4 google gmail list --tokenFile google-token.json --apiUrl http://127.0.0.1:18971
```

```expect:partial
"method": "GET"
```

```expect:partial
"authorization": "Bearer test-access-token"
```

### should request no query string when no filters are given

```execute
aux4 google gmail list --tokenFile google-token.json --apiUrl http://127.0.0.1:18971 | aux4 json get --path '$.path'
```

```expect
"/users/me/messages"
```

### should url-encode the query and append maxResults and labelIds

```execute
aux4 google gmail list --query "is:unread from:a@b.com" --maxResults 5 --labelIds INBOX,UNREAD --tokenFile google-token.json --apiUrl http://127.0.0.1:18971 | aux4 json get --path '$.path'
```

```expect
"/users/me/messages?q=is%3Aunread%20from%3Aa%40b.com&maxResults=5&labelIds=INBOX&labelIds=UNREAD"
```

### should send an empty request body

```execute
aux4 google gmail list --tokenFile google-token.json --apiUrl http://127.0.0.1:18971 | aux4 json get --path '$.body'
```

```expect
null
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail list --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18971
```

```error:partial
no token found for provider "google"
```
