// generate-token.js
// SkyWay Auth Token(JWT)を再生成するためのスクリプトです。
// トークンの有効期限が切れそうになったら、自分のPCでこのスクリプトを実行してください。
//
// 使い方:
//   node generate-token.js <AppID> <シークレットキー>
//
// 実行すると新しいトークン文字列が表示されるので、
// index.html内の SKYWAY_AUTH_TOKEN の値を書き換えてください。
//
// ※ Node.jsが必要です（追加のライブラリのインストールは不要です）。

const crypto = require("crypto");

const appId = process.argv[2];
const secret = process.argv[3];
const validDays = parseInt(process.argv[4] || "180", 10); // デフォルト180日間有効

if (!appId || !secret) {
  console.error("使い方: node generate-token.js <AppID> <シークレットキー> [有効日数]");
  process.exit(1);
}

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const header = { alg: "HS256", typ: "JWT" };
const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * validDays;

const payload = {
  jti: crypto.randomUUID(),
  iat: now,
  exp: exp,
  scope: {
    app: {
      id: appId,
      turn: true,
      actions: ["read"],
      channels: [
        {
          id: "*",
          name: "*",
          actions: ["write"],
          members: [
            {
              id: "*",
              name: "*",
              actions: ["write"],
              publication: { actions: ["write"] },
              subscription: { actions: ["write"] }
            }
          ]
        }
      ]
    }
  }
};

const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
const signingInput = headerB64 + "." + payloadB64;
const hmac = crypto.createHmac("sha256", Buffer.from(secret, "base64"));
hmac.update(signingInput);
const signature = base64url(hmac.digest());

const token = signingInput + "." + signature;

console.log("新しいトークン:");
console.log(token);
console.log("");
console.log("有効期限:", new Date(exp * 1000).toISOString());
