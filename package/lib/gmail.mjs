// Client-side helpers for the community/google-gmail package.
// Usage: node gmail.mjs mime <to> <subject> <text> <from> <cc> <bcc> <htmlBody>
//
// Builds an RFC 2822 MIME message from the given fields and prints it
// base64url-encoded, which is exactly the shape the Gmail API expects in the
// `raw` field of users.messages.send. Node is used (instead of inline shell)
// so the encoding is done in one place and can be unit-tested through the CLI.

import { readFileSync } from "node:fs";

const [, , mode, ...rest] = process.argv;

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Read the whole request body from stdin, but only when it is piped
// (`cat body.html | aux4 google gmail send ...`); never block on an
// interactive terminal.
function readStdinIfPiped() {
  if (process.stdin.isTTY) {
    return "";
  }
  try {
    return readFileSync(0, "utf8");
  } catch (e) {
    return "";
  }
}

// Fold a header value onto a single line so a stray newline in user input can
// never inject extra headers into the message.
function headerValue(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function buildMime([to, subject, content, from, cc, bcc, htmlFlag]) {
  const recipient = headerValue(to);
  if (recipient === "") {
    fail("send: a recipient (to) is required");
  }

  // The body comes from --content, or from stdin when --content is omitted
  // (so `cat body.html | aux4 google gmail send ...` works). --html decides
  // whether that body is sent as text/html or text/plain, either way.
  let body = String(content || "");
  if (body.trim() === "") {
    body = readStdinIfPiped();
  }

  const isHtml = String(htmlFlag || "").trim() === "true";
  const contentType = isHtml ? "text/html" : "text/plain";

  const headers = [];
  headers.push(`To: ${recipient}`);
  if (headerValue(from) !== "") {
    headers.push(`From: ${headerValue(from)}`);
  }
  if (headerValue(cc) !== "") {
    headers.push(`Cc: ${headerValue(cc)}`);
  }
  if (headerValue(bcc) !== "") {
    headers.push(`Bcc: ${headerValue(bcc)}`);
  }
  headers.push(`Subject: ${headerValue(subject)}`);
  headers.push("MIME-Version: 1.0");
  headers.push(`Content-Type: ${contentType}; charset="UTF-8"`);

  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

// Parse a repeatable aux4 value (the `name*` form). aux4 passes multiple values
// as a single JSON-array string; a plain/newline string is accepted too so a
// single value keeps working.
function parseMultiValue(raw) {
  const value = String(raw || "").trim();
  if (value === "") {
    return [];
  }
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter((item) => item !== "");
      }
    } catch {
      // fall through to the newline form
    }
  }
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

// Build the users.messages.batchModify body that moves one or more messages to
// the Trash by adding the TRASH label. Reversible (removing TRASH untrashes),
// and works within the gmail.modify scope — unlike permanent messages.delete,
// which needs the full mail.google.com scope we deliberately do not request.
function buildTrashBody(rawIds) {
  const ids = parseMultiValue(rawIds);
  if (ids.length === 0) {
    fail("trash: at least one message id is required");
  }
  return JSON.stringify({ ids, addLabelIds: ["TRASH"] });
}

if (mode === "mime") {
  const mime = buildMime(rest);
  process.stdout.write(Buffer.from(mime, "utf8").toString("base64url"));
} else if (mode === "trashbody") {
  // Repeatable value comes as one JSON-array arg; join defensively in case a
  // shell ever splits it into several.
  process.stdout.write(buildTrashBody(rest.length > 1 ? rest.join("\n") : rest[0]));
} else {
  fail(`unknown mode: ${mode}`);
}
