#### Description

The `get` command retrieves a single message by its ID from the mailbox of the authenticated account. The ID comes from the `list` command or from a previous `get` response.

The `--format` flag controls how much of the message is returned:

- **full** — the parsed message headers and body (default)
- **metadata** — headers only, no body
- **minimal** — only IDs and labels, no headers or body
- **raw** — the entire message as a base64url-encoded RFC 2822 string

#### Usage

```bash
aux4 google gmail get <messageId> [--format <full|metadata|minimal|raw>] [--tokenFile <path>]
```

messageId    The message ID to retrieve (required)
--format     Response format: full, metadata, minimal or raw (default: full)
--tokenFile  Where the shared Google OAuth token is stored (default: `~/.aux4.config/.oauth/google.json`, env `AUX4_GOOGLE_TOKEN_FILE`)

#### Example

```bash
aux4 google gmail get 18abc123def456
```

```text
{
  "id": "18abc123def456",
  "threadId": "18abc123def456",
  "labelIds": ["INBOX", "UNREAD"],
  "snippet": "Here is the update...",
  "payload": {
    "headers": [
      {"name": "From", "value": "person@example.com"},
      {"name": "Subject", "value": "Weekly update"}
    ]
  }
}
```

Fetch only the headers:

```bash
aux4 google gmail get 18abc123def456 --format metadata
```
