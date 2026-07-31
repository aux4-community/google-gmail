#### Description

The `list` command returns messages from the mailbox of the authenticated account. It calls the `messages.list` endpoint and returns message IDs and thread IDs. Use `get` to fetch the full content of a message.

Results can be narrowed with `--query`, which accepts the same search syntax as the Gmail search box (for example `is:unread`, `from:person@example.com`, `subject:invoice`, `has:attachment`, `after:2026/01/01`). The `--labelIds` flag restricts results to messages carrying every listed label, and `--maxResults` caps how many are returned. All three filters are optional and can be combined.

#### Usage

```bash
aux4 google gmail list [--query <search>] [--maxResults <n>] [--labelIds <ids>] [--tokenFile <path>]
```

--query      Gmail search query (e.g. `is:unread from:person@example.com`)
--maxResults Maximum number of messages to return
--labelIds   Comma-separated label IDs to filter by (e.g. `INBOX,UNREAD`)
--tokenFile  Where the shared Google OAuth token is stored (default: `~/.aux4.config/.oauth/google.json`, env `AUX4_GOOGLE_TOKEN_FILE`)

#### Example

```bash
aux4 google gmail list --query "is:unread" --maxResults 10
```

```text
{
  "messages": [
    {"id": "18abc123", "threadId": "18abc123"},
    {"id": "18abc124", "threadId": "18abc120"}
  ],
  "resultSizeEstimate": 2
}
```

List unread messages in the inbox:

```bash
aux4 google gmail list --labelIds INBOX,UNREAD
```

Extract just the message IDs:

```bash
aux4 google gmail list --query "from:billing@example.com" | aux4 json get --path '$.messages'
```
