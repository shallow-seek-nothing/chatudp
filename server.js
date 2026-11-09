#!/usr/bin/env node
'use strict';

/**
 * chatudp — 匿名「UDP 随机接龙」聊天室  V0.1
 *
 * 单文件 · 零依赖 · 零数据库 · 全部状态只存在内存里。
 *
 * 页面结构（public/ 静态文件，全部由本文件托管）：
 *   /            落地页（MolaChaos / Shallow & Seek Nothing）
 *   /chat        匿名聊天室
 *   /assets/*    logo、主题、i18n 等静态资源
 *
 * 一次消息的完整路径：
 *
 *   浏览器 POST /api/send
 *        │  UUID 限流（10 秒 5 条）+ 正则风控（链接 / 长数字串），命中即静默丢弃
 *        ▼
 *   HTTP 层 dgram.send(JSON)  ──UDP──▶  本机 127.0.0.1:47800 的 UDP 接收器
 *        │                                     │
 *        │                                     ▼
 *        │                              随机挑选一名在线用户
 *        ▼                                     │
 *   （发送方 200，前端更新「你的上一句」）         ▼
 *                                     SSE 下发「别人的回复」；
 *                                     前端旧消息渐隐粉碎、新消息浮现
 *
 * 在线用户只存在 users 这个 Map 里（SSE 长连接即「在线」），
 * 消息内容不落盘、不记录日志，进程重启即全部消失。
 */

const http = require('node:http');
const dgram = require('node:dgram');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 80);
const UDP_PORT = Number(process.env.UDP_PORT || 47800);
const VERSION = 'V0.1';

const PUBLIC_DIR = path.join(__dirname, 'public');

const MAX_TEXT = 200;          // 单条消息最大长度（字符）
const RATE_WINDOW_MS = 10000;  // 限流窗口：10 秒
const RATE_LIMIT = 5;          // 窗口内最多 5 条
const MAX_BODY_BYTES = 4096;   // /api/send 请求体上限，防大包

// OpenAI 兼容 API 配置
const API_MAX_BODY_BYTES = 256 * 1024;                 // /v1/chat/completions 请求体上限
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS || 15000); // 等真人回复的超时
const API_MODEL_ID = 'MolaChaos-0.5K-V0.1-1110';

// 风控正则：链接域名 / 6 位以上连续数字（手机号、QQ 号等）
const BLOCK_URL = /(?:https?:\/\/|ftp:\/\/|www\.)/i;
const BLOCK_LONG_DIGITS = /\d{6,}/;

/** @type {Map<string, {res: http.ServerResponse, since: number}>} 在线用户（uuid -> SSE 连接） */
const users = new Map();
/** @type {Map<string, number[]>} 每个 uuid 最近的发送时间戳，用于滑动窗口限流 */
const rates = new Map();

/* ------------------------------------------------------------ 静态文件托管 */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2'
};

/** 把 URL 路径安全地映射到 public/ 下的真实文件；越界返回 null。 */
function resolvePublic(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch (err) {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const clean = decoded.replace(/^[/\\]+/, '');
  const full = path.join(PUBLIC_DIR, clean);
  if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + path.sep)) return null;
  return full;
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) return serveText(res, 404, 'not found');
    res.writeHead(200, {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=600'
    });
    res.end(data);
  });
}

function serveText(res, code, text) {
  res.writeHead(code, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(text);
}

function serveAsset(res, urlPath) {
  const filePath = resolvePublic(urlPath);
  if (!filePath) return serveText(res, 403, 'forbidden');
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return serveText(res, 404, 'not found');
    serveFile(res, filePath);
  });
}

/* ---------------------------------------------------------------- 工具函数 */

function validUuid(v) {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);
}

/** 给一个在线节点投递事件；返回是否成功。 */
function pushTo(user, event, data) {
  if (!user || typeof user.deliver !== 'function') return false;
  try {
    return user.deliver(event, data) !== false;
  } catch (err) {
    return false;
  }
}

function broadcastPresence() {
  const online = users.size;
  for (const user of users.values()) pushTo(user, 'presence', { online });
}

/** 滑动窗口限流：10 秒内最多 5 条，超限返回 false（静默丢弃）。 */
function rateAllowed(uuid) {
  const now = Date.now();
  let times = rates.get(uuid);
  if (!times) {
    times = [];
    rates.set(uuid, times);
  }
  while (times.length > 0 && now - times[0] >= RATE_WINDOW_MS) times.shift();
  if (times.length >= RATE_LIMIT) return false;
  times.push(now);
  return true;
}

/** 极简风控：链接、长串数字一律拦截。 */
function blocked(text) {
  return BLOCK_URL.test(text) || BLOCK_LONG_DIGITS.test(text);
}

function readBody(req, limit) {
  const max = limit || MAX_BODY_BYTES;
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > max) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ------------------------------------------------------------ UDP 随机接龙 */

const udp = dgram.createSocket('udp4');
let deliveredCount = 0;

/**
 * UDP 接收器：按接龙规则投递。
 *
 *  - 带 replyTo：这是「收到消息后的回复」，直接送回原发送者（type=reply）；
 *  - 否则是新消息：随机挑一个在线用户（type=new）；
 *    如果带了 avoid（刚刚对话过的人），在还有别的候选时避开他，制造混乱。
 */
function relay(packet) {
  if (!packet || packet.k !== 'msg' || !validUuid(packet.from) || typeof packet.text !== 'string') return;

  const from = packet.from;
  const now = Date.now();

  // 1) 直接回复：回到收到消息的那个人
  const replyTo = packet.replyTo;
  if (validUuid(replyTo) && replyTo !== from) {
    const target = users.get(replyTo);
    if (target && pushTo(target, 'incoming', { text: packet.text, from, type: 'reply', ts: now })) {
      deliveredCount += 1;
      return;
    }
  }

  // 2) 新消息：随机挑一个在线真人（尽量避开刚刚对话过的人）
  const others = [];
  for (const [id, u] of users) {
    // API 等待者只接收直接回复，不作为随机投递目标
    if (id !== from && u.kind !== 'api') others.push(id);
  }
  // 没有其他在线用户时不回环给自己：直接丢弃（UDP 丢包语义）。
  if (others.length === 0) return;

  let pool = others;
  if (validUuid(packet.avoid) && others.length > 1) {
    const filtered = others.filter((id) => id !== packet.avoid);
    if (filtered.length > 0) pool = filtered;
  }

  // Fisher–Yates 洗牌，保证均匀随机。
  for (let i = pool.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  for (const id of pool) {
    const user = users.get(id);
    if (!user) continue;
    if (pushTo(user, 'incoming', { text: packet.text, from, type: 'new', ts: now })) {
      deliveredCount += 1;
      return;
    }
    users.delete(id); // 连接已死，清掉再换下一个
  }
  // 一个活人都没有：静默丢弃。
}

udp.on('message', (buf) => {
  let packet;
  try {
    packet = JSON.parse(buf.toString('utf8'));
  } catch (err) {
    return;
  }
  relay(packet);
});

udp.on('error', (err) => {
  console.error('[udp] error:', err.message);
});

udp.bind(UDP_PORT, '127.0.0.1', () => {
  console.log('[udp] relay listening on 127.0.0.1:' + UDP_PORT);
});

/* ---------------------------------------------------------------- HTTP 层 */

async function handleSend(req, res) {
  // 任何异常都静默：风控与限流不向客户端暴露原因。
  const silent = () => {
    res.writeHead(204);
    res.end();
  };

  try {
    const body = await readBody(req);
    let data;
    try {
      data = JSON.parse(body);
    } catch (err) {
      return silent();
    }
    if (!data || typeof data !== 'object') return silent();

    const uuid = data.uuid;
    if (!validUuid(uuid) || !users.has(uuid)) return silent();

    let text = typeof data.text === 'string' ? data.text : '';
    text = text.replace(/[\u0000-\u001f\u007f\u200b-\u200f]/g, '').trim();
    if (!text) return silent();
    if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT);

    if (!rateAllowed(uuid)) return silent();   // 10 秒 > 5 条：静默丢弃
    if (blocked(text)) return silent();        // 链接 / 长数字串：静默拦截

    // 回复目标（收到消息后可直回发送者）与避让者（刚对话过的人）
    const replyTo = typeof data.replyTo === 'string' && validUuid(data.replyTo) ? data.replyTo : null;
    const avoid = typeof data.avoid === 'string' && validUuid(data.avoid) ? data.avoid : null;

    // 消息以 UDP 报文发往本机接收器，由它按接龙规则投递。
    udp.send(
      Buffer.from(JSON.stringify({ k: 'msg', from: uuid, text, ts: Date.now(), replyTo, avoid }), 'utf8'),
      UDP_PORT,
      '127.0.0.1'
    );

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, version: VERSION }));
  } catch (err) {
    silent();
  }
}

/* ---------------------------------------------------------- OpenAI 兼容 API */

function corsHeaders(extra) {
  return Object.assign({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  }, extra || {});
}

function sendApiJson(res, status, payload) {
  if (res.writableEnded || res.destroyed) return;
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache'
  }, corsHeaders()));
  res.end(JSON.stringify(payload));
}

function openAiError(message, type) {
  return { error: { message: message, type: type || 'invalid_request_error' } };
}

/** 取最后一条 user 消息的文本（兼容 content 为字符串或分段数组）。 */
function extractUserText(messages) {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== 'user') continue;
    if (typeof m.content === 'string') return m.content.trim();
    if (Array.isArray(m.content)) {
      return m.content
        .filter((p) => p && (p.type === 'text' || p.type === 'input_text') && typeof p.text === 'string')
        .map((p) => p.text)
        .join('')
        .trim();
    }
  }
  return '';
}

let apiSeq = 0;
function newCompletionId() {
  apiSeq += 1;
  return 'chatcmpl-mola-' + Date.now().toString(36) + '-' + apiSeq;
}

/**
 * 把一个 API 调用方注册成「只收回复」的节点：它不算在线真人，
 * 但如果真人回复它，就能直接收到（replyTo 命中）。
 */
function waitForCarbonNode(apiId) {
  let settled = false;
  let timer = null;
  let settle = null;
  const user = {
    kind: 'api',
    since: Date.now(),
    deliver(event, data) {
      if (event !== 'incoming') return true; // 只关心回复，其它事件无视但不掉线
      if (settled) return true;
      settled = true;
      clearTimeout(timer);
      if (users.get(apiId) === user) users.delete(apiId);
      settle({ ok: true, text: String((data && data.text) || ''), from: (data && data.from) || null });
      return true;
    }
  };
  const promise = new Promise((resolve) => { settle = resolve; });
  timer = setTimeout(() => {
    if (settled) return;
    settled = true;
    if (users.get(apiId) === user) users.delete(apiId);
    settle({ ok: false, reason: 'timeout' });
  }, API_TIMEOUT_MS);
  users.set(apiId, user);
  return {
    promise: promise,
    cancel: function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (users.get(apiId) === user) users.delete(apiId);
      settle({ ok: false, reason: 'cancelled' });
    }
  };
}

/** 把回复切成小片，模拟流式输出。 */
function splitForStream(text) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const step = 1 + (i % 3);
    chunks.push(text.slice(i, i + step));
    i += step;
  }
  return chunks;
}

async function handleChatCompletions(req, res) {
  let body;
  try {
    body = JSON.parse(await readBody(req, API_MAX_BODY_BYTES));
  } catch (err) {
    return sendApiJson(res, 400, openAiError('Invalid JSON body.'));
  }
  if (!body || typeof body !== 'object') {
    return sendApiJson(res, 400, openAiError('Invalid JSON body.'));
  }

  const model = typeof body.model === 'string' ? body.model : '';
  // 模型校验：包含 MolaChaos 即可（忽略大小写）；Authorization 一律放行
  if (!model.toLowerCase().includes('molachaos')) {
    return sendApiJson(res, 400, { error: { message: 'Only MolaChaos is available.' } });
  }

  const userText = extractUserText(body.messages);
  if (!userText) {
    return sendApiJson(res, 400, openAiError('No user message provided.'));
  }

  const stream = body.stream === true;
  const completionId = newCompletionId();
  const created = Math.floor(Date.now() / 1000);
  const apiId = crypto.randomUUID();

  const waiter = waitForCarbonNode(apiId);
  res.on('close', function () {
    if (!res.writableEnded) waiter.cancel();
  });

  // 调用方也作为一个「节点」上线，然后把这句话经 UDP 随机接龙丢给一个真人
  udp.send(
    Buffer.from(JSON.stringify({
      k: 'msg',
      from: apiId,
      text: userText.slice(0, MAX_TEXT),
      ts: Date.now(),
      replyTo: null,
      avoid: null
    }), 'utf8'),
    UDP_PORT,
    '127.0.0.1'
  );

  if (stream) {
    res.writeHead(200, Object.assign({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }, corsHeaders()));
    res.write(': connected\n\n');
  }

  const result = await waiter.promise;
  if (res.writableEnded || res.destroyed || result.reason === 'cancelled') return;

  // 15 秒没人回：发一个带报错信息的 chunk，然后结束
  if (!result.ok) {
    if (stream) {
      const errChunk = {
        id: completionId,
        object: 'chat.completion.chunk',
        created: created,
        model: model,
        choices: [{
          index: 0,
          delta: { content: '[System] Packet dropped. 碳基节点未响应。' },
          finish_reason: null
        }],
        error: { message: 'Carbon node is touching grass.', type: 'timeout' }
      };
      res.write('data: ' + JSON.stringify(errChunk) + '\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      sendApiJson(res, 503, Object.assign(
        openAiError('Carbon node is touching grass.', 'timeout'),
        { carbon_node: null }
      ));
    }
    return;
  }

  const carbonNode = result.from || null;

  if (stream) {
    const pieces = splitForStream(result.text);
    let i = 0;
    const next = () => {
      if (res.writableEnded || res.destroyed) return;
      if (i < pieces.length) {
        const chunk = {
          id: completionId,
          object: 'chat.completion.chunk',
          created: created,
          model: model,
          choices: [{ index: 0, delta: { content: pieces[i] }, finish_reason: null }]
        };
        res.write('data: ' + JSON.stringify(chunk) + '\n\n');
        i += 1;
        setTimeout(next, 16);
      } else {
        const tail = {
          id: completionId,
          object: 'chat.completion.chunk',
          created: created,
          model: model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
          carbon_node: carbonNode
        };
        res.write('data: ' + JSON.stringify(tail) + '\n\n');
        res.write('data: [DONE]\n\n');
        res.end();
      }
    };
    next();
  } else {
    sendApiJson(res, 200, {
      id: completionId,
      object: 'chat.completion',
      created: created,
      model: model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: result.text },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      carbon_node: carbonNode
    });
  }
}

function handleStream(req, res, url) {
  const uuid = url.searchParams.get('uuid') || '';
  if (!validUuid(uuid)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('bad uuid');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });
  res.write(': connected\n\n');
  if (res.socket) res.socket.setNoDelay(true);

  // 同一 uuid 重复连接（刷新 / 重连）时，顶掉旧连接，保持「一个用户一条连接」。
  const old = users.get(uuid);
  if (old && old.kind === 'sse' && old.res !== res) {
    try { old.res.end(); } catch (err) { /* ignore */ }
  }

  const user = {
    kind: 'sse',
    since: Date.now(),
    deliver(event, data) {
      if (!res || res.writableEnded || res.destroyed) return false;
      res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
      return true;
    }
  };
  users.set(uuid, user);
  pushTo(user, 'hello', { uuid, online: users.size, version: VERSION });
  broadcastPresence();

  const cleanup = () => {
    if (users.get(uuid) === user) {
      users.delete(uuid);
      broadcastPresence();
    }
    try { res.end(); } catch (err) { /* ignore */ }
  };
  req.on('close', cleanup);
  res.on('error', cleanup);
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch (err) {
    serveText(res, 400, 'bad request');
    return;
  }
  const pathname = url.pathname;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
    return;
  }

  if (req.method === 'GET' && (pathname === '/chat' || pathname === '/chat/')) {
    serveFile(res, path.join(PUBLIC_DIR, 'chat.html'));
    return;
  }

  if (req.method === 'GET' && (pathname === '/api' || pathname === '/api/')) {
    serveFile(res, path.join(PUBLIC_DIR, 'api.html'));
    return;
  }

  // ---- OpenAI 兼容 API ----
  // CORS 预检：任意 /v1/* 一律 204
  if (req.method === 'OPTIONS' && pathname.indexOf('/v1/') === 0) {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/v1/models') {
    res.writeHead(200, Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    }, corsHeaders()));
    res.end(JSON.stringify({
      object: 'list',
      data: [{
        id: API_MODEL_ID,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'molachaos'
      }]
    }));
    return;
  }

  if (req.method === 'POST' && pathname === '/v1/chat/completions') {
    handleChatCompletions(req, res);
    return;
  }

  if (req.method === 'GET' && pathname === '/favicon.ico') {
    serveFile(res, path.join(PUBLIC_DIR, 'assets', 'favicon.png'));
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/assets/')) {
    serveAsset(res, pathname);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/stream') {
    handleStream(req, res, url);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/send') {
    handleSend(req, res);
    return;
  }

  if (req.method === 'GET' && pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      version: VERSION,
      online: users.size,
      delivered: deliveredCount,
      uptime: Math.round(process.uptime())
    }));
    return;
  }

  serveText(res, 404, 'not found');
});

/* ------------------------------------------------------------ 心跳与退出 */

// SSE 长连接保活：每 20 秒一个注释行，顺便清掉已经死掉的连接。
const heartbeat = setInterval(() => {
  for (const [uuid, user] of users) {
    if (!pushTo(user, 'ping', { t: Date.now() })) {
      users.delete(uuid);
    }
  }
}, 20000);
heartbeat.unref();

// 定期清理限流表，避免有人换 uuid 刷内存。
const rateGC = setInterval(() => {
  const now = Date.now();
  for (const [uuid, times] of rates) {
    while (times.length > 0 && now - times[0] >= RATE_WINDOW_MS) times.shift();
    if (times.length === 0) rates.delete(uuid);
  }
}, 60000);
rateGC.unref();

function shutdown(signal) {
  console.log('[' + signal + '] shutting down…');
  for (const user of users.values()) {
    try { user.res.end(); } catch (err) { /* ignore */ }
  }
  users.clear();
  try { udp.close(); } catch (err) { /* ignore */ }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.on('error', (err) => {
  console.error('[http] error:', err.message);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('chatudp ' + VERSION + ' listening on 0.0.0.0:' + PORT);
});
