const fs = require('fs');
const path = require('path');
const startup = require('../startup');

describe('Startup Optimization', () => {
  const cachePath = path.join(__dirname, '../skills-cache.json');

  test('should generate skills-cache.json on startup', async () => {
    // Delete cache if exists
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

    await startup.init();

    expect(fs.existsSync(cachePath)).toBe(true);
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    expect(Array.isArray(cache.skills)).toBe(true);
  });
});
