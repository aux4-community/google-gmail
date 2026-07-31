#### Description

The `google gmail` command group provides access to a Gmail mailbox through the Gmail API. Every request is signed with the shared Google OAuth2 token that `community/google-auth` maintains, so there is nothing to configure beyond a single login.

Available subcommands:

- **send** — Send an email message
- **list** — List messages in the mailbox, optionally filtered by a search query or labels
- **get** — Retrieve a single message by ID
- **trash** — Move a message to the trash
- **labels list** — List all labels in the mailbox

#### Prerequisites

Authenticate once before first use. Scopes are resolved from the installed Google service packages, so no `--scopes` flag is required:

```bash
aux4 google auth login
```

This package requests `https://www.googleapis.com/auth/gmail.modify`, which is enough to send, read, and manage messages. Add `--readonly true` to request `https://www.googleapis.com/auth/gmail.readonly` instead when you only need to read.

The token is read from `~/.aux4.config/.oauth/google.json`. Override it per command with `--tokenFile`, or for the whole shell with the `AUX4_GOOGLE_TOKEN_FILE` environment variable.

#### Usage

```bash
aux4 google gmail <subcommand>
```

#### Example

```bash
aux4 google gmail send person@example.com --subject "Hello" --text "Hi there"
aux4 google gmail list --query "is:unread" --maxResults 10
aux4 google gmail get 18abc123def456
aux4 google gmail trash 18abc123def456
aux4 google gmail labels list
```
