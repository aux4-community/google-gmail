# community/google-gmail

Commands to send, read and manage Gmail messages using the Gmail API

This package provides aux4 command wrappers for the [Gmail API](https://developers.google.com/gmail/api). It covers sending email (plain text or HTML, with CC/BCC and thread replies), listing and reading messages, archiving or moving messages to the trash, and listing labels.

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

This package requests `https://www.googleapis.com/auth/gmail.modify`, which allows sending, reading, and managing messages (archiving, moving to trash, changing labels). If you only need to read, request the narrower read-only scope instead:

```bash
aux4 google auth login --readonly true
```

That requests `https://www.googleapis.com/auth/gmail.readonly`. Note that `send`, `archive`, and `trash` need the full `gmail.modify` scope and will fail with a read-only token.

Check the current state at any time:

```bash
aux4 google auth status
```

## Quick Start

Send an email:

```bash
aux4 google gmail send person@example.com --subject "Hello" --body "Hi there"
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

The body is given with `--body` and defaults to plain text; add `--html true` to send it as HTML.

### Plain text

```bash
aux4 google gmail send person@example.com --subject "Weekly update" --body "Here is the update."
```

### HTML

```bash
aux4 google gmail send person@example.com --subject "Report" --body "<h1>Report</h1><p>See the numbers below.</p>" --html true
```

### Body from stdin

If you omit `--body`, the body is read from **stdin** — so you can pipe a file straight in. It's plain text by default; add `--html true` to send the piped content as HTML:

```bash
cat body.txt   | aux4 google gmail send person@example.com --subject "Notes"
cat email.html | aux4 google gmail send list@example.com --subject "This week" --html true
```

### CC and BCC

`--cc` and `--bcc` accept a comma-separated list of addresses:

```bash
aux4 google gmail send person@example.com --subject "Kickoff" --body "See you Monday" --cc team@example.com --bcc archive@example.com
```

### Replying within a thread

Pass the `--threadId` of the conversation so the message is attached to it instead of starting a new thread:

```bash
aux4 google gmail send person@example.com --subject "Re: Weekly update" --body "Thanks!" --threadId 18abc123def456
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

### The message text

Gmail returns message bodies base64url-encoded inside `payload`, and the API has no "just give me
the text" mode. `get` decodes it for you: the message comes back with a top-level `text` field
holding the body, and every text part carries its decoded content alongside the raw data.

```bash
aux4 google gmail get 18abc123def456 | aux4 json get --path '$.text'
```

```text
"Hi -- can we meet on 12 March at 14:00 to go through the Q3 budget?"
```

The original `payload` is left untouched, so anything already reading `body.data` keeps working.
On a multipart message the top-level `text` is the `text/plain` part, falling back to `text/html`.

## Attachments

Attachment bytes do not come with the message — Gmail returns an id per attached part, which is
fetched separately. List what is attached first:

```bash
aux4 google gmail attachments 18abc123def456
```

```text
[{"filename":"invoice.pdf","attachmentId":"att-77","mimeType":"application/pdf","size":18240}]
```

Then download one by its id. The bytes are decoded on the way out, so what lands on disk is a
usable file:

```bash
aux4 google gmail download 18abc123def456 --attachmentId att-77 --output invoice.pdf
```

```text
invoice.pdf
```

The filename in the listing is the sender's; `--output` is where you want it written, and the two
need not match. A message with nothing attached lists `[]`.

## Archiving messages

Archive removes a message from the inbox while keeping it in the mailbox. It can be returned to the inbox later. Pass `--id` once for each message; all IDs are sent in one request:

```bash
aux4 google gmail archive --id 18abc123def456 --id 19def456abc789
```

```text
Archived the selected message(s) from the inbox.
```

Archiving is different from moving a message to the Bin: archived messages remain in the mailbox and are searchable, while trashed messages are in the Bin.

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
