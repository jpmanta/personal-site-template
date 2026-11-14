// The engine behind your site. You shouldn't need to touch this file:
// everything you'd want to change lives in src/site.js.

import site from "./site.js";

const F = Object.assign(
  { goals: true, voting: true, essays: true, readAloud: true, now: true },
  site.features || {}
);
const T = Object.assign(
  { background: "#FAF9F6", text: "#1B2233", accent: "#14244A", highlight: "#B39556", font: "Cormorant Garamond" },
  site.theme || {}
);

// ── Small helpers ───────────────────────────────────────────
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^(https?:\/\/|mailto:|\/|#)/i.test(u) ? u : "#");
// Inline formatting: [text](url), **bold**, *italic*. Escapes everything first.
const inline = (s) =>
  esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${esc(safeUrl(u.replace(/&amp;/g, "&")))}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<i>$1</i>");
// Blocks: blank line = paragraph, "## " = heading, "> " = quote.
const prose = (s) =>
  String(s || "")
    .trim()
    .split(/\n\s*\n/)
    .map((b) => {
      b = b.trim();
      if (b.startsWith("## ")) return `<h2>${inline(b.slice(3))}</h2>`;
      if (b.startsWith("> ")) return `<blockquote>${inline(b.replace(/^> ?/gm, ""))}</blockquote>`;
      return `<p>${inline(b).replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const prettyDate = (d) => {
  const m = /^(\d{4})-(\d{2})/.exec(d || "");
  return m ? `${MONTHS[+m[2] - 1]} ${m[1]}` : esc(d || "");
};
const initials = (n) =>
  String(n || "?").split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const html = (body, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// ── The page shell (one look for every page) ────────────────
const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(T.font).replace(/%20/g, "+")}:ital,wght@0,400;0,500;1,400;1,500&display=swap`;
const CSS = `
:root{--bg:${T.background};--fg:${T.text};--navy:${T.accent};--gold:${T.highlight};
--muted:color-mix(in srgb,var(--fg) 72%,var(--bg));--faint:color-mix(in srgb,var(--fg) 50%,var(--bg));
--line:color-mix(in srgb,var(--fg) 16%,var(--bg));--serif:"${T.font}",Georgia,"Times New Roman",serif}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:400 22px/1.5 var(--serif);-webkit-font-smoothing:antialiased}
main{max-width:560px;margin:0 auto;padding:88px 24px 72px}
h1{font:500 46px/1.05 var(--serif);letter-spacing:-.01em;color:var(--navy);margin:0}
h2{font:500 28px/1.2 var(--serif);color:var(--navy);margin:36px 0 8px}
.rule{width:56px;height:1px;background:var(--gold);margin:26px 0 28px;border:0}
a{color:var(--navy);text-decoration:underline;text-decoration-color:var(--gold);text-decoration-thickness:1px;text-underline-offset:4px}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:1px solid var(--navy);outline-offset:3px}
.me{width:200px;height:200px;border-radius:50%;object-fit:cover;display:block;margin:0 0 28px 7px;box-shadow:0 0 0 6px var(--bg),0 0 0 7px var(--gold)}
.mono{display:flex;align-items:center;justify-content:center;background:var(--navy);color:var(--bg);font:500 64px var(--serif)}
.lines{list-style:none;margin:0;padding:0}.lines li{margin:0 0 6px}.quiet{color:var(--muted);font-style:italic}
.more{margin:44px 0 0}details{margin:0 0 10px}
summary{list-style:none;cursor:pointer;display:inline;font-style:italic;color:var(--navy);text-decoration:underline;text-decoration-color:var(--gold);text-decoration-thickness:1px;text-underline-offset:4px}
summary::-webkit-details-marker{display:none}
details>.body{margin:14px 0 22px;padding-left:18px;border-left:1px solid var(--line);font-size:20px}
blockquote{margin:0 0 14px}blockquote cite{display:block;font-size:17px;font-style:normal;color:var(--muted)}
.when{font-size:17px;font-style:italic;color:var(--faint);margin-left:6px}
.back{font-size:18px;margin:0 0 8px}.intro{color:var(--muted);font-style:italic;margin:0 0 28px}
.goals{list-style:none;margin:0;padding:0}.goals li{margin:0 0 12px;position:relative;padding-left:28px}
.goals .box{position:absolute;left:0;top:.42em;width:13px;height:13px;padding:0;border:1px solid var(--gold);border-radius:2px;background:transparent;cursor:pointer}
.goals li.done>.box{background:var(--gold)}.goals li.done>.t{color:var(--faint);text-decoration:line-through;text-decoration-color:var(--gold)}
.goals time{display:inline-block;margin-left:8px;font-size:17px;font-style:italic;color:var(--faint)}
.goals .sub{list-style:none;margin:8px 0 4px;padding:0;font-size:19px;color:var(--muted)}.goals .sub li{margin:0 0 4px;padding-left:24px}
.goals .sub .box{width:11px;height:11px;top:.5em}
.note{display:block;margin:4px 0 0;font-size:17px;font-style:italic;color:var(--faint)}
.group{display:block;margin:12px 0 2px;font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}
.score{margin-left:8px;font-size:14px;font-style:italic;color:var(--faint)}
.card{margin:22px 0 6px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font-size:16px;color:var(--muted)}
.card b{display:block;font-weight:500;color:var(--navy);margin:0 0 6px}
.card form{display:grid;gap:8px}.card select,.card textarea{font:inherit;font-size:16px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--fg)}
.card textarea{min-height:70px}.card .row{display:flex;gap:14px;flex-wrap:wrap}
.btn{justify-self:start;padding:6px 18px;border:1px solid var(--gold);border-radius:8px;background:transparent;color:var(--navy);font:italic 17px var(--serif);cursor:pointer}
.small{font-size:13px;font-style:italic;color:var(--faint);margin-top:6px}
.hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
article p{margin:0 0 18px}article h2{font-size:26px}
footer{margin-top:56px;font-size:16px;color:var(--faint)}
@media (max-width:480px){body{font-size:20px}h1{font-size:38px}main{padding-top:64px}}
`;

const page = ({ title, description, body, path = "/" }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || site.description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description || site.description)}">
<meta name="theme-color" content="${esc(T.background)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect x='1' y='1' width='22' height='22' fill='${T.accent}'/><text x='12' y='16.5' font-size='10' text-anchor='middle' fill='${T.background}' font-family='Georgia,serif'>${esc(initials(site.name))}</text></svg>`)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fontHref)}">
<style>${CSS}</style>
</head>
<body>
<main>
${path === "/" ? "" : `<p class="back"><a href="/">${esc(site.name)}</a></p>`}
${body}
<footer>${path === "/" ? "" : `<a href="/">Back to home</a>`}</footer>
</main>
</body>
</html>`;

// ── Pages ───────────────────────────────────────────────────
const essays = (site.essays || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));

function homePage() {
  const photo = site.photo
    ? `<img class="me" src="${esc(safeUrl(site.photo))}" width="400" height="400" alt="${esc(site.name)}">`
    : `<div class="me mono" aria-hidden="true">${esc(initials(site.name))}</div>`;
  const sections = [];
  if (site.reading?.length)
    sections.push(["Recommended reading", `<ul class="lines">${site.reading
      .map((r) => `<li>${r.url ? `<a href="${esc(safeUrl(r.url))}"><i>${esc(r.title)}</i></a>` : `<i>${esc(r.title)}</i>`}${r.author ? `, ${esc(r.author)}` : ""}</li>`)
      .join("")}</ul>`]);
  if (F.essays && essays.length)
    sections.push(["Essays", `<ul class="lines">${essays
      .map((e) => `<li><a href="/essays/${esc(e.slug)}">${esc(e.title)}</a> <span class="when">${prettyDate(e.date)}</span></li>`)
      .join("")}</ul>`]);
  if (site.quotes?.length)
    sections.push(["Quotes I live by", site.quotes
      .map((q) => `<blockquote>${inline(q.text)}${q.by ? `<cite>${esc(q.by)}</cite>` : ""}</blockquote>`)
      .join("")]);
  const nav = [];
  if (F.goals && site.goals?.list?.length) nav.push(`<a href="/goals">My goals</a>`);
  if (F.now && site.now) nav.push(`<a href="/now">What I'm doing now</a>`);
  const c = site.contact || {};
  const contact = [
    c.text ? inline(c.text) : "",
    c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "",
    ...(c.links || []).map((l) => `<a href="${esc(safeUrl(l.url))}">${esc(l.label)}</a>`),
  ].filter(Boolean);
  return page({
    title: site.name,
    body: `${photo}
<h1>${esc(site.name)}</h1>
<hr class="rule">
<ul class="lines">
${(site.lines || []).map((l) => `<li>${inline(l)}</li>`).join("\n")}
${(site.quietLines || []).map((l) => `<li class="quiet">${inline(l)}</li>`).join("\n")}
</ul>
<div class="more">
${nav.length ? `<p>${nav.join(" · ")}</p>` : ""}
${sections.map(([t, b]) => `<details><summary>${t}</summary><div class="body">${b}</div></details>`).join("\n")}
</div>
${contact.length ? `<p class="quiet" style="margin-top:44px">${contact.join(" · ")}</p>` : ""}`,
  });
}

// All goal and ranked ids, for validating votes and checkmarks.
const goalIds = new Set();
const rankedIds = new Set();
for (const g of site.goals?.list || []) {
  goalIds.add(g.id);
  (g.sub || []).forEach((s) => goalIds.add(s.id));
  (g.ranked?.groups || []).forEach((gr) => gr.items.forEach((i) => { goalIds.add(i.id); rankedIds.add(i.id); }));
}

function goalLi(id, text, inner = "", label = text) {
  return `<li data-id="${esc(id)}"><button class="box" aria-label="Mark done: ${esc(label)}"></button><span class="t">${inline(text)}</span><time></time>${inner}</li>`;
}

function goalsPage() {
  const G = site.goals;
  let n = 0;
  const items = G.list
    .map((g) => {
      let inner = "";
      if (g.sub?.length) inner += `<ul class="sub">${g.sub.map((s) => goalLi(s.id, s.text)).join("")}</ul>`;
      if (g.ranked?.groups?.length) {
        inner += (g.ranked.note ? `<span class="note">${inline(g.ranked.note)}</span>` : "") +
          g.ranked.groups
            .map((gr) => `<span class="group">${esc(gr.title)}</span><ul class="sub">${gr.items
              .map((i) => { n++; return goalLi(i.id, `${n}. ${i.text}`, "", `${n}. ${i.text}`); })
              .join("")}</ul>`)
            .join("");
      }
      return goalLi(g.id, g.text, inner);
    })
    .join("\n");
  const voting = F.voting && rankedIds.size
    ? `<div class="card"><b>Help me rewrite this list</b>
<form id="v-form"><select id="v-id" aria-label="Which line"></select>
<div class="row"><label><input type="radio" name="v" value="keep" checked> Keep it</label><label><input type="radio" name="v" value="cut"> Cut it</label><label><input type="radio" name="v" value="change"> Change it</label></div>
<textarea id="v-why" maxlength="600" aria-label="Why, or your change" placeholder="Why? Or how would you change it?"></textarea>
<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
<button class="btn" type="submit">Send</button><div id="v-msg" style="color:var(--navy)"></div></form>
<div class="small">Vote counts are public. What you write goes only to me. One vote per line per day.</div></div>`
    : "";
  return page({
    title: `Goals · ${site.name}`,
    description: G.intro,
    path: "/goals",
    body: `<h1>Goals</h1><hr class="rule">
${G.intro ? `<p class="intro">${inline(G.intro)}</p>` : ""}
<ul class="goals">${items}</ul>
${voting}
<script>
(function(){
var M=${JSON.stringify(MONTHS)},state={};
function render(){document.querySelectorAll(".goals li").forEach(function(li){var d=state[li.dataset.id];li.classList.toggle("done",!!d);li.querySelector(":scope>time").textContent=d||"";});}
function pw(){var p=null;try{p=localStorage.getItem("sitePw")}catch(e){}if(!p){p=prompt("Your password, to update goals:");if(p){try{localStorage.setItem("sitePw",p)}catch(e){}}}return p;}
fetch("/api/goals",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){state=j||{};render();}).catch(function(){});
document.querySelector(".goals").addEventListener("click",function(e){
var b=e.target.closest(".box");if(!b)return;var id=b.parentElement.dataset.id,p=pw();if(!p)return;
var next=Object.assign({},state);if(next[id])delete next[id];else{var d=new Date();next[id]=M[d.getMonth()]+" "+d.getFullYear();}
fetch("/api/goals",{method:"POST",headers:{"content-type":"application/json","x-password":p},body:JSON.stringify(next)}).then(function(r){
if(r.status===401){try{localStorage.removeItem("sitePw")}catch(e){}alert("Wrong password.");return;}
if(!r.ok){r.json().then(function(j){alert(j.error||"Could not save.")}).catch(function(){alert("Could not save.")});return;}state=next;render();});
});
var sel=document.getElementById("v-id");if(!sel)return;
var lis=[].slice.call(document.querySelectorAll(".goals li")).filter(function(li){return ${JSON.stringify([...rankedIds])}.indexOf(li.dataset.id)>=0});
lis.forEach(function(li){var o=document.createElement("option"),t=li.querySelector(".t").textContent;o.value=li.dataset.id;o.textContent=t.length>70?t.slice(0,68)+"…":t;sel.appendChild(o);});
var o=document.createElement("option");o.value="new";o.textContent="A new idea for the list";sel.appendChild(o);
var t0=Date.now();
function show(c){lis.forEach(function(li){var x=c[li.dataset.id];if(!x)return;var n=(x.keep||0)+(x.cut||0)+(x.change||0);if(!n)return;var s=li.querySelector(".score");if(!s){s=document.createElement("span");s.className="score";li.querySelector(".t").after(s);}s.textContent=Math.round(100*(x.keep||0)/n)+"% keep · "+n+(n==1?" vote":" votes");});}
fetch("/api/votes").then(function(r){return r.json()}).then(function(j){show(j.counts||{})}).catch(function(){});
document.getElementById("v-form").addEventListener("submit",function(e){e.preventDefault();var f=e.target,m=document.getElementById("v-msg");
fetch("/api/votes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:sel.value,v:(f.querySelector("input[name=v]:checked")||{}).value,why:document.getElementById("v-why").value,website:f.website.value,ts:t0})})
.then(function(r){return r.json()}).then(function(j){m.textContent=j.ok?"Thank you. I read every one of these.":(j.error||"That didn't work. Try again later.");if(j.counts)show(j.counts);if(j.ok)document.getElementById("v-why").value="";})
.catch(function(){m.textContent="That didn't work. Try again later.";});});
})();
</script>`,
  });
}

function feedbackPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Feedback</title>
<style>body{font:18px/1.5 Georgia,serif;max-width:640px;margin:40px auto;padding:0 20px;color:${esc(T.text)};background:${esc(T.background)}}li{margin:0 0 14px}small{opacity:.6}</style></head>
<body><h1>What people wrote</h1><p id="s">Loading…</p><ol id="l" reversed></ol>
<script>(function(){var p=null;try{p=localStorage.getItem("sitePw")}catch(e){}if(!p)p=prompt("Your password:");
fetch("/api/votes/notes",{headers:{"x-password":p||""}}).then(function(r){if(r.status===401){try{localStorage.removeItem("sitePw")}catch(e){}throw 0}try{localStorage.setItem("sitePw",p)}catch(e){}return r.json()})
.then(function(j){var n=j.notes||[];document.getElementById("s").textContent=n.length+" notes, newest first.";var l=document.getElementById("l");
n.slice().reverse().forEach(function(x){var li=document.createElement("li"),b=document.createElement("b"),d=document.createElement("div"),s=document.createElement("small");
b.textContent=x.v+" · "+x.id;d.textContent=x.why;s.textContent=new Date(x.date).toLocaleString();li.append(b,d,s);l.appendChild(li);});})
.catch(function(){document.getElementById("s").textContent="Wrong password.";});})();</script></body></html>`;
}

function essaysPage() {
  return page({
    title: `Essays · ${site.name}`,
    path: "/essays",
    body: `<h1>Essays</h1><hr class="rule"><ul class="lines">${essays
      .map((e) => `<li><a href="/essays/${esc(e.slug)}">${esc(e.title)}</a> <span class="when">${prettyDate(e.date)}</span></li>`)
      .join("")}</ul>`,
  });
}

function essayPage(e) {
  const listen = F.readAloud
    ? `<p><button class="btn" id="listen" type="button">Listen</button></p>
<script>(function(){var b=document.getElementById("listen");if(!("speechSynthesis" in window)){b.remove();return;}var on=false;
b.onclick=function(){if(on){speechSynthesis.cancel();on=false;b.textContent="Listen";return;}
var t=[].map.call(document.querySelectorAll("article h1, article h2, article p, article blockquote"),function(x){return x.textContent}).join("\\n\\n");
var u=new SpeechSynthesisUtterance(t);u.rate=1;u.onend=function(){on=false;b.textContent="Listen";};speechSynthesis.speak(u);on=true;b.textContent="Stop";};})();</script>`
    : "";
  return page({
    title: `${e.title} · ${site.name}`,
    description: e.description || String(e.body || "").replace(/[#*>\[\]]/g, "").slice(0, 155),
    path: "/essays/" + e.slug,
    body: `<article><h1>${esc(e.title)}</h1><p class="when" style="margin:10px 0 0">${prettyDate(e.date)}</p><hr class="rule">${listen}${prose(e.body)}</article>`,
  });
}

function nowPage() {
  return page({
    title: `Now · ${site.name}`,
    path: "/now",
    body: `<h1>Now</h1><hr class="rule">${site.now.updated ? `<p class="intro">Updated ${esc(site.now.updated)}.</p>` : ""}<ul class="lines">${(site.now.items || [])
      .map((i) => `<li>${inline(i)}</li>`)
      .join("")}</ul>`,
  });
}

const notFound = () => html(page({ title: "Not found", path: "/404", body: `<h1>Not here</h1><hr class="rule"><p>That page doesn't exist. <a href="/">Go home</a>.</p>` }), 404);

// ── Storage (Cloudflare KV, created for you on deploy) ──────
async function load(env, key, fallback) {
  try { return JSON.parse((await env.SITE.get(key)) || "null") ?? fallback; } catch { return fallback; }
}
function checkPassword(request, env) {
  return !!env.ADMIN_PASSWORD && request.headers.get("x-password") === env.ADMIN_PASSWORD;
}
async function hash(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function goalsApi(request, env) {
  if (!env.SITE) return json({});
  if (request.method === "GET") return json(await load(env, "goals", {}));
  if (request.method !== "POST") return json({ error: "Not allowed" }, 405);
  if (!env.ADMIN_PASSWORD) return json({ error: "Set ADMIN_PASSWORD in Cloudflare first (see README)." }, 503);
  if (!checkPassword(request, env)) return json({ error: "Wrong password" }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad data" }, 400); }
  const clean = {};
  for (const [k, v] of Object.entries(body || {})) if (goalIds.has(k)) clean[k] = String(v).slice(0, 40);
  await env.SITE.put("goals", JSON.stringify(clean));
  return json({ ok: true });
}

async function votesApi(request, env, url) {
  if (!F.voting || !env.SITE) return json({ counts: {} });
  if (request.method === "GET") return json({ counts: await load(env, "votes:counts", {}) });
  if (request.method !== "POST") return json({ ok: false }, 405);
  const origin = request.headers.get("origin");
  let originHost = url.host;
  try { if (origin) originHost = new URL(origin).host; } catch { originHost = ""; }
  if (originHost !== url.host) return json({ ok: false, error: "Not allowed" }, 403);
  const raw = await request.text();
  if (raw.length > 4000) return json({ ok: false, error: "That's too long." }, 413);
  let f;
  try { f = JSON.parse(raw); } catch { return json({ ok: false, error: "Bad data" }, 400); }
  const counts = await load(env, "votes:counts", {});
  if (!f || f.website || (f.ts && Date.now() - Number(f.ts) < 1500)) return json({ ok: true, counts }); // bots
  const id = String(f.id || ""), v = String(f.v || ""), why = String(f.why || "").trim().slice(0, 600);
  if (!(rankedIds.has(id) || id === "new") || !["keep", "cut", "change"].includes(v))
    return json({ ok: false, error: "Pick a line and a vote." }, 400);
  if (id === "new" && !why) return json({ ok: false, error: "Tell me your idea in the box." }, 400);
  const day = Math.floor(Date.now() / 86400000);
  const key = "votes:ip:" + (await hash((request.headers.get("cf-connecting-ip") || "") + "|" + id + "|" + day));
  if (await env.SITE.get(key)) return json({ ok: false, error: "You already voted on this line today. Thank you!", counts });
  await env.SITE.put(key, "1", { expirationTtl: 172800 });
  if (id !== "new") {
    const c = counts[id] || { keep: 0, cut: 0, change: 0 };
    c[v]++;
    counts[id] = c;
    await env.SITE.put("votes:counts", JSON.stringify(counts));
  }
  if (why) {
    const notes = await load(env, "votes:notes", []);
    notes.push({ id, v, why, date: new Date().toISOString() });
    while (notes.length > 5000) notes.shift();
    await env.SITE.put("votes:notes", JSON.stringify(notes));
  }
  return json({ ok: true, counts });
}

// ── Router ──────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname.replace(/\/+$/, "") || "/";
    const origin = url.origin;

    if (p === "/") return html(homePage());
    if (p === "/goals" && F.goals && site.goals?.list?.length) return html(goalsPage());
    if (p === "/goals/feedback" && F.voting)
      return new Response(feedbackPage(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
    if (p === "/api/goals") return goalsApi(request, env);
    if (p === "/api/votes") return votesApi(request, env, url);
    if (p === "/api/votes/notes") {
      if (!env.SITE || !checkPassword(request, env)) return json({ error: "Unauthorized" }, 401);
      return json({ notes: await load(env, "votes:notes", []) });
    }
    if (F.essays && p === "/essays") return html(essaysPage());
    if (F.essays && p.startsWith("/essays/")) {
      const e = essays.find((x) => x.slug === p.slice(8));
      return e ? html(essayPage(e)) : notFound();
    }
    if (F.now && p === "/now" && site.now) return html(nowPage());
    if (p === "/robots.txt") return new Response(`User-agent: *\nDisallow: /api/\nDisallow: /goals/feedback\nSitemap: ${origin}/sitemap.xml\n`, { headers: { "content-type": "text/plain" } });
    if (p === "/sitemap.xml") {
      const urls = ["/", F.goals && site.goals ? "/goals" : "", F.essays ? "/essays" : "", F.now && site.now ? "/now" : "", ...(F.essays ? essays.map((e) => "/essays/" + e.slug) : [])].filter(Boolean);
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(origin + u)}</loc></url>`).join("")}</urlset>`, { headers: { "content-type": "application/xml" } });
    }
    return notFound();
  },
};
