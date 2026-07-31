#### Description

The `send` command composes an email and sends it through the Gmail API. It builds an RFC 2822 MIME message from the flags you provide — recipient, subject, and body — base64url-encodes it, and posts it to the `messages.send` endpoint of the authenticated account.

The body is given with `--content`. It is sent as `text/plain` by default; add `--html true` to send it as `text/html`. If `--content` is omitted, the body is read from **stdin**, so you can pipe a file in: `cat body.html | aux4 google gmail send ... --html true`. Either way, `--html` decides the content type.

The `--from` header is optional; Gmail uses the authenticated account when it is omitted. Multiple `--cc` or `--bcc` recipients are given as a comma-separated list.

To continue an existing conversation, pass `--threadId`. The message is then attached to that thread instead of starting a new one. The thread ID is the `threadId` value returned by `list` or `get`.

#### Usage

```bash
aux4 google gmail send <to> [--subject <text>] [--content <body>] [--html true] [--from <email>] [--cc <emails>] [--bcc <emails>] [--threadId <id>] [--tokenFile <path>]
```

to           Recipient email address (required)
--subject    Message subject line
--content    Message body. If omitted, the body is read from stdin (a pipe)
--html       Send the body as HTML (`text/html`) instead of plain text
--from       Sender email address (defaults to the authenticated account)
--cc         Comma-separated CC recipients
--bcc        Comma-separated BCC recipients
--threadId   Thread ID to attach this message to, for replies
--tokenFile  Where the shared Google OAuth token is stored (default: `~/.aux4.config/.oauth/google.json`, env `AUX4_GOOGLE_TOKEN_FILE`)

#### Example

```bash
aux4 google gmail send person@example.com --subject "Weekly update" --content "Here is the update."
```

```text
{
  "id": "18abc123def456",
  "threadId": "18abc123def456",
  "labelIds": ["SENT"]
}
```

Send an HTML message with a CC recipient:

```bash
aux4 google gmail send person@example.com --subject "Report" --content "<h1>Report</h1><p>See attached numbers.</p>" --html true --cc team@example.com
```

Pipe an HTML file in as the body:

```bash
cat newsletter.html | aux4 google gmail send list@example.com --subject "This week" --html true
```

Reply within an existing thread:

```bash
aux4 google gmail send person@example.com --subject "Re: Weekly update" --content "Thanks!" --threadId 18abc123def456
```
