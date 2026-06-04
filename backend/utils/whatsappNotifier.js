const { sendWhatsAppWebMessage } = require("./whatsappWebClient");

const kirimWhatsApp = async ({
  pengaturan,
  to,
  message,
}) => {
  const waAktif = Boolean(pengaturan?.wa_enabled);
  const penerima = String(to || "").trim();
  const modeKoneksi = pengaturan?.wa_connection_mode || "provider_api";

  if (!waAktif) {
    return { terkirim: false, alasan: "WA nonaktif" };
  }

  if (!penerima) {
    return { terkirim: false, alasan: "Nomor tujuan kosong" };
  }

  if (modeKoneksi === "web_qr") {
    return sendWhatsAppWebMessage({
      to: penerima,
      message,
    });
  }

  const endpoint = String(pengaturan?.wa_provider_url || "").trim();

  if (!endpoint) {
    return { terkirim: false, alasan: "Endpoint WA belum diisi" };
  }

  const apiKey = String(pengaturan?.wa_api_key || "").trim();
  const sender = String(pengaturan?.wa_sender || "").trim();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      to: penerima,
      message,
      sender,
      api_key: apiKey || undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gagal kirim WA (${response.status}): ${text || response.statusText}`);
  }

  return { terkirim: true };
};

module.exports = {
  kirimWhatsApp,
};
