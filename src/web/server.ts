import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { AccountManager } from "../accounts.js";

const MOD = { name: "Weread Omni · 郑老师魔改版", version: "ZH-0.1.0" } as const;
const port = Number.parseInt(process.env.WEREAD_WEB_PORT ?? "8787", 10);
const host = process.env.WEREAD_WEB_HOST ?? "127.0.0.1";

const json = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

const page = (title: string, body: string): string => `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>
:root{font-family:Inter,system-ui,"Microsoft YaHei",sans-serif;color:#18202a;background:#f5f7fa}
*{box-sizing:border-box}body{margin:0}.wrap{max-width:1180px;margin:auto;padding:28px}
header{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:24px}
h1{margin:0;font-size:28px}.sub{color:#657080;margin-top:6px}.badge{background:#111827;color:#fff;padding:8px 12px;border-radius:999px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.card{background:white;border:1px solid #e6eaf0;border-radius:16px;padding:20px;box-shadow:0 4px 18px #1118270a}
.card h2{font-size:17px;margin:0 0 8px}.num{font-size:30px;font-weight:700;margin:8px 0}.muted{color:#77808d}
nav{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}nav a{color:#1f2937;text-decoration:none;background:white;border:1px solid #dde3ea;padding:10px 14px;border-radius:10px}
.notice{margin-top:20px;padding:14px 16px;background:#fff8df;border:1px solid #f0dfa0;border-radius:12px}
</style></head><body><div class="wrap">${body}</div></body></html>`;

async function dashboard(): Promise<string> {
  const manager = new AccountManager();
  const accounts = manager.accounts();
  return page(MOD.name, `
<header><div><h1>${MOD.name}</h1><div class="sub">公众号情报库 · 本地优先 · 保留上游兼容</div></div><div class="badge">${MOD.version}</div></header>
<nav><a href="/">仪表盘</a><a href="/public-accounts">公众号</a><a href="/articles">文章中心</a><a href="/ai">AI 分析</a><a href="/topics">视频选题</a><a href="/settings">系统设置</a></nav>
<div class="grid">
 <section class="card"><h2>微信读书账号</h2><div class="num">${accounts.length}</div><div class="muted">已配置账号</div></section>
 <section class="card"><h2>公众号雷达</h2><div class="num">—</div><div class="muted">下一阶段接入增量同步</div></section>
 <section class="card"><h2>文章库</h2><div class="num">—</div><div class="muted">复用现有 SQLite 内容库</div></section>
 <section class="card"><h2>AI 待分析</h2><div class="num">—</div><div class="muted">下一阶段接入模型提供商</div></section>
</div>
<div class="notice">ZH-0.1.0 已建立 Web 管理入口。现有 CLI、SDK、公众号抓取和本地内容库保持不变。</div>`);
}

const placeholder = (name: string, desc: string) => page(`${name} · ${MOD.name}`, `
<header><div><h1>${name}</h1><div class="sub">${desc}</div></div><div class="badge">${MOD.version}</div></header>
<nav><a href="/">← 返回仪表盘</a></nav><section class="card"><h2>模块已预留</h2><p class="muted">后续功能将在此模块继续接入，不破坏原 weread-omni CLI/SDK。</p></section>`);

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (url.pathname === "/api/health") return json(res, 200, { ok: true, ...MOD });
    if (url.pathname === "/api/accounts") return json(res, 200, { accounts: new AccountManager().accounts() });
    if (url.pathname === "/") { res.writeHead(200,{"content-type":"text/html; charset=utf-8"}); return res.end(await dashboard()); }
    const routes: Record<string,[string,string]> = {
      "/public-accounts":["公众号","公众号订阅、分组、同步与监控"],
      "/articles":["文章中心","文章归档、全文搜索、标签与收藏"],
      "/ai":["AI 分析","摘要、观点、金句、争点与知识问答"],
      "/topics":["视频选题","从文章生成标题、口播稿与内容选题"],
      "/settings":["系统设置","账号、同步、AI、备份与功能开关"],
    };
    const found=routes[url.pathname];
    if(found){res.writeHead(200,{"content-type":"text/html; charset=utf-8"});return res.end(placeholder(found[0],found[1]));}
    return json(res,404,{error:"not found"});
  } catch (error) { return json(res,500,{error:error instanceof Error?error.message:String(error)}); }
});
server.listen(port,host,()=>process.stdout.write(`${MOD.name} ${MOD.version} running at http://${host}:${port}\n`));
