const fs = require('fs');
const path = require('path');

const skillsPath = path.join(__dirname, '../skills');
const cachePath = path.join(__dirname, 'skills-cache.json');

async function init() {
  console.log('[Startup] Optimizing skills loading...');
  const rawSkills = fs.readdirSync(skillsPath);
  const cache = {
    updated_at: new Date().toISOString(),
    skills: []
  };

  for (const skillItem of rawSkills) {
    const fullPath = path.join(skillsPath, skillItem);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      const skillFile = path.join(fullPath, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf8');
        const nameMatch = content.match(/name:\s*(.*)/);
        const descMatch = content.match(/description:\s*(.*)/);

        cache.skills.push({
          id: skillItem,
          name: nameMatch ? nameMatch[1].trim() : skillItem,
          description: descMatch ? descMatch[1].trim() : '',
          path: skillFile
        });
      }
    }
  }

  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  console.log(`[Startup] Cache generated with ${cache.skills.length} skills.`);
}

module.exports = { init };
