# community/google-gmail

Commands to send, read and manage Gmail messages using the Gmail API

This package provides aux4 command wrappers for the [Gmail API](https://developers.google.com/gmail/api). It covers sending email (plain text or HTML, with CC/BCC and thread replies), listing and reading messages, moving messages to the trash, and listing labels.

Authentication is handled by [community/google-auth](https://hub.aux4.io/package/community/google-auth), which stores a single OAuth2 token shared by every aux4 Google package.

## Installation

```bash
aux4 aux4 pkger install community/google-gmail
```

## Prerequisites

Authenticate once with `community/google-auth`. The scopes are resolved from the installed Google service packages, so no `--scopes` flag is needed:

```bash
aux4 google auth login
```

This package requests `https://www.googleapis.com/auth/gmail.modify`, which allows sending, reading, and managing messages (moving to trash, changing labels). If you only need to read, request the narrower read-only scope instead:

```bash
aux4 google auth login --readonly true
```

That requests `https://www.googleapis.com/auth/gmail.readonly`. Note that `send` and `trash` need the full `gmail.modify` scope and will fail with a read-only token.

Check the current state at any time:

```bash
aux4 google auth status
```

## Quick Start

Send an email:

```bash
aux4 google gmail send person@example.com --subject "Hello" --content "Hi there"
```

List unread messages:

```bash
aux4 google gmail list --query "is:unread" --maxResults 10
```

Read a message:

```bash
aux4 google gmail get 18abc123def456
```

## Sending mail

The body is given with `--content` and defaults to plain text; add `--html true` to send it as HTML.

### Plain text

```bash
aux4 google gmail send person@example.com --subject "Weekly update" --content "Here is the update."
```

### HTML

```bash
aux4 google gmail send person@example.com --subject "Report" --content "<h1>Report</h1><p>See the numbers below.</p>" --html true
```

### Body from stdin

If you omit `--content`, the body is read from **stdin** — so you can pipe a file straight in. It's plain text by default; add `--html true` to send the piped content as HTML:

```bash
cat body.txt   | aux4 google gmail send person@example.com --subject "Notes"
cat email.html | aux4 google gmail send list@example.com --subject "This week" --html true
```

### CC and BCC

`--cc` and `--bcc` accept a comma-separated list of addresses:

```bash
aux4 google gmail send person@example.com --subject "Kickoff" --content "See you Monday" --cc team@example.com --bcc archive@example.com
```

### Replying within a thread

Pass the `--threadId` of the conversation so the message is attached to it instead of starting a new thread:

```bash
aux4 google gmail send person@example.com --subject "Re: Weekly update" --content "Thanks!" --threadId 18abc123def456
```

The `--from` header is optional — Gmail uses the authenticated account when it is omitted.

## Listing messages

List returns message IDs and thread IDs. Filter with a Gmail search query, by labels, or cap the count:

```bash
aux4 google gmail list --query "from:billing@example.com has:attachment"
aux4 google gmail list --labelIds INBOX,UNREAD
aux4 google gmail list --maxResults 25
```

The `--query` flag accepts the same syntax as the Gmail search box: `is:unread`, `from:`, `to:`, `subject:`, `has:attachment`, `after:2026/01/01`, and so on.

## Reading a message

```bash
aux4 google gmail get 18abc123def456
```

Use `--format` to control how much is returned — `full` (default), `metadata` (headers only), `minimal` (IDs and labels only), or `raw` (the base64url-encoded RFC 2822 source):

```bash
aux4 google gmail get 18abc123def456 --format metadata
```

## Moving messages to the Bin

```bash
aux4 google gmail trash --id 18abc123def456
```

Trash several at once (one `batchModify` call) — pass `--id` per message:

```bash
aux4 google gmail trash --id 18abc123def456 --id 19def456abc789 --yes true
```

Messages are moved to the Bin, **not** permanently deleted — Gmail removes them automatically after 30 days, and they can be restored until then. `trash` asks for confirmation first; pass `--yes true` to skip the prompt in scripts.

There is deliberately no permanent-delete command: it would require the full `https://mail.google.com/` scope, which this package does not request. The strongest destructive action available is a reversible move to the Bin.

## Labels

List every label (system and custom) with its ID:

```bash
aux4 google gmail labels list
```

Show the labels as a table:

```bash
aux4 google gmail labels list | aux4 json get --path '$.labels' | aux4 2table --table id,name,type
```

Use the label IDs with `list --labelIds` to filter messages.

## Environment Variables

- `AUX4_GOOGLE_TOKEN_FILE` — where the shared Google OAuth token lives. Defaults to `~/.aux4.config/.oauth/google.json`, the same location `aux4 google auth login` writes to, so it normally needs no setting.

For the optional `integration` test group, set `GMAIL_TEST_TO` to an address the authenticated account may email.

## License

MIT — See [LICENSE](./LICENSE) for details.
