import QRCode from "qrcode";

// Función para generar un código QR
export async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text);
  } catch (error) {
    console.error(error);
  }
}