const fs = require('fs');
const path = require('path');

describe('Skills Integrity', () => {
  const skillsPath = path.join(__dirname, '../../skills');

  test('should not have duplicate skill names', () => {
    const rawSkills = fs.readdirSync(skillsPath);
    const names = new Set();
    const duplicates = [];

    rawSkills.forEach(skillPath => {
      const fullPath = path.join(skillsPath, skillPath);
      let skillName = skillPath;

      if (fs.statSync(fullPath).isDirectory()) {
        const skillFile = path.join(fullPath, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const content = fs.readFileSync(skillFile, 'utf8');
          const match = content.match(/name:\s*(.*)/);
          if (match) skillName = match[1].trim();
        }
      }

      if (names.has(skillName)) {
        duplicates.push(skillName);
      }
      names.add(skillName);
    });

    expect(duplicates).toEqual([]);
  });
});
