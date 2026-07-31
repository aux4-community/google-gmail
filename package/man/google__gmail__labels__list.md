#### Description

The `labels list` command returns every label in the mailbox of the authenticated account. Each entry includes the label ID, its name, its type (`system` for built-in labels or `user` for ones you created), and visibility settings.

Use the label IDs returned here with `aux4 google gmail list --labelIds` to filter messages by label.

#### Usage

```bash
aux4 google gmail labels list [--tokenFile <path>]
```

--tokenFile  Where the shared Google OAuth token is stored (default: `~/.aux4.config/.oauth/google.json`, env `AUX4_GOOGLE_TOKEN_FILE`)

#### Example

```bash
aux4 google gmail labels list
```

```text
{
  "labels": [
    {"id": "INBOX", "name": "INBOX", "type": "system"},
    {"id": "SENT", "name": "SENT", "type": "system"},
    {"id": "Label_12", "name": "Receipts", "type": "user"}
  ]
}
```

Show the labels as a table:

```bash
aux4 google gmail labels list | aux4 json get --path '$.labels' | aux4 2table --table id,name,type
```
