const orchestrator = require('./orchestrator');

async function testtechlead() {
  console.log('--- TEST: Tech Lead Trigger (/tech-lead) ---');
  const prompt = '/tech-lead Revisa esta propuesta: usar Tailwind CSS para el nuevo dashboard.';
  const enhanced = await orchestrator.enhancePrompt(prompt);

  if (enhanced.includes('[Skill: tech-lead]')) {
    console.log('SUCCESS: Tech Lead skill content injected correctly.');
    console.log('\n--- Context Preview ---');
    console.log(enhanced.substring(0, 500) + '...');
  } else {
    console.log('FAILURE: Tech Lead skill content NOT found.');
    console.log('Skill list in cache might be desynchronized.');
  }
}

testtechlead();
