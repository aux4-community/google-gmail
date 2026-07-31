# google gmail command injection

Part of the `core` group in `test.suite.md`. Regression test for the command-injection
vector in `google gmail list`: the `--query` flag flows into a `jq` query-string
builder that previously interpolated the raw value into a shell command
(`Q='${query}' ... jq ...`). The value is now passed through `value()`, which
shell-escapes it, so a query crafted to break out of the quotes is treated as
literal text (and safely url-encoded into the request) instead of being executed.

## query flag cannot inject shell commands

```beforeAll
rm -f /tmp/AUX4_INJ_gmail
```

```afterAll
rm -f /tmp/AUX4_INJ_gmail
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

### should treat an injected --query as literal text, not a shell command

```execute
aux4 google gmail list --query "x'; touch /tmp/AUX4_INJ_gmail; echo '" --apiUrl http://127.0.0.1:1 --tokenFile google-token.json </dev/null
```

```error:partial
Error: Get "http://127.0.0.1:1/users/me/messages?q=x
```

### should not have executed the injected command

```execute
test -f /tmp/AUX4_INJ_gmail && echo VULNERABLE || echo SAFE
```

```expect
SAFE
```
