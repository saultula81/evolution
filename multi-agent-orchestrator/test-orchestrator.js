const orchestrator = require('./orchestrator');

async function test() {
  console.log('--- TEST 1: Normal Prompt ---');
  const p1 = 'Hola, ¿cómo estás?';
  console.log('Result:', await orchestrator.enhancePrompt(p1));

  console.log('\n--- TEST 2: Skill Trigger (/sdd-explore) ---');
  const p2 = '/sdd-explore Analiza la integración de Engram';
  const result2 = await orchestrator.enhancePrompt(p2);
  console.log('Enhanced Length:', result2.length);
  if (result2.includes('--- AGENT SKILLS ACTIVATED ---')) {
    console.log('SUCCESS: Skill content injected.');
  } else {
    console.log('FAILURE: Skill content NOT injected.');
  }
}

test();
