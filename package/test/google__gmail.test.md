# google gmail

Part of the optional `integration` group in `test.suite.md`. These tests talk to the
real Gmail API, so they need a completed `aux4 google auth login` — a Google Cloud
OAuth Desktop client plus a human approving the consent screen in a browser. They
only run when asked for explicitly:

```bash
aux4 test run --group integration
```

Set `GMAIL_TEST_TO` to an address the authenticated account may email (your own
address is a good choice) before running the send test.

```timeout
15000
```

## labels

### should list the mailbox labels

```execute
aux4 google gmail labels list
```

```expect:partial
"labels"
```

## list

### should list recent messages

```execute
aux4 google gmail list --maxResults 3
```

```expect:partial
"messages"
```

## send

### should send a message to the configured test address

```execute
aux4 google gmail send ${GMAIL_TEST_TO} --subject "aux4 gmail integration test" --content "Sent by the community/google-gmail integration test."
```

```expect:partial
"id"
```
