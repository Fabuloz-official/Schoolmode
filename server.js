const http = require('http');

// =====================================================================
//  📰 NEWS — edit this section to update news
// =====================================================================
const NEWS = [
  {
    id: 1,
    category: "tip",
    title: "Hey what do you think ?",
    date: "2025-04-01",
    content: `hey what do you think of school mode ? you like it ? want improvments ? you can just put a comment on the chrome web store and there is even beter for supporting us you can tip us kofi ! Thank you for all of that support because school mode is a tool for students by students so consider tiping (spoiler alert : at 5 euros there will be an mobile app).`
  },
  {
    id: 2,
    category: "update",
    title: "School Mode v5.3 released!",
    date: "2025-03-29",
    content: `✨ What's New
• 8 profile themes — Purple, Forest, Sunset, Ocean, Cherry, Midnight, Candy, Arctic
• News feed — Built-in news client with local cache fallback
• Import / Export — Floating button with profile preview before import
• Changelog modal — "What's new" button directly in options

🛠 Improvements
• Unsaved changes bar with Cancel / Save actions
• Real-time site counter in options
• Cleaner auto-disable: removes all DNR rules + unmutes and reloads blocked tabs
• debounce on inputs to prevent unnecessary saves

🐛 Bug Fixes
• Service Worker timers lost on suspension → migrated to chrome.alarms
• Blocked tabs not reloaded on disable → auto-reload after 500ms

⚠️ Migration note — Existing profiles without a theme will default to purple!`
  },
  {
    id: 1,
    category: "announcement",
    title: "test",
    date: "2026-04-01",
    content: `test`
  }
];

// =====================================================================
//  Server
// =====================================================================
const PORT = process.env.PORT || 25565;

// Simple in-memory rate limiting (per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX    = 20;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodic cleanup every 5 min
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
  console.log(`✅ School Mode News Server running on port ${PORT}`);
  console.log(`   /news   → ${NEWS.length} article(s)`);
  console.log(`   /health → status check`);
});
