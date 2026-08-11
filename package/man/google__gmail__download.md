#### Description

The `download` command fetches one attachment and writes it to a file.

Gmail returns attachment bytes base64url-encoded inside a JSON envelope. This command decodes
them and writes the real bytes, so what lands on disk is a usable PDF or image rather than an
encoded wrapper you have to unpack yourself.

It needs the message id and the `attachmentId`. The latter is not something you can guess — get
it from `gmail attachments`, which lists the ids alongside filenames. The two commands are meant
to be used in that order.

The output path is required, and its extension is yours to choose: the API reports the bytes, not
the name, so `gmail attachments` is also where the original filename comes from.

If the attachment carries no data the command writes nothing and fails with a message on stderr,
rather than leaving an empty file behind.

#### Usage

```bash
aux4 google gmail download <messageId> --attachmentId <id> --output <path>
```

--messageId     Id of the message the attachment belongs to (positional)
--attachmentId  Id of the attachment, as reported by `gmail attachments`
--output        Path to write the attachment to
--tokenFile     Where the Google OAuth token is stored (default: `${aux4HomeDir}/.oauth/google.json`)
--apiUrl        Gmail API base URL, for pointing at a mock (default: `https://gmail.googleapis.com/gmail/v1`)

#### Example

```bash
aux4 google gmail attachments 18f8a9b0c1d2e3f4
```

```text
[{"filename":"invoice.pdf","attachmentId":"att-77","mimeType":"application/pdf","size":18240}]
```

```bash
aux4 google gmail download 18f8a9b0c1d2e3f4 --attachmentId att-77 --output invoice.pdf
```

```text
invoice.pdf
```

The command prints the path it wrote, so it can be chained into whatever reads the file next.
