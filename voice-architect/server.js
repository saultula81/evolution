require('dotenv').config();
const express = require('express');
const { handleIncomingMessage } = require('./orchestrator-pipeline');

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const AUTHORIZED_PHONE = process.env.AUTHORIZED_PHONE || '5491166508379';

// -------------------------------------------------------
// Webhook principal de Evolution API
// -------------------------------------------------------
app.post('/webhook', async (req, res) => {
  // Responder rápido para evitar reintentos de Evolution API
  res.status(200).json({ status: 'ok' });

  try {
    const { event, data } = req.body;

    if (event !== 'messages.upsert') return;

    const message = data?.messages?.[0] ?? data?.message;
    if (!message) return;

    // Extraer número del remitente
    const jid = message.key?.remoteJid || '';
    const phone = jid.replace('@s.whatsapp.net', '').replace('+', '');

    console.log(`[VoiceArchitect] Mensaje de ${phone}`);

    // Filtro de seguridad: solo el número autorizado
    if (!phone.includes(AUTHORIZED_PHONE)) {
      console.log(`[VoiceArchitect] Número no autorizado: ${phone}. Ignorando.`);
      return;
    }

    // El mensaje NO debe ser enviado por nosotros mismos
    if (message.key?.fromMe) return;

    // Detectar tipo de mensaje
    const audioMessage =
      message.message?.audioMessage ||
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;

    const textMessage =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      '';

    if (audioMessage) {
      console.log(`[VoiceArchitect] 🎙️ Audio detectado — iniciando pipeline de voz`);
      await handleIncomingMessage({
        type: 'audio',
        messageId: message.key.id,
        jid,
        audioData: audioMessage,
      });
    } else if (textMessage && textMessage.toLowerCase().startsWith('/arquitecto')) {
      const idea = textMessage.replace(/^\/arquitecto\s*/i, '').trim();
      console.log(`[VoiceArchitect] 📝 Texto recibido: "${idea}"`);
      await handleIncomingMessage({
        type: 'text',
        messageId: message.key.id,
        jid,
        text: idea,
      });
    } else {
      console.log(`[VoiceArchitect] Mensaje ignorado (no es voz ni /arquitecto)`);
    }
  } catch (err) {
    console.error(`[VoiceArchitect] Error en webhook:`, err.message);
  }
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'Voice Architect activo ✅' }));

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🎙️  Voice Architect - Puerto ${PORT}      ║
║  Autorizado: +${AUTHORIZED_PHONE}  ║
╚════════════════════════════════════════╝
  `);
});
