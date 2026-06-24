import "dotenv/config";
import crypto from "crypto";
import { fetch } from "undici";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const fileId = process.argv[2];
if (!fileId) {
  console.error("Usage: node scripts/debug-decrypt.mjs <fileId>");
  process.exit(1);
}

const masterSecret = process.env.FILE_ENCRYPTION_SECRET;
if (!masterSecret) {
  throw new Error("Missing FILE_ENCRYPTION_SECRET");
}
const masterKey = (() => {
  const isHex =
    /^[0-9a-fA-F]+$/.test(masterSecret) && masterSecret.length % 2 === 0;
  const buffer = Buffer.from(masterSecret, isHex ? "hex" : "utf8");
  if (buffer.length < 32) {
    throw new Error("FILE_ENCRYPTION_SECRET must resolve to at least 32 bytes");
  }
  return buffer;
})();

const deriveKey = (salt) =>
  crypto.pbkdf2Sync(masterKey, salt, 210_000, 32, "sha512");

const decrypt = (ciphertext, saltHex, ivHex, authTagHex) => {
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = deriveKey(salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

try {
  const file = await prisma.secureFile.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new Error("File not found");
  }
  const gatewayUrl =
    process.env.LIGHTHOUSE_GATEWAY_URL?.replace(/\/$/, "") ??
    "https://gateway.lighthouse.storage";
  const res = await fetch(`${gatewayUrl}/ipfs/${file.cid}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cid ${file.cid}: ${res.status}`);
  }
  const ciphertext = Buffer.from(await res.arrayBuffer());
  console.log("Fetched ciphertext bytes:", ciphertext.length);
  const plaintext = decrypt(
    ciphertext,
    file.encryptionSalt,
    file.encryptionIv,
    file.encryptionAuthTag,
  );
  console.log("Decrypted bytes:", plaintext.length);
} catch (error) {
  console.error("Decrypt test failed:", error);
} finally {
  await prisma.$disconnect();
}
