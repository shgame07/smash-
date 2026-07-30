// generate-token.js
// SkyWay Auth Token（JWT / version 3）を再生成するためのスクリプトです。
// トークンの有効期限が切れそうになったら、自分のPCでこのスクリプトを実行してください。
//
// 使い方:
//   node generate-token.js <AppID> <シークレットキー>
//
// 実行すると新しいトークン文字列が表示されるので、
// index.html内の SKYWAY_AUTH_TOKEN の値を書き換えてください。
//
// ※ Node.jsが必要です（追加のライブラリのインストールは不要です）。
//
// ※ SkyWay Auth Token version 3 の仕様上、有効期限（exp）は
//    発行時刻（iat）から最大3日までしか設定できません。
//    そのため、有効期限が近づいたら都度このスクリプトを実行し直してください。

const crypto = require("crypto");

const appId = process.argv[2];
const secret = process.argv[3];
const validDays = Math.min(parseFloat(process.argv[4] || "3"), 3); // 最大3日まで

if (!appId || !secret) {
  console.error("使い方: node generate-token.js <AppID> <シークレットキー> [有効日数(最大3)]");
  process.exit(1);
}

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const header = { alg: "HS256", typ: "JWT" };
const now = Math.floor(Date.now() / 1000);
const exp = now + Math.floor(60 * 60 * 24 * validDays);

const payload = {
  jti: crypto.randomUUID(),
  iat: now,
  exp: exp,
  version: 3,
  scope: {
    appId: appId,
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
const hmac = crypto.createHmac("sha256", secret);
hmac.update(signingInput);
const signature = base64url(hmac.digest());

const token = signingInput + "." + signature;

console.log("新しいトークン:");
console.log(token);
console.log("");
console.log("発行日時:", new Date(now * 1000).toISOString());
console.log("有効期限:", new Date(exp * 1000).toISOString(), "（version 3の仕様上、最大3日間）");
