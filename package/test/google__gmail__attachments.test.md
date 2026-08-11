# google gmail attachments

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an `aux4/mock`
server serving a realistic multipart message: a text part and a PDF attachment.

Attachments are not returned with the message — the API gives back an `attachmentId` per
part, which has to be fetched separately. This command surfaces those ids, along with the
filename and size a caller chooses by, so `gmail download` has something to work from.

```afterAll
aux4 mock stop --port 18975 2>/dev/null
pkill -f "18975" 2>/dev/null
true
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

## against a local mock API

### should list the attachments on a message

The `text/plain` part carries no filename, so it is not an attachment; the PDF is.

```execute
aux4 mock start --port 18975 >/dev/null 2>&1
sleep 1
aux4 mock stub --port 18975 --method GET --path '/users/me/messages/{id}' --status 200 --body '{"id":"${path.id}","payload":{"mimeType":"multipart/mixed","parts":[{"mimeType":"text/plain","body":{"data":"SW52b2ljZSBhdHRhY2hlZC4"}},{"mimeType":"application/pdf","filename":"invoice.pdf","body":{"attachmentId":"att-77","size":26}}]}}' >/dev/null
aux4 google gmail attachments m2 --tokenFile google-token.json --apiUrl http://127.0.0.1:18975/api
```

```expect
[{"filename":"invoice.pdf","attachmentId":"att-77","mimeType":"application/pdf","size":26}]
```

### should request the full format, since attachment ids only appear there

```execute
aux4 mock requests --port 18975 --method GET --path /users/me/messages/m2 | aux4 json get --path '$.0.query.format'
```

```expect
"full"
```

### should return an empty list when a message has no attachments

```execute
aux4 mock stub --port 18975 --method GET --path '/users/me/messages/{id}' --status 200 --body '{"id":"${path.id}","payload":{"mimeType":"text/plain","body":{"data":"SGVsbG8"}}}' >/dev/null
aux4 google gmail attachments m3 --tokenFile google-token.json --apiUrl http://127.0.0.1:18975/api
```

```expect
[]
```

### should find an attachment nested inside a sub-part

A message with both an alternative body and a file nests one multipart inside another.

```execute
aux4 mock stub --port 18975 --method GET --path '/users/me/messages/{id}' --status 200 --body '{"id":"${path.id}","payload":{"mimeType":"multipart/mixed","parts":[{"mimeType":"multipart/alternative","parts":[{"mimeType":"text/plain","body":{"data":"SGVsbG8"}}]},{"mimeType":"image/png","filename":"chart.png","body":{"attachmentId":"att-99","size":12}}]}}' >/dev/null
aux4 google gmail attachments m4 --tokenFile google-token.json --apiUrl http://127.0.0.1:18975/api
```

```expect
[{"filename":"chart.png","attachmentId":"att-99","mimeType":"image/png","size":12}]
```
