# google-gmail test suite

Run the CI-safe group with `aux4 test run --group core` from this directory. The
`integration` group needs a real Google login and is skipped unless requested.

## core

- google__gmail__send.test.md
- google__gmail__list.test.md
- google__gmail__get.test.md
- google__gmail__trash.test.md
- google__gmail__labels__list.test.md
- google_gmail__injection.test.md

## integration (optional)

- google__gmail.test.md
