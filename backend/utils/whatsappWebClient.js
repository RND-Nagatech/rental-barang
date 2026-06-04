const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const fs = require("fs/promises");
const path = require("path");

let client = null;
let status = "disconnected";
let qrDataUrl = "";
let lastError = "";
let initialized = false;
let initializationPromise = null;
let initWatchdog = null;
const LOCK_FILES = ["SingletonLock", "SingletonCookie", "SingletonSocket"];

const lockBasePath = () =>
  path.join(process.cwd(), ".wwebjs_auth", "session-rentory", "Default");

const clearInitWatchdog = () => {
  if (initWatchdog) {
    clearTimeout(initWatchdog);
    initWatchdog = null;
  }
};

const cleanupStaleChromiumLocks = async () => {
  const basePath = lockBasePath();

  await Promise.all(
    LOCK_FILES.map(async (name) => {
      const filePath = path.join(basePath, name);
      try {
        await fs.rm(filePath, { force: true });
      } catch (error) {
        // ignore cleanup failure; best-effort only
      }
    }),
  );
};

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
};

const ensureClient = () => {
  if (client) return client;

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "rentory" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    status = "qr_ready";
    lastError = "";
    clearInitWatchdog();
    try {
      qrDataUrl = await QRCode.toDataURL(qr);
    } catch (error) {
      qrDataUrl = "";
      lastError = error.message;
    }
  });

  client.on("authenticated", () => {
    status = "authenticated";
    lastError = "";
    clearInitWatchdog();
  });

  client.on("ready", () => {
    status = "connected";
    qrDataUrl = "";
    lastError = "";
    clearInitWatchdog();
  });

  client.on("auth_failure", (message) => {
    status = "auth_failure";
    lastError = message || "Autentikasi WhatsApp gagal";
    clearInitWatchdog();
  });

  client.on("disconnected", (reason) => {
    status = "disconnected";
    qrDataUrl = "";
    lastError = reason || "WhatsApp Web terputus";
    initialized = false;
    initializationPromise = null;
    clearInitWatchdog();
  });

  return client;
};

const startWhatsAppWeb = async () => {
  const waClient = ensureClient();

  if (!initialized && !initializationPromise) {
    initialized = true;
    status = "initializing";
    lastError = "";
    qrDataUrl = "";

    clearInitWatchdog();
    initWatchdog = setTimeout(() => {
      if (status === "initializing") {
        status = "auth_failure";
        lastError =
          "QR belum muncul. Pastikan hanya satu server backend aktif, lalu klik Putuskan Sesi dan Mulai Scan QR lagi.";
        initialized = false;
        initializationPromise = null;
      }
    }, 25000);

    // Bersihkan lock file Chromium yang kadang tertinggal setelah crash.
    await cleanupStaleChromiumLocks();

    initializationPromise = waClient
      .initialize()
      .catch((error) => {
        status = "auth_failure";
        if (String(error.message || "").includes("already running")) {
          lastError =
            "Sesi browser WA masih dipakai proses lain. Tutup backend lain, klik Putuskan Sesi, lalu Mulai Scan QR lagi.";
        } else {
          lastError = error.message || "Inisialisasi WhatsApp Web gagal";
        }
        initialized = false;
      })
      .finally(() => {
        initializationPromise = null;
      });
  }

  return {
    status,
    qrDataUrl,
    lastError,
  };
};

const getWhatsAppWebStatus = async () => ({
  status,
  qrDataUrl,
  lastError,
});

const disconnectWhatsAppWeb = async () => {
  clearInitWatchdog();
  initializationPromise = null;

  if (client) {
    try {
      await client.logout();
    } catch (error) {
      // ignore logout failure and continue destroy
    }

    try {
      await client.destroy();
    } catch (error) {
      // ignore destroy failure
    }
  }

  client = null;
  initialized = false;
  status = "disconnected";
  qrDataUrl = "";
  lastError = "";
  await cleanupStaleChromiumLocks();

  return { status, qrDataUrl, lastError };
};

const sendWhatsAppWebMessage = async ({ to, message }) => {
  const phone = normalizePhone(to);

  if (!phone) {
    throw new Error("Nomor WhatsApp tujuan tidak valid");
  }

  if (!client || status !== "connected") {
    throw new Error("WhatsApp Web belum terhubung. Silakan scan QR terlebih dahulu");
  }

  const numberId = await client.getNumberId(phone);

  if (!numberId?._serialized) {
    throw new Error(
      `Nomor tujuan ${phone} tidak ditemukan di WhatsApp. Gunakan format nomor aktif, mis. 62812xxxx.`
    );
  }

  const sent = await client.sendMessage(numberId._serialized, String(message || ""));

  return { terkirim: true, tujuan: phone, messageId: sent?.id?._serialized || "" };
};

module.exports = {
  startWhatsAppWeb,
  getWhatsAppWebStatus,
  disconnectWhatsAppWeb,
  sendWhatsAppWebMessage,
};
