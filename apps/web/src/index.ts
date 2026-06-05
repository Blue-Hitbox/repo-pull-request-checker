import express from 'express';
import bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_SECRET = process.env.DASHBOARD_API_SECRET;

if (!API_SECRET) {
  console.warn('WARNING: DASHBOARD_API_SECRET is not set. API is insecure.');
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple JSON file for storage
const STORAGE_FILE = path.join(__dirname, '..', 'storage.json');

interface UserKeys {
  [owner: string]: {
    [provider: string]: string;
  };
}

function loadKeys(): UserKeys {
  if (fs.existsSync(STORAGE_FILE)) {
    return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
  }
  return {};
}

function saveKeys(keys: UserKeys) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(keys, null, 2));
}

// API for the bot to fetch keys - requires secret
app.get('/api/keys/:owner/:provider', (req, res) => {
  const authHeader = req.headers.authorization;
  if (API_SECRET && authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { owner, provider } = req.params;
  const keys = loadKeys();
  const apiKey = keys[owner]?.[provider];

  if (apiKey) {
    res.json({ apiKey });
  } else {
    res.status(404).json({ error: 'Key not found' });
  }
});

// API for the user to save keys
app.post('/api/keys', (req, res) => {
  const { owner, provider, apiKey } = req.body;
  if (!owner || !provider || !apiKey) {
    return res.status(400).json({ error: 'Missing owner, provider, or apiKey' });
  }

  const keys = loadKeys();
  if (!keys[owner]) {
    keys[owner] = {};
  }
  keys[owner][provider] = apiKey;
  saveKeys(keys);

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Dashboard listening at http://localhost:${port}`);
});
