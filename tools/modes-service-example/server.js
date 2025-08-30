const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Config via env vars
// PUBLIC_DOMAIN: optional base domain for constructing wss urls (e.g. gloobix-io.onrender.com)
// If PUBLIC_DOMAIN is provided, service will create wss urls like: wss://<subdomain>.<PUBLIC_DOMAIN><wsPath>
// Otherwise it will return static urls if present in staticModes
const PUBLIC_DOMAIN = process.env.PUBLIC_DOMAIN || null;
const PORT = process.env.PORT || 5000;

// Example static modes - you can override via MODELIST env with JSON string
const staticModes = [
  { id: 'classic', name: 'Classic FFA', wsPath: '/socket', hintPort: 3002 },
  { id: 'teams', name: 'Teams', wsPath: '/socket', hintPort: 10001 },
  { id: 'battle-royale', name: 'Battle Royale', wsPath: '/socket', hintPort: 10002 }
];

function buildModes() {
  try {
    if (process.env.MODELIST) return JSON.parse(process.env.MODELIST);
  } catch (e) {
    console.warn('MODELIST parse failed, using static list');
  }
  const modes = staticModes.map(m => ({ ...m }));
  if (PUBLIC_DOMAIN) {
    modes.forEach(m => {
      // Construct subdomain-based wss url: <id>.<PUBLIC_DOMAIN>
      m.url = `wss://${m.id}.${PUBLIC_DOMAIN}${m.wsPath}`;
    });
  } else {
    // If no public domain provided, include example localhost hints
    modes.forEach(m => {
      m.url = `ws://localhost:${m.hintPort}${m.wsPath}`;
    });
  }
  return modes;
}

// Optional API key protection: set MODE_API_KEY env var to require clients
const MODE_API_KEY = process.env.MODE_API_KEY || null;
app.get('/modes', (req, res) => {
  if (MODE_API_KEY) {
    const provided = req.get('x-mode-api-key') || req.query.api_key || null;
    if (!provided || provided !== MODE_API_KEY) return res.status(401).json({ error: 'unauthorized' });
  }
  res.json(buildModes());
});

app.get('/', (req, res) => {
  res.send('Modes service alive. GET /modes');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => console.log(`Modes service listening on port ${PORT}`));
