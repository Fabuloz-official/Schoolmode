const http = require('http');

// =====================================================================
//  📰 TES NEWS — édite cette section pour mettre à jour les news
// =====================================================================
const NEWS = [
    {
    id: 1,
    category: 'tip',   // "update" | "tip" | "alert"
    title: 'test',
    content: 'test',
    date: '2025-03-27'
    },
    {
    id: 1,
    category: 'update',   // "update" | "tip" | "alert"
    title: 'School Mode v5.3 released!',
    content: 'Auto translation is now working and the new news système is now in opperation !',
    date: '2025-03-27'
  }
  ];

// =====================================================================
//  Serveur
// =====================================================================
const PORT = process.env.PORT || 25565;

// Rate limiting simple (par IP, en mémoire)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX    = 20;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Nettoyage périodique de la map (toutes les 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.start > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-API-Key');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
}

function sendJSON(res, status, data) {
  setCORSHeaders(res);
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const ip  = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const url = req.url.split('?')[0];

  console.log(`[${new Date().toISOString()}] ${req.method} ${url} — ${ip}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Rate limiting
  if (isRateLimited(ip)) {
    sendJSON(res, 429, { error: 'Too many requests — slow down' });
    return;
  }

  // GET /news
  if (req.method === 'GET' && url === '/news') {
    sendJSON(res, 200, {
      news:       NEWS,
      total:      NEWS.length,
      version:    '5.3.0',
      serverTime: Date.now()
    });
    return;
  }

  // GET /health
  if (req.method === 'GET' && url === '/health') {
    sendJSON(res, 200, {
      status:    'ok',
      uptime:    Math.floor(process.uptime()),
      version:   '5.3.0',
      newsCount: NEWS.length,
      timestamp: Date.now()
    });
    return;
  }

  // 404
  sendJSON(res, 404, { error: 'Not found', path: url });
});

server.listen(PORT, () => {
  console.log(`✅ School Mode News Server démarré sur le port ${PORT}`);
  console.log(`   /news   → ${NEWS.length} articles`);
  console.log(`   /health → status check`);
});
