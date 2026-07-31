// Echo server for the community/google-gmail tests.
// Usage: node mock-echo.js <port>
//
// It replies with the request it received — method, path, Authorization header,
// Content-Type and parsed JSON body — so the tests can assert the exact request
// aux4 builds without a real Gmail account. For the messages.send route it also
// base64url-decodes the `raw` field and returns it as `decodedRaw`, letting the
// send test check the To/Subject/From MIME headers it produced.
//
// Node is used instead of Python because Python 3.14's http.server leaves its
// listening socket unreachable on the macos-latest CI runner.

const http = require("http");

const port = parseInt(process.argv[2], 10);

// Self-destruct so a stray server never outlives the test run.
setTimeout(() => process.exit(0), 90000);

function readBody(req, cb) {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => cb(Buffer.concat(chunks)));
}

function parseJson(buf) {
  const raw = buf.toString();
  if (raw === "") {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return raw;
  }
}

const server = http.createServer((req, res) => {
  readBody(req, (buf) => {
    const body = parseJson(buf);
    const payload = {
      method: req.method,
      path: req.url,
      authorization: req.headers["authorization"] || null,
      contentType: req.headers["content-type"] || null,
      body: body
    };

    // Surface the decoded MIME message for the send route so the test can
    // assert the RFC 2822 headers that gmail.mjs built.
    if (req.url.indexOf("/messages/send") !== -1 && body && typeof body.raw === "string") {
      payload.decodedRaw = Buffer.from(body.raw, "base64url").toString("utf8");
    }

    const data = JSON.stringify(payload, null, 2);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    });
    res.end(data);
  });
});

server.listen(port);
