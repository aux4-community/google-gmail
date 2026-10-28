#### Description

The `archive` command removes the `INBOX` label from one or more Gmail messages. The messages remain in the mailbox and can be returned to the inbox later. It uses one `users.messages.batchModify` request for all supplied IDs and does not move messages to Trash.

Message IDs come from the `list` command or a previous `get` response. Archiving requires the `gmail.modify` scope.

#### Usage

```bash
aux4 google gmail archive --id <messageId> [--id <messageId> ...] [--tokenFile <path>]
```

--id         Message ID to archive (required, repeatable)
--tokenFile  Where the shared Google OAuth token is stored (default: `~/.aux4.config/.oauth/google.json`, env `AUX4_GOOGLE_TOKEN_FILE`)

#### Example

Archive two messages in one request:

```bash
aux4 google gmail archive --id 18abc123def456 --id 19def456abc789
```

```text
Archived the selected message(s) from the inbox.
```
