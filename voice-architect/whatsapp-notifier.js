require('dotenv').config();
const axios = require('axios');

const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } = process.env;

// -------------------------------------------------------
// Envía un mensaje de texto al número indicado (JID)
// -------------------------------------------------------
async function sendWhatsAppMessage(jid, text) {
  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

    await axios.post(
      url,
      {
        number: jid.replace('@s.whatsapp.net', ''),
        text,
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`[WhatsApp] ✅ Mensaje enviado a ${jid}`);
  } catch (err) {
    console.error(
      `[WhatsApp] ❌ Error enviando mensaje:`,
      err.response?.data || err.message
    );
    // No interrumpir el pipeline si falla el mensaje
  }
}

module.exports = { sendWhatsAppMessage };
