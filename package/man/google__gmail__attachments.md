#### Description

The `attachments` command lists the files attached to a message: the `attachmentId` needed to
fetch each one, plus the filename, MIME type and size you would choose by.

Gmail does not return attachment bytes with the message. A `messages.get` gives you the message
structure with an `attachmentId` per attached part, and the bytes have to be fetched separately —
which is what `gmail download` does. This command is the step between the two: it reads the
message and reports what is attached, so you have an id to download.

It requests the `full` format, because attachment ids appear only there. Parts are searched
recursively, so a file attached to a message that also has an HTML alternative body — where the
attachment sits beside a nested `multipart/alternative` — is still found.

A part counts as an attachment when it has both a filename and an attachment id. An inline text
or HTML body has neither, so it is not listed; a message with nothing attached returns `[]`.

#### Usage

```bash
aux4 google gmail attachments <messageId> [--tokenFile <path>] [--apiUrl <url>]
```

--messageId  Id of the message whose attachments to list (positional)
--tokenFile  Where the Google OAuth token is stored (default: `${aux4HomeDir}/.oauth/google.json`)
--apiUrl     Gmail API base URL, for pointing at a mock (default: `https://gmail.googleapis.com/gmail/v1`)

#### Example

```bash
aux4 google gmail attachments 18f8a9b0c1d2e3f4
```

```text
[{"filename":"invoice.pdf","attachmentId":"att-77","mimeType":"application/pdf","size":18240}]
```

Take the `attachmentId` from that list and fetch the file:

```bash
aux4 google gmail download 18f8a9b0c1d2e3f4 --attachmentId att-77 --output invoice.pdf
```
