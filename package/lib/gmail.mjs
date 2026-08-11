// Client-side helpers for the community/google-gmail package.
// Usage: node gmail.mjs mime <to> <subject> <text> <from> <cc> <bcc> <htmlBody>
//        node gmail.mjs decode      < message.json
//        node gmail.mjs attachments < message.json
//        node gmail.mjs save <path>  < attachment.json
//
// Builds an RFC 2822 MIME message from the given fields and prints it
// base64url-encoded, which is exactly the shape the Gmail API expects in the
// `raw` field of users.messages.send. Node is used (instead of inline shell)
// so the encoding is done in one place and can be unit-tested through the CLI.

import { readSync, writeFileSync } from "node:fs";

const [, , mode, ...rest] = process.argv;

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Read everything on stdin, but only when it is piped (`cat body.html | aux4
// google gmail send ...`); never block on an interactive terminal.
//
// readFileSync(0) is not safe here: on a pipe it can raise EAGAIN before the
// writer has produced anything, and a caught EAGAIN looks exactly like "no
// input". That silently turned a piped message body into an empty string.
// Loop on readSync instead, waiting briefly when the pipe is not ready yet.
function readStdinIfPiped() {
  if (process.stdin.isTTY) {
    return "";
  }

  const size = 65536;
  const buffer = Buffer.alloc(size);
  const chunks = [];

  for (;;) {
    let bytes;
    try {
      bytes = readSync(0, buffer, 0, size, null);
    } catch (error) {
      if (error.code === "EAGAIN") {
        // Pipe open but empty -- wait for the writer rather than giving up.
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
        continue;
      }
      // EOF on some platforms, or a closed/invalid descriptor: nothing more.
      break;
    }
    if (bytes === 0) {
      break;
    }
    chunks.push(Buffer.from(buffer.subarray(0, bytes)));
  }

  return Buffer.concat(chunks).toString("utf8");
}

// Fold a header value onto a single line so a stray newline in user input can
// never inject extra headers into the message.
function headerValue(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function buildMime([to, subject, bodyArg, from, cc, bcc, htmlFlag]) {
  const recipient = headerValue(to);
  if (recipient === "") {
    fail("send: a recipient (to) is required");
  }

  // The body comes from --body, or from stdin when --body is omitted
  // (so `cat body.html | aux4 google gmail send ...` works). --html decides
  // whether that body is sent as text/html or text/plain, either way.
  let body = String(bodyArg || "");
  if (body.trim() === "") {
    body = readStdinIfPiped();
  }

  // Refuse to send a blank message. Without this the send silently succeeds with an empty
  // body, which is never what the caller meant -- and hides a common mistake: passing the
  // text under a flag that does not exist, so it is dropped and nothing is left. The error
  // names the flag so the caller can correct it rather than guess again.
  if (body.trim() === "" && headerValue(subject) === "") {
    fail('send: nothing to send -- the message has no subject and no body. Pass the text with --body.');
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


// Gmail returns message bodies base64url-encoded inside `payload`, and the API
// has no "give me the text" mode. Passing that straight through means anyone
// reading a message -- a person or an agent -- gets a base64 blob instead of
// the email. `decode` walks the payload, decodes the best text part it finds,
// and adds it as a top-level `text` field. The original resource is left
// untouched, so nothing that already reads `payload` breaks.
function decodeBody(data) {
  return Buffer.from(String(data), "base64url").toString("utf8");
}

// Depth-first search for the body worth showing: prefer text/plain, fall back
// to text/html, and accept a bare `body.data` on a single-part message.
function findText(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const wanted = ["text/plain", "text/html"];
  for (const mimeType of wanted) {
    const hit = search(payload, mimeType);
    if (hit !== null) {
      return hit;
    }
  }

  // Single-part message with no mimeType we recognise.
  if (payload.body && typeof payload.body.data === "string" && payload.body.data !== "") {
    return decodeBody(payload.body.data);
  }
  return null;
}

function search(node, mimeType) {
  if (!node || typeof node !== "object") {
    return null;
  }
  const data = node.body && node.body.data;
  if (node.mimeType === mimeType && typeof data === "string" && data !== "") {
    return decodeBody(data);
  }
  if (Array.isArray(node.parts)) {
    for (const part of node.parts) {
      const hit = search(part, mimeType);
      if (hit !== null) {
        return hit;
      }
    }
  }
  return null;
}

// Read the message resource from stdin and re-emit it with `text` added. Any
// input that is not a JSON object -- an error page, an empty body, a --format
// that returns something else -- is passed through untouched, so decoding can
// never turn a working command into a failing one.
function decodeMessage() {
  const input = readStdinIfPiped();
  if (input.trim() === "") {
    return "";
  }

  let message;
  try {
    message = JSON.parse(input);
  } catch {
    return input;
  }
  if (message === null || typeof message !== "object" || Array.isArray(message)) {
    return input;
  }

  decodeParts(message.payload);

  const text = findText(message.payload);
  if (text === null) {
    return input;
  }
  return JSON.stringify({ ...message, text });
}


// Every text part gets its decoded content alongside the raw data, so a
// multipart message is readable part by part, not just through the top-level
// `text`.
function decodeParts(node) {
  if (!node || typeof node !== "object") {
    return;
  }
  const data = node.body && node.body.data;
  const mimeType = String(node.mimeType || "");
  if (typeof data === "string" && data !== "" && mimeType.startsWith("text/")) {
    node.body.text = decodeBody(data);
  }
  if (Array.isArray(node.parts)) {
    node.parts.forEach(decodeParts);
  }
}

// List what is attached to a message: the fields needed to fetch one, plus the
// filename and size a caller chooses by.
function listAttachments(payload, found = []) {
  if (!payload || typeof payload !== "object") {
    return found;
  }
  const filename = String(payload.filename || "");
  const attachmentId = payload.body && payload.body.attachmentId;
  if (filename !== "" && attachmentId) {
    found.push({
      filename,
      attachmentId,
      mimeType: payload.mimeType || "application/octet-stream",
      size: (payload.body && payload.body.size) || 0
    });
  }
  if (Array.isArray(payload.parts)) {
    payload.parts.forEach((part) => listAttachments(part, found));
  }
  return found;
}

function attachmentsOf(input) {
  let message;
  try {
    message = JSON.parse(input);
  } catch {
    fail("attachments: the message could not be read");
  }
  return JSON.stringify(listAttachments(message.payload));
}

// Write an attachment to disk. The API returns it base64url-encoded, so the
// bytes are decoded here rather than left for the caller to deal with.
function saveAttachment(input, outputPath) {
  if (!outputPath) {
    fail("download: an output path is required");
  }
  let attachment;
  try {
    attachment = JSON.parse(input);
  } catch {
    fail("download: the attachment could not be read");
  }
  if (typeof attachment.data !== "string" || attachment.data === "") {
    fail("download: the attachment has no data");
  }
  writeFileSync(outputPath, Buffer.from(attachment.data, "base64url"));
  return outputPath;
}

if (mode === "mime") {
  const mime = buildMime(rest);
  process.stdout.write(Buffer.from(mime, "utf8").toString("base64url"));
} else if (mode === "decode") {
  process.stdout.write(decodeMessage());
} else if (mode === "attachments") {
  process.stdout.write(attachmentsOf(readStdinIfPiped()));
} else if (mode === "save") {
  process.stdout.write(saveAttachment(readStdinIfPiped(), rest[0]));
} else if (mode === "trashbody") {
  // Repeatable value comes as one JSON-array arg; join defensively in case a
  // shell ever splits it into several.
  process.stdout.write(buildTrashBody(rest.length > 1 ? rest.join("\n") : rest[0]));
} else {
  fail(`unknown mode: ${mode}`);
}
