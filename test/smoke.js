'use strict';

/**
 * chatudp 冒烟测试（零依赖）
 *
 * 用法：
 *   BASE=http://127.0.0.1:8080 node test/smoke.js
 *   node test/smoke.js http://127.0.0.1:80
 *
 * 覆盖：页面、SSE 在线、随机投递、单人回环、限流、正则风控、参数校验。
 */

const http = require('node:http');
const crypto = require('node:crypto');

const BASE = process.env.BASE || process.argv[2] || 'http://127.0.0.1:8080';

let passed = 0;
let failed = 0;

function ok(name, cond, extra) {
  if (cond) {
    passed += 1;
    console.log('  PASS  ' + name);
  } else {
    failed += 1;
    console.log('  FAIL  ' + name + (extra ? '  -> ' + extra : ''));
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(BASE + path, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

function post(uuid, text, extra) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(Object.assign({ uuid, text }, extra || {}));
    const req = http.request(
      BASE + '/api/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', reject);
    req.end(body);
  });
}

function requestJson(method, path, payload, headers) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const req = http.request(BASE + path, {
      method: method,
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }, headers || {})
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

function parseEvent(raw) {
  let event = 'message';
  const dataLines = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith('event: ')) event = line.slice(7).trim();
    else if (line.startsWith('data: ')) dataLines.push(line.slice(6));
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch (err) {
    return null;
  }
}

/** 打开一条 SSE 连接，返回可等待事件的客户端。 */
function stream(uuid) {
  return new Promise((resolve, reject) => {
    const req = http.get(BASE + '/api/stream?uuid=' + encodeURIComponent(uuid), (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('stream status ' + res.statusCode));
        return;
      }
      const client = {
        events: [],
        waiters: [],
        closed: false,
        close() {
          if (this.closed) return;
          this.closed = true;
          req.destroy();
        }
      };
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        buf += chunk;
        let idx;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const ev = parseEvent(buf.slice(0, idx));
          buf = buf.slice(idx + 2);
          if (!ev) continue;
          client.events.push(ev);
          for (const w of [...client.waiters]) {
            w.check(ev);
          }
        }
      });
      res.on('error', () => {});
      resolve(client);
    });
    req.on('error', reject);
  });
}

/** 等待某事件出现（先查历史，再挂等待器）。 */
function waitFor(client, name, timeoutMs = 2000) {
  const hit = client.events.find((e) => e.event === name);
  if (hit) {
    client.events = client.events.filter((e) => e !== hit);
    return Promise.resolve(hit);
  }
  return new Promise((resolve, reject) => {
    const waiter = {
      check(ev) {
        if (ev.event !== name) return;
        client.waiters = client.waiters.filter((w) => w !== waiter);
        client.events = client.events.filter((e) => e !== ev);
        clearTimeout(timer);
        resolve(ev);
      }
    };
    const timer = setTimeout(() => {
      client.waiters = client.waiters.filter((w) => w !== waiter);
      reject(new Error('timeout waiting for "' + name + '"'));
    }, timeoutMs);
    client.waiters.push(waiter);
  });
}

function newUuid() {
  try {
    return crypto.randomUUID();
  } catch (err) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

async function main() {
  console.log('chatudp smoke test @ ' + BASE + '\n');

  // 1. 落地页
  const page = await get('/');
  ok('GET / = 200', page.status === 200, String(page.status));
  ok('落地页含品牌名', /Shallow &amp; Seek Nothing/.test(page.body));
  ok('落地页含 MolaChaos', /MolaChaos/.test(page.body));
  ok('落地页默认英文标题', /Drift shallow\. Seek nothing\./.test(page.body));
  ok('落地页含中英文切换', /data-lang-btn="zh"/.test(page.body) && /data-lang-btn="en"/.test(page.body));
  ok('落地页无 APP 下载入口', !/获取\s*APP/.test(page.body));

  // 2. 聊天页
  const chat = await get('/chat');
  ok('GET /chat = 200', chat.status === 200, String(chat.status));
  ok('聊天页含 ChatUDP', /ChatUDP/.test(chat.body));
  ok('聊天页含胶囊', /MolaChaos-0\.5K V0\.1 1110/.test(chat.body));
  ok('聊天页含逃生出口', /逃生出口/.test(chat.body));
  ok('聊天页含记录流行样式', /line-question/.test(chat.body) && /line-reply/.test(chat.body) && /line-system/.test(chat.body));
  const i18nJs = await get('/assets/i18n.js');
  ok('i18n 含丢包提示', /Packet dropped/.test(i18nJs.body));
  const sitesJs = await get('/assets/escape-sites.js');
  ok('逃生出口站点清单非空', /https:\/\//.test(sitesJs.body));

  // 2.5 API 接入页
  const apiPage = await get('/api');
  ok('GET /api = 200', apiPage.status === 200, String(apiPage.status));
  ok('API 页含 API Keys', /API Keys/.test(apiPage.body));
  ok('API 页含接口文档导航', /data-i18n="navDocs"/.test(apiPage.body) && /接口文档/.test(i18nJs.body));
  ok('API 页含模型名', /MolaChaos-0\.5K V0\.1 1110/.test(apiPage.body));
  ok('API 页含 OpenAI 兼容说明', /OpenAI/.test(apiPage.body));

  // 3. healthz
  const health = await get('/healthz');
  ok('GET /healthz = 200', health.status === 200, String(health.status));
  ok('healthz 版本', /"version":"V0\.1"/.test(health.body), health.body);

  // 4. 两个在线用户
  const idA = newUuid();
  const idB = newUuid();
  const a = await stream(idA);
  const b = await stream(idB);
  const helloA = await waitFor(a, 'hello');
  const helloB = await waitFor(b, 'hello');
  ok('A 收到 hello', helloA.data.uuid === idA);
  ok('B 收到 hello', helloB.data.uuid === idB);
  const health2 = await get('/healthz');
  ok('healthz 在线数 = 2', /"online":2/.test(health2.body), health2.body);

  // 4. 随机接龙：A 发 → B 收（此时只有 B 是候选）
  const st = await post(idA, '你好，陌生人');
  ok('A 发送返回 200', st === 200, String(st));
  const got = await waitFor(b, 'incoming');
  ok('B 收到消息内容', got.data.text === '你好，陌生人', JSON.stringify(got.data.text));
  await sleep(200);
  ok('A 不收回自己的消息', !a.events.some((e) => e.event === 'incoming'));

  // 5. 限流：A 已发 1 条，再发 5 条 → 4 条 200，2 条 204
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push(await post(idA, '限流测试 ' + i));
  const accepted = statuses.filter((s) => s === 200).length;
  const dropped = statuses.filter((s) => s === 204).length;
  ok('10 秒窗口内最多 5 条（已发 1 + 再收 4）', accepted === 4 && dropped === 1, JSON.stringify(statuses));

  // 6. 正则风控（新用户 C，避开限流）
  const idC = newUuid();
  const c = await stream(idC);
  await waitFor(c, 'hello');
  a.events.length = 0;
  b.events.length = 0;
  const link = await post(idC, '看看这个 http://example.com 吧');
  const digits = await post(idC, '我的电话是 13800138000');
  const wwwLink = await post(idC, '访问 www.abc.com');
  const allowed = await post(idC, '短数字 12345 应该放行');
  ok('拦截 http 链接', link === 204, String(link));
  ok('拦截长串数字', digits === 204, String(digits));
  ok('拦截 www 链接', wwwLink === 204, String(wwwLink));
  ok('放行普通文本', allowed === 200, String(allowed));

  // 被放行的那条会随机落到 A 或 B；被拦截的必须一条都不出现。
  let landed = null;
  for (let i = 0; i < 40 && !landed; i++) {
    landed = [...a.events, ...b.events].find(
      (e) => e.event === 'incoming' && e.data.text === '短数字 12345 应该放行'
    ) || null;
    if (!landed) await sleep(50);
  }
  const leaked = [...a.events, ...b.events].filter(
    (e) => e.event === 'incoming' && /example\.com|13800138000|abc\.com/.test(e.data.text)
  );
  ok('放行文本送达 A 或 B', landed !== null);
  ok('被拦截的内容不会投递', landed !== null && leaked.length === 0, leaked.length + ' leaked');

  // 7. 参数校验
  ok('未知 uuid 发送静默 204', (await post(newUuid(), 'hi')) === 204);
  const badUuid = await get('/api/stream?uuid=' + encodeURIComponent('bad!'));
  ok('非法 uuid 建流 400', badUuid.status === 400, String(badUuid.status));

  // 7.5 在线人数随断开回落：B 关闭后，A 应收到 presence，healthz 显示 2 人（A、C）
  a.events = a.events.filter((e) => e.event !== 'presence');
  b.close();
  await sleep(500);
  const health3 = await get('/healthz');
  ok('B 断开后在线数回落到 2', /"online":2/.test(health3.body), health3.body);
  ok('A 收到 presence 在线数变化', a.events.some((e) => e.event === 'presence' && e.data.online === 2));

  // 8. 单人发送不回环（UDP 丢包语义）
  a.close();
  b.close();
  c.close();
  await sleep(250);
  const idD = newUuid();
  const d = await stream(idD);
  await waitFor(d, 'hello');
  const beforeDelivered = JSON.parse((await get('/healthz')).body).delivered;
  const stD = await post(idD, '只剩我一个人');
  ok('单人发送仍返回 200', stD === 200, String(stD));
  await sleep(350);
  const afterDelivered = JSON.parse((await get('/healthz')).body).delivered;
  ok('单人时消息不回环给自己', afterDelivered === beforeDelivered, beforeDelivered + ' -> ' + afterDelivered);
  ok('单人时不会收到自己的消息', !d.events.some((e) => e.event === 'incoming'));
  d.close();

  // 9. 双人：超长文本截断到 200 字
  const idE = newUuid();
  const idF = newUuid();
  const ue = await stream(idE);
  const uf = await stream(idF);
  await waitFor(ue, 'hello');
  await waitFor(uf, 'hello');
  const longText = 'x'.repeat(250);
  const stE = await post(idE, longText);
  ok('超长文本返回 200', stE === 200, String(stE));
  const eGot = await waitFor(uf, 'incoming');
  ok('超长文本截断到 200 字', eGot.data.text.length === 200, String(eGot.data.text.length));
  ue.close();
  uf.close();

  // 10. 有向接龙：回复直投原发送者；新消息避开刚对话的人
  const idX = newUuid();
  const idY = newUuid();
  const idZ = newUuid();
  const sx = await stream(idX);
  const sy = await stream(idY);
  const sz = await stream(idZ);
  await waitFor(sx, 'hello');
  await waitFor(sy, 'hello');
  await waitFor(sz, 'hello');

  const stReply = await post(idY, 'reply to X', { replyTo: idX });
  ok('回复请求返回 200', stReply === 200, String(stReply));
  const gotReply = await waitFor(sx, 'incoming');
  ok('回复直接送回原发送者', gotReply.data.text === 'reply to X' && gotReply.data.type === 'reply' && gotReply.data.from === idY, JSON.stringify(gotReply.data));

  const stNew = await post(idX, 'new from X', { avoid: idY });
  ok('新消息请求返回 200', stNew === 200, String(stNew));
  const gotNew = await waitFor(sz, 'incoming');
  ok('新消息避开刚对话的人（落到 Z）', gotNew.data.text === 'new from X' && gotNew.data.type === 'new' && gotNew.data.from === idX, JSON.stringify(gotNew.data));
  await sleep(300);
  ok('被避开的 Y 没有收到', !sy.events.some((e) => e.event === 'incoming' && e.data.text === 'new from X'));

  sx.close();
  sy.close();
  sz.close();

  // 11. OpenAI 兼容 API
  const preflight = await requestJson('OPTIONS', '/v1/chat/completions', null, { Origin: 'http://localhost:3000' });
  ok('CORS 预检 204', preflight.status === 204, String(preflight.status));
  ok('CORS 允许所有来源', preflight.headers['access-control-allow-origin'] === '*', String(preflight.headers['access-control-allow-origin']));

  const badModel = await requestJson('POST', '/v1/chat/completions', {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'hi' }]
  });
  ok('非 MolaChaos 模型被拒', badModel.status === 400 && /Only MolaChaos is available/.test(badModel.body), badModel.body.slice(0, 120));

  const idH = newUuid();
  const human = await stream(idH);
  await waitFor(human, 'hello');

  const apiPromise = requestJson('POST', '/v1/chat/completions', {
    model: 'molachaos-0.5k',
    messages: [{ role: 'user', content: 'API 你好' }],
    stream: false
  }, { Authorization: 'Bearer whatever', Origin: 'http://localhost:3000' });
  const apiMsg = await waitFor(human, 'incoming');
  ok('API 消息经 UDP 丢给真人', apiMsg.data.text === 'API 你好' && apiMsg.data.type === 'new', JSON.stringify(apiMsg.data));
  await post(idH, '来自人类的回答', { replyTo: apiMsg.data.from });
  const apiResp = await apiPromise;
  ok('非流式返回 200', apiResp.status === 200, String(apiResp.status));
  ok('非流式带 CORS 响应头', apiResp.headers['access-control-allow-origin'] === '*', String(apiResp.headers['access-control-allow-origin']));
  const apiJson = JSON.parse(apiResp.body);
  ok('OpenAI chat.completion 结构', apiJson.object === 'chat.completion' && apiJson.choices && apiJson.choices[0].message.content === '来自人类的回答', JSON.stringify(apiJson).slice(0, 160));
  ok('包含 carbon_node 字段', apiJson.carbon_node === idH, String(apiJson.carbon_node));

  const streamPromise = requestJson('POST', '/v1/chat/completions', {
    model: 'MolaChaos-0.5K',
    messages: [{ role: 'user', content: '流式你好' }],
    stream: true
  }, { Origin: 'http://localhost:3000' });
  const apiMsg2 = await waitFor(human, 'incoming');
  await post(idH, '流式回答', { replyTo: apiMsg2.data.from });
  const streamResp = await streamPromise;
  ok('流式 Content-Type 为 text/event-stream', streamResp.status === 200 && /text\/event-stream/.test(streamResp.headers['content-type'] || ''), String(streamResp.headers['content-type']));
  ok('流式以 [DONE] 结束', /data: \[DONE\]\n\n$/.test(streamResp.body), JSON.stringify(streamResp.body.slice(-40)));
  const dataLines = streamResp.body.split('\n\n')
    .map((l) => l.trim())
    .filter((l) => l.indexOf('data: ') === 0)
    .map((l) => l.slice(6));
  let joined = '';
  let chunkOk = true;
  for (const line of dataLines) {
    if (line === '[DONE]') continue;
    let obj;
    try { obj = JSON.parse(line); } catch (err) { chunkOk = false; continue; }
    if (obj.object !== 'chat.completion.chunk' || !obj.choices || !obj.choices[0] || !obj.choices[0].delta) chunkOk = false;
    else joined += obj.choices[0].delta.content || '';
  }
  ok('chunk 结构正确', chunkOk);
  ok('流式内容拼接正确', joined === '流式回答', joined);

  const timeoutResp = await requestJson('POST', '/v1/chat/completions', {
    model: 'molachaos-0.5k',
    messages: [{ role: 'user', content: '没人理我' }],
    stream: false
  });
  ok('超时返回 503', timeoutResp.status === 503, String(timeoutResp.status));
  const timeoutJson = JSON.parse(timeoutResp.body);
  ok('超时错误信息', timeoutJson.error && /touching grass/.test(timeoutJson.error.message), timeoutResp.body.slice(0, 120));

  human.close();

  console.log('\n结果: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\n测试异常:', err && err.message ? err.message : err);
  process.exit(1);
});
