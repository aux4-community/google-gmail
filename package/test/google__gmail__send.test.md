# google gmail send

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an
`aux4/mock` server, so the command runs against a realistic canned response while
the request it built is asserted with `aux4 mock verify` — method, path,
`Authorization` header and the base64url-encoded MIME body — without sending a real
email. The `raw` field carries the MIME message; the tests decode it from the
recorded request to check the RFC 2822 headers `gmail.mjs` produced.

## against a local mock API

```beforeAll
aux4 aux4 pkger install aux4/mock
```

```afterAll
aux4 mock stop --port 18970 2>/dev/null
pkill -f "18970" 2>/dev/null
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

### should return the send API response body

```execute
aux4 mock start --port 18970 >/dev/null 2>&1
sleep 1
aux4 mock stub --port 18970 --method POST --path /users/me/messages/send --status 200 --body '{"id":"18f8a9b0c1d2e3f4","threadId":"18f8a9b0c1d2e3f4","labelIds":["SENT"]}' >/dev/null 2>&1
aux4 google gmail send person@example.com --subject "Hello" --content "Hi there" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api
```

```expect:partial
"labelIds":["SENT"]
```

### should POST to the messages.send endpoint with a bearer token and JSON content type

```execute
aux4 mock verify --port 18970 --method POST --path /users/me/messages/send --header "authorization=Bearer test-access-token" --header "content-type=application/json" --body-contains '"raw"'
```

```expect:partial
verify ok
```

### should encode the To and Subject headers in the MIME message

```execute
aux4 mock reset --port 18970 --requests >/dev/null 2>&1
aux4 google gmail send person@example.com --subject "Weekly update" --content "Hi there" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api >/dev/null 2>&1
B=$(aux4 mock requests --port 18970 --method POST --path /users/me/messages/send | aux4 json get --path '$.0.body' | grep -oE '[A-Za-z0-9_-]{40,}' | tr -- '-_' '+/'); while [ $(( ${#B} % 4 )) -ne 0 ]; do B="${B}="; done; printf '%s' "$B" | base64 -d
```

```expect:partial
To: person@example.com
```

```expect:partial
Subject: Weekly update
```

```expect:partial
Content-Type: text/plain; charset=
```

### should include the From and Cc headers when provided

```execute
aux4 mock reset --port 18970 --requests >/dev/null 2>&1
aux4 google gmail send person@example.com --subject "Hi" --content "Body" --from me@example.com --cc team@example.com --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api >/dev/null 2>&1
B=$(aux4 mock requests --port 18970 --method POST --path /users/me/messages/send | aux4 json get --path '$.0.body' | grep -oE '[A-Za-z0-9_-]{40,}' | tr -- '-_' '+/'); while [ $(( ${#B} % 4 )) -ne 0 ]; do B="${B}="; done; printf '%s' "$B" | base64 -d
```

```expect:partial
From: me@example.com
```

```expect:partial
Cc: team@example.com
```

### should send an HTML message with a text/html content type

```execute
aux4 mock reset --port 18970 --requests >/dev/null 2>&1
aux4 google gmail send person@example.com --subject "Report" --content "<h1>Report</h1>" --html true --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api >/dev/null 2>&1
B=$(aux4 mock requests --port 18970 --method POST --path /users/me/messages/send | aux4 json get --path '$.0.body' | grep -oE '[A-Za-z0-9_-]{40,}' | tr -- '-_' '+/'); while [ $(( ${#B} % 4 )) -ne 0 ]; do B="${B}="; done; printf '%s' "$B" | base64 -d
```

```expect:partial
Content-Type: text/html; charset=
```

```expect:partial
<h1>Report</h1>
```

### should read the body from stdin as HTML when piped with --html

```execute
aux4 mock reset --port 18970 --requests >/dev/null 2>&1
printf '<h1>Piped</h1><p>from a pipe</p>' | aux4 google gmail send person@example.com --subject "Piped" --html true --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api >/dev/null 2>&1
B=$(aux4 mock requests --port 18970 --method POST --path /users/me/messages/send | aux4 json get --path '$.0.body' | grep -oE '[A-Za-z0-9_-]{40,}' | tr -- '-_' '+/'); while [ $(( ${#B} % 4 )) -ne 0 ]; do B="${B}="; done; printf '%s' "$B" | base64 -d
```

```expect:partial
Content-Type: text/html; charset=
```

```expect:partial
<h1>Piped</h1><p>from a pipe</p>
```

### should read the body from stdin as plain text when piped without --html

```execute
aux4 mock reset --port 18970 --requests >/dev/null 2>&1
printf 'plain body from stdin' | aux4 google gmail send person@example.com --subject "Piped text" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api >/dev/null 2>&1
B=$(aux4 mock requests --port 18970 --method POST --path /users/me/messages/send | aux4 json get --path '$.0.body' | grep -oE '[A-Za-z0-9_-]{40,}' | tr -- '-_' '+/'); while [ $(( ${#B} % 4 )) -ne 0 ]; do B="${B}="; done; printf '%s' "$B" | base64 -d
```

```expect:partial
Content-Type: text/plain; charset=
```

```expect:partial
plain body from stdin
```

### should attach the threadId to the request body when replying

```execute
aux4 mock reset --port 18970 --requests >/dev/null 2>&1
aux4 google gmail send person@example.com --subject "Re: Hi" --content "Reply body" --threadId THREAD123 --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api >/dev/null 2>&1
aux4 mock verify --port 18970 --method POST --path /users/me/messages/send --body-contains '"threadId":"THREAD123"'
```

```expect:partial
verify ok
```

### should omit the threadId when it is not provided

```execute
aux4 mock reset --port 18970 --requests >/dev/null 2>&1
aux4 google gmail send person@example.com --subject "Hi" --content "Body" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970/api >/dev/null 2>&1
aux4 mock verify --port 18970 --method POST --path /users/me/messages/send --body-contains 'threadId'
```

```error:partial
missing body substring(s): [threadId]
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail send person@example.com --subject "Hi" --content "Body" --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18970/api
```

```error:partial
no token found for provider "google"
```
