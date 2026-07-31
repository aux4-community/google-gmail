# google gmail send

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by a local
echo server (`mock-echo.js`), so the test asserts the request aux4 builds — method,
path, `Authorization` header and the base64url-encoded MIME body — without sending a
real email. The mock decodes the `raw` field back to text as `decodedRaw` so the
RFC 2822 headers can be checked.

## against a local mock API

```beforeAll
nohup node mock-echo.js 18970 >/dev/null 2>&1 &
for i in $(seq 1 40); do curl -s -o /dev/null http://127.0.0.1:18970/ 2>/dev/null && break; sleep 0.25; done
```

```afterAll
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

### should POST to the messages.send endpoint with a bearer token

```execute
aux4 google gmail send person@example.com --subject "Hello" --content "Hi there" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970
```

```expect:partial
"method": "POST"
```

```expect:partial
"path": "/users/me/messages/send"
```

```expect:partial
"authorization": "Bearer test-access-token"
```

```expect:partial
"contentType": "application/json"
```

### should encode the To and Subject headers in the MIME message

```execute
aux4 google gmail send person@example.com --subject "Weekly update" --content "Hi there" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970 | aux4 json get --path '$.decodedRaw'
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

### should include the From header when provided

```execute
aux4 google gmail send person@example.com --subject "Hi" --content "Body" --from me@example.com --cc team@example.com --tokenFile google-token.json --apiUrl http://127.0.0.1:18970 | aux4 json get --path '$.decodedRaw'
```

```expect:partial
From: me@example.com
```

```expect:partial
Cc: team@example.com
```

### should send an HTML message with a text/html content type

```execute
aux4 google gmail send person@example.com --subject "Report" --content "<h1>Report</h1>" --html true --tokenFile google-token.json --apiUrl http://127.0.0.1:18970 | aux4 json get --path '$.decodedRaw'
```

```expect:partial
Content-Type: text/html; charset=
```

```expect:partial
<h1>Report</h1>
```

### should read the body from stdin as HTML when piped with --html

```execute
printf '<h1>Piped</h1><p>from a pipe</p>' | aux4 google gmail send person@example.com --subject "Piped" --html true --tokenFile google-token.json --apiUrl http://127.0.0.1:18970 | aux4 json get --path '$.decodedRaw'
```

```expect:partial
Content-Type: text/html; charset=
```

```expect:partial
<h1>Piped</h1><p>from a pipe</p>
```

### should read the body from stdin as plain text when piped without --html

```execute
printf 'plain body from stdin' | aux4 google gmail send person@example.com --subject "Piped text" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970 | aux4 json get --path '$.decodedRaw'
```

```expect:partial
Content-Type: text/plain; charset=
```

```expect:partial
plain body from stdin
```

### should attach the threadId to the request body when replying

```execute
aux4 google gmail send person@example.com --subject "Re: Hi" --content "Reply body" --threadId THREAD123 --tokenFile google-token.json --apiUrl http://127.0.0.1:18970 | aux4 json get --path '$.body.threadId'
```

```expect
"THREAD123"
```

### should omit the threadId when it is not provided

```execute
aux4 google gmail send person@example.com --subject "Hi" --content "Body" --tokenFile google-token.json --apiUrl http://127.0.0.1:18970 | aux4 json get --path '$.body.threadId'
```

```error:partial
field 'threadId' not found
```

## without a stored token

### should report that the google provider has no token

```execute
aux4 google gmail send person@example.com --subject "Hi" --content "Body" --tokenFile ./no-such-directory/google.json --apiUrl http://127.0.0.1:18970
```

```error:partial
no token found for provider "google"
```
