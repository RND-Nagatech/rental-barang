const crypto = require("crypto");

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const secret = () =>
  process.env.AUTH_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  process.env.MONGO_URI ||
  "rentory-local-auth-secret";

const base64Url = (input) =>
  Buffer.from(JSON.stringify(input)).toString("base64url");

const sign = (value) =>
  crypto.createHmac("sha256", secret()).update(value).digest("base64url");

const createToken = (payload, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) => {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encoded = base64Url(body);
  return `${encoded}.${sign(encoded)}`;
};

const verifyToken = (token) => {
  if (!token || !String(token).includes(".")) return null;

  const [encoded, signature] = String(token).split(".");
  const expected = sign(encoded);
  const signatureBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

module.exports = {
  createToken,
  verifyToken,
};
