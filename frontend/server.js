// Production HTTPS server for Next.js.
//
// `next start` (production mode) has no built-in HTTPS support, unlike
// `next dev --experimental-https`. This wraps the production Next.js
// request handler in a plain Node `https` server using the same
// Let's Encrypt certificate the dev server was using, so the systemd
// service can run a real production build instead of `next dev`.
const https = require("https");
const fs = require("fs");
const next = require("next");

const port = parseInt(process.env.PORT || "3001", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const keyPath =
  process.env.SSL_KEY_PATH ||
  "/etc/letsencrypt/live/160-236-72-175.sslip.io/privkey.pem";
const certPath =
  process.env.SSL_CERT_PATH ||
  "/etc/letsencrypt/live/160-236-72-175.sslip.io/fullchain.pem";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  https
    .createServer(httpsOptions, (req, res) => {
      handle(req, res);
    })
    .listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on https://${hostname}:${port}`);
    });
});
