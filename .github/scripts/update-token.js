// .github/scripts/update-token.js
// GitHub Actions から呼び出され、新しい SkyWay Auth Token (version 3) を
// 生成して index.html の SKYWAY_AUTH_TOKEN を書き換えます。
//
// AppID / シークレットキーは、環境変数
//   SKYWAY_APP_ID, SKYWAY_SECRET_KEY
// から読み込みます（GitHub Secretsに設定してください）。
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const appId = process.env.SKYWAY_APP_ID;
const secret = process.env.SKYWAY_SECRET_KEY;
if (!appId || !secret) {
  console.error("環境変数 SKYWAY_APP_ID / SKYWAY_SECRET_KEY が設定されていません");
  process.exit(1);
}
function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const header = { alg: "HS256", typ: "JWT" };
const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 3; // 3日間有効（毎日更新するので2日分の余裕を持たせる）
const payload = {
  jti: crypto.randomUUID(),
  iat: now,
  exp,
  version: 3,
  scope: {
    appId,
    turn: { enabled: true },
    analytics: { enabled: true },
    noiseCancelling: { enabled: true },
    rooms: [
      {
        id: "*",
        name: "*",
        methods: ["create", "close", "updateMetadata"],
        sfu: { enabled: true },
        member: {
          id: "*",
          name: "*",
          methods: ["publish", "subscribe", "updateMetadata"]
        }
      }
    ]
  }
};
const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
const signingInput = headerB64 + "." + payloadB64;
const hmac = crypto.createHmac("sha256", Buffer.from(secret, "base64"));
hmac.update(signingInput);
const signature = base64url(hmac.digest());
const token = signingInput + "." + signature;
// リポジトリ直下の index.html を書き換える
const indexPath = path.join(__dirname, "..", "..", "index.html");
const html = fs.readFileSync(indexPath, "utf8");
const newHtml = html.replace(
  /const SKYWAY_AUTH_TOKEN = ".*?";/,
  `const SKYWAY_AUTH_TOKEN = "${token}";`
);
if (newHtml === html) {
  console.error("index.html 内に SKYWAY_AUTH_TOKEN の置換箇所が見つかりませんでした");
  process.exit(1);
}
fs.writeFileSync(indexPath, newHtml);
console.log("トークンを更新しました。");
console.log("有効期限:", new Date(exp * 1000).toISOString());
