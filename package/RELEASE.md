# Release notes

## `get` returns the email, not base64

`gmail get` now decodes the message body for you. The result carries a top-level `text` field
with the body, and every text part gets its decoded content alongside the raw data. The API
returns bodies base64url-encoded with no "just the text" option, so passing them through raw
handed the reader — a person or an agent — a base64 blob instead of the email.

## Attachments: `attachments` and `download`

Attachment bytes do not come with the message; the API returns an id per attached part, fetched
separately. Two commands make that usable:

```bash
aux4 google gmail attachments <id>                              # list filename, attachmentId, size
aux4 google gmail download <id> --attachmentId <a> --output f   # write the decoded file
```

## `send` accepts `--body`, and refuses to send nothing

Two changes to stop a message going out empty:

- **`--body` is now an alias for `--content`.** "body" is the name most mail tools give the
  message text, and a caller reaching for it had the text silently dropped as an unknown flag —
  the message went out blank. Both names now work.
- **A send with no subject and no body is refused**, with an error that names the flag:
  `nothing to send -- ... Pass the text with --content (or --body)`. Previously it succeeded
  silently with an empty body, which is never intended and hid the dropped-flag mistake above.

Found while watching a small local model compose a correct reply, pass it under `--body`, and
send an empty email because the flag was ignored. The reply now arrives.

## A piped body is no longer lost

`send` reading its body from stdin (`cat body.html | aux4 google gmail send ...`) used
`readFileSync(0)`, which raises `EAGAIN` on a pipe before the writer produces anything; the
caught error looked exactly like "no input", so the body silently became empty. The reader now
waits for the pipe.
