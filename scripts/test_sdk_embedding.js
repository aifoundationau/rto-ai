const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of env.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[match[1].trim()] = val;
  }
}

const { GoogleGenAI } = require('@google/genai');

async function testSDK() {
  const ai = new GoogleGenAI({ apiKey: envVars.GEMINI_API_KEY });
  console.log('Testing @google/genai SDK embedContent with key:', envVars.GEMINI_API_KEY.substring(0, 10));

  const res = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: 'Bachelor of Computer Science in Australia',
    config: { outputDimensionality: 768 }
  });

  const vals = res.embeddings?.[0]?.values || res.embedding?.values;
  console.log('✅ SDK EmbedContent Result: length =', vals?.length);

  // Also test generation
  console.log('\nTesting @google/genai SDK generateContent (gemini-3.8-flash)...');
  const genRes = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: 'Say Hello in one word.'
  });

  console.log('✅ SDK Generation Output:', genRes.text);
}

testSDK().then(() => process.exit(0)).catch(err => {
  console.error('SDK test failed:', err);
  process.exit(1);
});
