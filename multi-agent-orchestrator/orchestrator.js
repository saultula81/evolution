const fs = require('fs');
const path = require('path');

const cachePath = path.join(__dirname, 'skills-cache.json');

function loadCache() {
  if (!fs.existsSync(cachePath)) return { skills: [] };
  return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
}

async function enhancePrompt(rawPrompt) {
  const cache = loadCache();
  let enhancedPrompt = rawPrompt;
  let detectedSkills = [];

  // Buscar disparadores (ej: /sdd:explore)
  for (const skill of cache.skills) {
    if (rawPrompt.includes(`/${skill.id}`)) {
      detectedSkills.push(skill);
    }
  }

  if (detectedSkills.length > 0) {
    console.log(`[Orchestrator] Detected skills: ${detectedSkills.map(s => s.id).join(', ')}`);
    let contextHeader = "\n\n--- AGENT SKILLS ACTIVATED ---\n";

    for (const skill of detectedSkills) {
      if (fs.existsSync(skill.path)) {
        const content = fs.readFileSync(skill.path, 'utf8');
        contextHeader += `\n[Skill: ${skill.name}]\n${content}\n`;
      }
    }

    contextHeader += "\n--- END OF SKILLS ---\n\n";
    enhancedPrompt = contextHeader + rawPrompt;
  }

  return enhancedPrompt;
}

module.exports = { enhancePrompt };
