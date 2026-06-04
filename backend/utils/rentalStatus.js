const STATUS_FLOW = [
  "draft",
  "booking",
  "siap_keluar",
  "sedang_disewa",
  "serah_terima_kembali",
  "selesai",
];

const STATUS_BATAL = "batal";

const normalisasiStatus = (status) => {
  if (!status) return status;

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/dibatalkan/g, "batal")
    .replace(/\s+/g, "_");
};

const validasiStatus = (status) => {
  const statusNormal = normalisasiStatus(status);
  return [...STATUS_FLOW, STATUS_BATAL].includes(statusNormal);
};

const validasiPerubahanStatus = (statusSekarang, statusTujuan) => {
  const dari = normalisasiStatus(statusSekarang);
  const ke = normalisasiStatus(statusTujuan);

  if (!validasiStatus(ke)) {
    return {
      valid: false,
      pesan: "Status tidak valid",
    };
  }

  if (ke === STATUS_BATAL) {
    return {
      valid: true,
    };
  }

  const indexDari = STATUS_FLOW.indexOf(dari);
  const indexKe = STATUS_FLOW.indexOf(ke);

  if (indexDari === -1) {
    return {
      valid: false,
      pesan: "Status saat ini tidak valid untuk dilanjutkan",
    };
  }

  if (indexKe !== indexDari + 1) {
    return {
      valid: false,
      pesan: "Status harus mengikuti flow transaksi rental",
    };
  }

  return {
    valid: true,
  };
};

module.exports = {
  STATUS_FLOW,
  STATUS_BATAL,
  normalisasiStatus,
  validasiStatus,
  validasiPerubahanStatus,
};
