#### Description

The `trash` command moves one or more messages to the Bin in the mailbox of the authenticated account. Messages are **not** permanently deleted — they stay in the Bin and Gmail removes them automatically after 30 days, or you can restore them from the Gmail interface (or by removing the `TRASH` label).

Under the hood it calls `users.messages.batchModify`, adding the `TRASH` label to every given message in a single request. This is reversible and stays within the `gmail.modify` scope. There is deliberately **no permanent-delete command**: permanent `messages.delete` requires the full `https://mail.google.com/` scope, which this package does not request.

Because it is destructive-ish, `trash` asks for confirmation. Pass `--yes true` to skip the prompt (for scripts and agents).

Message IDs come from the `list` command or from a previous `get` response.

#### Usage

```bash
aux4 google gmail trash --id <messageId> [--id <messageId> ...] [--yes true] [--tokenFile <path>]
```

--id         Message ID to move to the Bin (required, repeatable — pass `--id` once per message)
--yes        Skip the confirmation prompt
--tokenFile  Where the shared Google OAuth token is stored (default: `~/.aux4.config/.oauth/google.json`, env `AUX4_GOOGLE_TOKEN_FILE`)

#### Examples

Trash a single message (prompts for confirmation):

```bash
aux4 google gmail trash --id 18abc123def456
```

Trash several messages at once, without the prompt:

```bash
aux4 google gmail trash --id 18abc123def456 --id 19def456abc789 --yes true
```
