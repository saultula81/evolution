#!/usr/bin/env node
/**
 * setup-webhook.js
 * Registra el webhook de Voice Architect en Evolution API.
 * Uso: node setup-webhook.js
 */
require('dotenv').config();
const axios = require('axios');

const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE, PORT } = process.env;
const webhookUrl = `http://localhost:${PORT || 3001}/webhook`;

async function registerWebhook() {
  console.log(`\n[Setup] Registrando webhook para instancia: ${EVOLUTION_INSTANCE}`);
  console.log(`[Setup] URL del webhook: ${webhookUrl}\n`);

  try {
    const response = await axios.put(
      `${EVOLUTION_API_URL}/webhook/set/${EVOLUTION_INSTANCE}`,
      {
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          events: [
            'MESSAGES_UPSERT',
          ],
        },
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[Setup] ✅ Webhook registrado exitosamente:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('[Setup] ❌ Error registrando webhook:');
    console.error(err.response?.data || err.message);
    process.exit(1);
  }
}

registerWebhook();
