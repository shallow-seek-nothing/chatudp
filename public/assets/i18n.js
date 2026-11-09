/* 极简 i18n：data-i18n / data-i18n-placeholder / data-i18n-aria，默认英文 */
(function () {
  'use strict';

  var DICT = {
    en: {
      announcement:
        'MolaChaos is the world\'s first stateless large model built on the <b class="hh">HHM</b> <span class="hh-note">(Human Haphazard Model)</span> architecture, driven by a distributed network of online carbon-based neurons. Featuring an extreme 0.5K parameter scale and native UDP packet loss support, it does not compute vectors. Its sole purpose is to shatter your context after 15 seconds.',
      heading: 'Drift shallow. Seek nothing.',
      placeholder: '> Fire & Forget ...',
      pillModel: 'MolaChaos-0.5K V0.1 1110',
      pillLoss: 'Smart Packet Loss',
      linkChat: 'Chat with ChatUDP',
      linkApi: 'API Access',
      sendAria: 'Send',
      navKeys: 'API Keys',
      navDocs: 'API Docs',
      backHome: 'Back to home',
      keysTitle: 'API Keys',
      keysSub: 'Keys for MolaChaos-0.5K V0.1 1110. Purely ceremonial: any string works as a key and nothing is verified.',
      baseUrl: 'Base URL',
      modelLabel: 'Model',
      createKey: 'Generate new API key',
      keyNote: 'No verification, no billing — just the ceremony.',
      emptyKeys: 'No keys yet.',
      copy: 'Copy',
      copied: 'Copied',
      deleteKey: 'Delete',
      created: 'Created',
      colName: 'Name',
      colTrackingId: 'Tracking ID',
      colKey: 'Key',
      colCreated: 'Created',
      colLastUsed: 'Last used',
      unnamedKey: 'Untitled key',
      modalTitle: 'Create API key',
      modalNote: 'Copy it now — after you confirm, only a masked version remains.',
      modalName: 'Name',
      modalNamePlaceholder: 'e.g. My laptop',
      modalConfirm: 'I saved it',
      dateNote: 'These dates are generated locally by your browser. Our servers know nothing about them — just as they know nothing about your existence.',
      useKey: 'Use',
      docsClientTitle: 'Client Integration',
      docsClientBody: 'MolaChaos is fully compatible with the OpenAI API format. You can integrate it into LM Studio, Cursor, Chatbox, NextChat, or any tool that supports custom APIs. We have enabled CORS and SSE streaming on the backend.',
      docsConfigTitle: '🛠️ Configuration',
      docsParam: 'PARAM',
      docsValue: 'VALUE',
      docsKeyApply: 'Click to apply',
      docsKeyNote: 'Fill anything (e.g., BiBiLaBu). We don\'t validate.',
      docsModelNote: 'Must be exactly this, otherwise it errors out.',
      docsLossTitle: '⚠️ Important Notes on Packet Loss',
      docsLossBody: 'Because our model is driven by real carbon-based neurons (HHM), response time depends entirely on whether that stranger is slacking off.',
      docsLossTimeout: 'Please ensure your client\'s timeout setting is adjusted to 20 seconds or more.',
      docsLossError: 'If no one intercepts within 15 seconds, the API returns HTTP 503. If your client shows "Carbon node is touching grass", it\'s not a bug; it\'s the authentic UDP experience.',
      docsLossStream: 'We support stream: true. When you see characters popping out one by one in your client, please thank that carbon-based creature struggling to type (or stepping on the keyboard).',
      docsLmTitle: '💻 Example: Calling from LM Studio',
      docsLmStep1: 'Open LM Studio and go to the Local Server tab.',
      docsLmStep2: 'Fill API Base URL with:',
      docsLmStep3: 'Fill Model with:',
      docsLmStep4: 'Type anything in the chat box (e.g. what is 1+1) and hit send.',
      docsLmStep5: 'After ~15 seconds, if you get "BiBiLaBu" or "1+1=Wang", you have successfully breached the silicon model defense and joined the carbon-based true random network.',
      docsNoteTitle: '💡 [System Note]',
      docsNoteBody: 'If your AI client crashes while loading the model, it means the carbon node is having a mental breakdown. Restarting the client will route you to a different node (or a cat).',
      docsTitle: 'API Reference',
      docsSub: 'MolaChaos-0.5K V0.1 1110 · OpenAI-compatible API',
      draftNote: 'Layout draft — content to be completed.',
      secBasics: 'Basics',
      secChat: 'Chat completions',
      secRequest: 'Request example',
      secResponse: 'Response example',
      secErrors: 'Errors',
      secModel: 'Model',
      docsBasicsP: 'All endpoints speak JSON. Requests carry an Authorization: Bearer <API_KEY> header; the key can be any string.',
      docsChatP: 'Creates a chat completion. The request body follows OpenAI Chat Completions (parameters to be completed).',
      docsReqP: 'Sample request (pending).',
      docsRespP: 'Sample response (pending).',
      docsErrP: 'Error codes (pending).',
      docsModelP: 'Current model: MolaChaos-0.5K V0.1 1110.',
      todo: 'Content pending.',
      escape: '逃生出口 / Escape Hatch',
      you: 'You',
      broadcast: 'Broadcasting packets to the network...',
      received: 'Packet delivered.',
      dropped: 'Packet dropped. Carbon-based node unresponsive.'
    },
    zh: {
      announcement:
        'MolaChaos 是全球首个基于 <b class="hh">HHM</b><span class="hh-note">（人类随机模型）</span> 架构的无状态大模型。它拥有极致的 0.5K 参数，支持原生 UDP 丢包；它不计算向量，只负责在 15 秒后粉碎你的上下文。',
      heading: '浅层无求，浮游之境。',
      placeholder: '> 只管发 不管到 ...',
      pillModel: 'MolaChaos-0.5K V0.1 1110',
      pillLoss: '智能丢包',
      linkChat: '和 ChatUDP 对话',
      linkApi: 'API 接入',
      sendAria: '发送',
      navKeys: 'API Keys',
      navDocs: '接口文档',
      backHome: '返回首页',
      keysTitle: 'API Keys',
      keysSub: '为 MolaChaos-0.5K V0.1 1110 生成密钥。纯仪式感：任意字符串都能当 Key 用，不做任何校验。',
      baseUrl: 'Base URL',
      modelLabel: '模型',
      createKey: '生成新 API Key',
      keyNote: '不会校验，也不会扣费；这里只是仪式感。',
      emptyKeys: '还没有生成过 Key。',
      copy: '复制',
      copied: '已复制',
      deleteKey: '删除',
      created: '创建于',
      colName: '名称',
      colTrackingId: 'Tracking ID',
      colKey: 'Key',
      colCreated: '创建日期',
      colLastUsed: '最新使用日期',
      unnamedKey: '未命名 Key',
      modalTitle: '创建 API Key',
      modalNote: '现在就复制保存；确认后只保留打码版本。',
      modalName: '名称',
      modalNamePlaceholder: '例如：我的电脑',
      modalConfirm: '我已保存，确认',
      dateNote: '这些日期由你的浏览器本地生成，我们的服务器对此一无所知，就像它对你的存在一无所知一样。',
      useKey: '使用',
      docsClientTitle: '接入主流 AI 客户端',
      docsClientBody: 'MolaChaos 完全兼容 OpenAI API 格式。你可以将其接入 LM Studio、Cursor、Chatbox、NextChat 等任何支持自定义 API 的工具。我们在后端开放了 CORS 并支持 SSE 流式输出。',
      docsConfigTitle: '🛠️ 配置参数',
      docsParam: '参数',
      docsValue: '填入值',
      docsKeyApply: '点击申请',
      docsKeyNote: '或者随便填（例如 BiBiLaBu），我们不校验。',
      docsModelNote: '必须填这个，否则报错。',
      docsLossTitle: '⚠️ 关于“丢包”与客户端超时的特别说明',
      docsLossBody: '由于我们的模型是基于真实碳基神经元（Human Haphazard Model）驱动的，响应时间完全取决于那个陌生人是否在摸鱼。',
      docsLossTimeout: '请务必在你的客户端（如 LM Studio）设置中，将请求超时时间（Timeout）调整为 20 秒以上。',
      docsLossError: '如果 15 秒内无人接盘，API 将返回 HTTP 503 或流式报错。客户端会显示红字（如 "Carbon node is touching grass"）。这不是 Bug，这是原汁原味的 UDP 体验。',
      docsLossStream: '我们支持 stream: true。当你看到客户端里一个字一个字往外蹦的时候，请感谢那只正在键盘上艰难打字（或踩键盘）的碳基生物。',
      docsLmTitle: '💻 示例：在 LM Studio 中调用',
      docsLmStep1: '打开 LM Studio，进入 Local Server 选项卡。',
      docsLmStep2: '在 API Base URL 填入：',
      docsLmStep3: '在 Model 填入：',
      docsLmStep4: '在对话框输入任何内容（比如 1+1 等于几），点击发送。',
      docsLmStep5: '等待 15 秒后，如果收到「比比拉布」或「1+1=王」，说明你已经成功攻破了硅基大模型的防线，接入了碳基真随机网络。',
      docsNoteTitle: '💡 [系统备注]',
      docsNoteBody: '如果你的 AI 客户端在加载模型时崩溃了，说明碳基节点精神崩溃了。重启客户端将为您路由到另一个节点（或者一只猫）。',
      docsTitle: '接口文档',
      docsSub: 'MolaChaos-0.5K V0.1 1110 · 兼容 OpenAI 接口',
      draftNote: '内容整理中，以下先放结构占位。',
      secBasics: '基础信息',
      secChat: '对话补全',
      secRequest: '请求示例',
      secResponse: '响应示例',
      secErrors: '错误码',
      secModel: '模型',
      docsBasicsP: '所有接口使用 JSON。请求头需要 Authorization: Bearer <API_KEY>，Key 可以是任意字符串。',
      docsChatP: '创建一个对话补全。请求体格式与 OpenAI Chat Completions 保持一致（具体参数待补充）。',
      docsReqP: '示例请求（待补充）。',
      docsRespP: '示例响应（待补充）。',
      docsErrP: '错误码（待补充）。',
      docsModelP: '当前模型：MolaChaos-0.5K V0.1 1110。',
      todo: '内容待补充。',
      escape: '逃生出口 / Escape Hatch',
      you: '你',
      broadcast: '正在向全网广播数据包...',
      received: '数据包已送达。',
      dropped: 'Packet dropped. 碳基节点未响应。'
    }
  };

  var STORAGE_KEY = 'seeker.lang';

  window.SeekerI18N = {
    lang: 'en',
    t: function (key) {
      var dict = DICT[this.lang] || DICT.en;
      return dict[key] != null ? dict[key] : key;
    }
  };

  function getLang() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      if (v === 'zh' || v === 'en') return v;
    } catch (e) {
      /* ignore */
    }
    return 'en';
  }

  function apply(lang) {
    var t = DICT[lang] || DICT.en;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.setAttribute('data-lang', lang);

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (t[key] != null) nodes[i].textContent = t[key];
    }
    nodes = document.querySelectorAll('[data-i18n-html]');
    for (var h = 0; h < nodes.length; h++) {
      var hk = nodes[h].getAttribute('data-i18n-html');
      if (t[hk] != null) nodes[h].innerHTML = t[hk];
    }
    nodes = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < nodes.length; j++) {
      var pk = nodes[j].getAttribute('data-i18n-placeholder');
      if (t[pk] != null) nodes[j].setAttribute('placeholder', t[pk]);
    }
    nodes = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < nodes.length; k++) {
      var ak = nodes[k].getAttribute('data-i18n-aria');
      if (t[ak] != null) nodes[k].setAttribute('aria-label', t[ak]);
    }
    nodes = document.querySelectorAll('[data-lang-btn]');
    for (var m = 0; m < nodes.length; m++) {
      nodes[m].setAttribute('aria-pressed', String(nodes[m].getAttribute('data-lang-btn') === lang));
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* ignore */
    }
    window.SeekerI18N.lang = lang;
    document.dispatchEvent(new CustomEvent('seeker:lang', { detail: { lang: lang } }));
  }

  var buttons = document.querySelectorAll('[data-lang-btn]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function () {
      apply(this.getAttribute('data-lang-btn'));
    });
  }

  apply(getLang());
})();
