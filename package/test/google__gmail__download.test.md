# google gmail download

Part of the `core` group in `test.suite.md`. The Gmail API is replaced by an `aux4/mock`
server returning an attachment resource.

The API hands back attachment bytes base64url-encoded inside JSON. This command decodes them
and writes the real file, so a caller ends up with a usable PDF rather than a wrapper it has
to unpack itself.

```afterAll
aux4 mock stop --port 18976 2>/dev/null
pkill -f "18976" 2>/dev/null
rm -f invoice.pdf empty.bin
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

### should write the attachment and report the path

`JVBERi0xLjQgZmFrZSBpbnZvaWNlIGJ5dGVz` is `%PDF-1.4 fake invoice bytes`.

```execute
aux4 mock start --port 18976 >/dev/null 2>&1
sleep 1
aux4 mock stub --port 18976 --method GET --path '/users/me/messages/{id}/attachments/{attId}' --status 200 --body '{"size":27,"data":"JVBERi0xLjQgZmFrZSBpbnZvaWNlIGJ5dGVz"}' >/dev/null
aux4 google gmail download m2 --attachmentId att-77 --output invoice.pdf --tokenFile google-token.json --apiUrl http://127.0.0.1:18976/api
```

```expect
invoice.pdf
```

### should write the decoded bytes, not the base64

```execute
cat invoice.pdf
```

```expect
%PDF-1.4 fake invoice bytes
```

### should GET the attachment endpoint for the requested ids

```execute
aux4 mock verify --port 18976 --method GET --path /users/me/messages/m2/attachments/att-77
```

```expect:partial
verify ok
```

### should fail clearly when the attachment carries no data

```execute
aux4 mock stub --port 18976 --method GET --path '/users/me/messages/{id}/attachments/{attId}' --status 200 --body '{"size":0}' >/dev/null
aux4 google gmail download m2 --attachmentId att-empty --output empty.bin --tokenFile google-token.json --apiUrl http://127.0.0.1:18976/api
```

```error:partial
the attachment has no data
```
