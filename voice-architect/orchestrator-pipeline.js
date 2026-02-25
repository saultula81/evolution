require('dotenv').config();
const axios = require('axios');
const OpenAI = require('openai');
const FormData = require('form-data');
const { publishToGitHub } = require('./github-publisher');
const { sendWhatsAppMessage } = require('./whatsapp-notifier');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -------------------------------------------------------
// Pipeline principal
// -------------------------------------------------------
async function handleIncomingMessage({ type, jid, audioData, text }) {
  let rawIdea = '';

  try {
    // PASO 1: Obtener texto crudo
    if (type === 'audio') {
      await sendWhatsAppMessage(jid, '⚙️ *Arquitecto activado* — Transcribiendo tu voz...');
      rawIdea = await transcribeAudio(audioData);
      console.log(`[Pipeline] Transcripción: "${rawIdea}"`);
    } else {
      rawIdea = text;
    }

    if (!rawIdea || rawIdea.trim().length < 5) {
      await sendWhatsAppMessage(jid, '❌ No pude entender la idea. Intenta de nuevo con más claridad.');
      return;
    }

    // PASO 2: Enhance Prompt
    await sendWhatsAppMessage(jid, `📝 *Idea captada:* "${rawIdea}"\n\n_Mejorando el concepto..._`);
    const enhancedIdea = await enhanceProjectIdea(rawIdea);

    // PASO 3: Generar spec SDD
    await sendWhatsAppMessage(jid, '🏗️ *Generando especificación de software...*');
    const { slug, spec } = await generateSddSpec(enhancedIdea);

    // PASO 4: Publicar en GitHub
    await sendWhatsAppMessage(jid, '📦 *Subiendo a GitHub...*');
    const githubUrl = await publishToGitHub(slug, spec, enhancedIdea);

    // PASO 5: Notificación final
    const summary = `
✅ *Proyecto especificado exitosamente*

🏷️ *Nombre:* ${slug}
🧠 *Concepto:* ${enhancedIdea.title}

📁 *Archivos creados en GitHub:*
${githubUrl}

📋 *Próximos pasos disponibles:*
• \`/sdd-design\` — Diseño técnico
• \`/sdd-tasks\` — Plan de tareas
• \`/sdd-apply\` — Implementación

_El Arquitecto ha terminado su trabajo_ 🎙️🏗️
    `.trim();

    await sendWhatsAppMessage(jid, summary);
    console.log(`[Pipeline] ✅ Proyecto "${slug}" publicado en ${githubUrl}`);
  } catch (err) {
    console.error(`[Pipeline] Error:`, err.message);
    await sendWhatsAppMessage(
      jid,
      `❌ *Error en el Arquitecto:* ${err.message}\n\nIntenta de nuevo.`
    );
  }
}

// -------------------------------------------------------
// Transcribir audio con Whisper
// -------------------------------------------------------
async function transcribeAudio(audioData) {
  // Evolution API entrega el audio como base64 en audioMessage.url o lo podemos pedir a la API
  // Si el audioData tiene url, descargamos primero
  let audioBuffer;

  if (audioData.url) {
    const response = await axios.get(audioData.url, {
      responseType: 'arraybuffer',
      headers: {
        apikey: process.env.EVOLUTION_API_KEY,
      },
    });
    audioBuffer = Buffer.from(response.data);
  } else if (audioData.base64) {
    audioBuffer = Buffer.from(audioData.base64, 'base64');
  } else {
    throw new Error('No se pudo obtener el audio del mensaje');
  }

  // Crear FormData para enviar a Whisper
  const form = new FormData();
  form.append('file', audioBuffer, {
    filename: 'audio.ogg',
    contentType: 'audio/ogg',
  });
  form.append('model', 'whisper-1');
  form.append('language', 'es');
  form.append('response_format', 'text');

  const response = await openai.audio.transcriptions.create({
    file: new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' }),
    model: 'whisper-1',
    language: 'es',
  });

  return response.trim();
}

// -------------------------------------------------------
// Enhance Project Idea (versión de enhance-prompt para proyectos de software)
// -------------------------------------------------------
async function enhanceProjectIdea(rawIdea) {
  const prompt = `Eres un arquitecto de software experto en el ecosistema JavaScript/Node.js.

Tu tarea es transformar una idea vaga en un concepto técnico estructurado.

IDEA DEL USUARIO: "${rawIdea}"

Responde SOLO con JSON válido con esta estructura exacta:
{
  "title": "Nombre técnico del proyecto (PascalCase, máx 4 palabras)",
  "slug": "nombre-kebab-case-del-proyecto",
  "description": "Descripción técnica de una oración. Qué hace y para quién.",
  "stack": ["tecnología1", "tecnología2", ...],
  "keyFeatures": [
    "Feature principal 1",
    "Feature principal 2",
    "Feature principal 3"
  ],
  "architecture": "Breve descripción del patrón arquitectónico (REST API, microservicio, CLI, webapp, etc.)",
  "targetUser": "A quién va dirigido"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content);
}

// -------------------------------------------------------
// Generar spec SDD completa
// -------------------------------------------------------
async function generateSddSpec(enhancedIdea) {
  const slug = enhancedIdea.slug || 'nuevo-proyecto';

  const sddPrompt = `Eres un arquitecto de software usando Spec-Driven Development (SDD).

Genera una especificación técnica completa para el siguiente proyecto:

${JSON.stringify(enhancedIdea, null, 2)}

Crea los archivos SDD siguiendo esta estructura exacta en JSON:
{
  "config_yaml": "contenido del openspec/config.yaml",
  "spec_md": "contenido del openspec/specs/core.md (con Given/When/Then, RFC 2119)",
  "proposal_md": "contenido del openspec/changes/001-init/proposal.md"
}

Para config.yaml usa el formato YAML con schema, context y rules.
Para spec_md incluye contexto, escenarios en formato Gherkin y contratos de API.
Para proposal_md incluye el problema, la solución propuesta, módulos afectados y plan de rollback.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: sddPrompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const spec = JSON.parse(completion.choices[0].message.content);
  return { slug, spec };
}

module.exports = { handleIncomingMessage };
