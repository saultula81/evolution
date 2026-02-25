require('dotenv').config();
const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;

// -------------------------------------------------------
// Publica los archivos SDD en el repositorio de GitHub
// -------------------------------------------------------
async function publishToGitHub(slug, spec, enhancedIdea) {
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const branch = 'main';
  const basePath = `openspec/${slug}`;

  const filesToCreate = [
    {
      path: `${basePath}/config.yaml`,
      content: spec.config_yaml,
    },
    {
      path: `${basePath}/specs/core.md`,
      content: spec.spec_md,
    },
    {
      path: `${basePath}/changes/001-init/proposal.md`,
      content: spec.proposal_md,
    },
    {
      path: `${basePath}/README.md`,
      content: generateReadme(slug, enhancedIdea),
    },
  ];

  console.log(`[GitHub] Publicando ${filesToCreate.length} archivos en ${basePath}/`);

  for (const file of filesToCreate) {
    try {
      // Verificar si existe para obtener el SHA (necesario para actualizar)
      let sha = undefined;
      try {
        const existsRes = await axios.get(
          `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${file.path}`,
          { headers }
        );
        sha = existsRes.data.sha;
      } catch {
        // El archivo no existe, se creará nuevo
      }

      const payload = {
        message: `feat(${slug}): ${sha ? 'update' : 'add'} ${file.path.split('/').pop()}`,
        content: Buffer.from(file.content, 'utf-8').toString('base64'),
        branch,
      };

      if (sha) payload.sha = sha;

      await axios.put(
        `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${file.path}`,
        payload,
        { headers }
      );

      console.log(`[GitHub] ✅ ${file.path}`);
    } catch (err) {
      console.error(`[GitHub] ❌ Error en ${file.path}:`, err.response?.data?.message || err.message);
      throw new Error(`Error publicando ${file.path}: ${err.response?.data?.message}`);
    }
  }

  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/main/${basePath}`;
}

// -------------------------------------------------------
// README auto-generado para el proyecto
// -------------------------------------------------------
function generateReadme(slug, idea) {
  const date = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `# ${idea.title || slug}

> ${idea.description || 'Proyecto generado por el Arquitecto de Software por Voz'}

**Generado:** ${date}  
**Arquitecto:** Voice Architect (Evolución Proyecto #5)

## Stack

${(idea.stack || []).map((t) => `- ${t}`).join('\n')}

## Features Clave

${(idea.keyFeatures || []).map((f) => `- ${f}`).join('\n')}

## Arquitectura

${idea.architecture || 'Por definir'}

## Usuario Objetivo

${idea.targetUser || 'Por definir'}

## Estructura SDD

\`\`\`
openspec/${slug}/
├── README.md              ← Este archivo
├── config.yaml            ← Configuración del proyecto
├── specs/
│   └── core.md            ← Especificaciones técnicas
└── changes/
    └── 001-init/
        └── proposal.md    ← Propuesta inicial
\`\`\`

## Próximos Pasos

1. \`/sdd-design\` — Diseño técnico detallado
2. \`/sdd-tasks\` — Desglose de tareas
3. \`/sdd-apply\` — Implementación guiada
`;
}

module.exports = { publishToGitHub };
