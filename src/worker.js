// The engine behind your site. You shouldn't need to touch this file:
// everything you'd want to change lives in src/site.js.

import site from "./site.js";
import { EmailMessage } from "cloudflare:email";

const F = Object.assign(
  { goals: true, voting: true, essays: true, readAloud: true, now: true, subscriberEmails: false },
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
// Everything can say why it's there. A line, Now item or goal can be plain text or { text, why };
// reading picks, quotes, essays and the main ask take an optional why. It shows as a small "Why?" toggle.
const textOf = (x) => (x && typeof x === "object" ? x.text : x);
const why = (x) => (x && typeof x === "object" && x.why ? `<details class="why"><summary>Why?</summary><p>${inline(x.why)}</p></details>` : "");

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
.goals .t .tt{font-weight:600;color:var(--navy)}.goals .amd{margin:4px 0 0;font-size:14px;line-height:1.45;font-style:italic;color:var(--faint)}.goals details.amd>summary{list-style:none;cursor:pointer}.goals details.amd>summary::-webkit-details-marker{display:none}.goals .amd-b{text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px}.goals .amd-l{margin:6px 0 4px;padding:6px 0 2px 12px;border-left:2px solid var(--line);font-style:normal;font-size:15px;color:var(--muted)}.goals .amd-l>div{margin:0 0 8px}.goals .amd-l b{font-weight:600;color:var(--navy)}
.note{display:block;margin:4px 0 0;font-size:17px;font-style:italic;color:var(--faint)}
.group{display:block;margin:12px 0 2px;font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}
.group .rg{color:var(--faint);letter-spacing:0}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.score{margin-left:8px;font-size:14px;font-style:italic;color:var(--faint)}
.vrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0 2px}.goals li>time:empty{display:none}
.vrow button{font:400 14px/1 system-ui,-apple-system,sans-serif;padding:6px 10px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--muted);cursor:pointer}
.vrow button:hover{border-color:var(--gold)}.vrow button[aria-pressed=true]{background:var(--navy);border-color:var(--navy);color:var(--bg)}
.vrow .flash{font-size:13px;font-style:italic;color:var(--faint)}
.card{margin:22px 0 6px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font-size:16px;color:var(--muted)}
.card b{display:block;font-weight:500;color:var(--navy);margin:0 0 6px}
.card form{display:grid;gap:8px}.card select,.card textarea{font:inherit;font-size:16px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--fg)}
.card textarea{min-height:70px}.card .row{display:flex;gap:14px;flex-wrap:wrap}
.btn{justify-self:start;padding:6px 18px;border:1px solid var(--gold);border-radius:8px;background:transparent;color:var(--navy);font:italic 17px var(--serif);cursor:pointer}
.small{font-size:13px;font-style:italic;color:var(--faint);margin-top:6px}
.hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.nav{display:flex;flex-wrap:nowrap;gap:clamp(4px,1.2vw,8px);margin:0 0 22px;overflow-x:auto;scrollbar-width:none}.nav::-webkit-scrollbar{display:none}
.nav a{flex:0 0 auto;white-space:nowrap;padding:6px clamp(8px,2.2vw,15px);border:1px solid var(--line);border-radius:999px;text-decoration:none;font-size:clamp(13px,3.6vw,17px);line-height:1.3;background:color-mix(in srgb,var(--gold) 6%,transparent)}
.nav a:hover,.nav a:focus-visible{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 14%,transparent)}
.ask{margin:28px 0 0;padding:16px 18px;border:1px solid var(--gold);border-radius:14px;background:color-mix(in srgb,var(--gold) 8%,transparent);font-size:19px}
.ask p{margin:0 0 12px}.ask a{display:inline-block;padding:9px 22px;border-radius:999px;background:var(--navy);color:var(--bg);text-decoration:none;font:500 18px/1 var(--serif)}
.pick{position:relative}.pick>button{width:100%;text-align:left;font:inherit;font-size:16px;padding:6px 30px 6px 8px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--fg);cursor:pointer;position:relative}
.pick>button::after{content:"";position:absolute;right:12px;top:50%;width:7px;height:7px;border-right:1px solid var(--gold);border-bottom:1px solid var(--gold);transform:translateY(-70%) rotate(45deg)}
.pick ul{list-style:none;margin:4px 0 0;padding:6px 0;position:absolute;left:0;right:0;z-index:5;max-height:320px;overflow:auto;background:var(--bg);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.08)}
.pick li{padding:6px 12px;cursor:pointer;line-height:1.35}.pick li[aria-selected=true],.pick li:hover{background:color-mix(in srgb,var(--gold) 12%,transparent)}
.pick li.g{cursor:default;background:none;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);padding-top:10px}
.vis-hidden{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ans{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:10px 0 0;padding:10px 0 0;border-top:1px solid var(--line)}.ans:first-of-type{border-top:0;padding-top:0}
.ans .line{grid-column:1/-1;font-size:14px;font-style:italic;color:var(--faint)}.ans .q{color:var(--muted)}.ans .a{color:var(--fg)}
@media (max-width:480px){.ans{grid-template-columns:1fr}}
details.why{margin:2px 0 6px;font-size:18px}details.why>summary{font-size:17px}details.why>p{margin:6px 0 0;padding-left:14px;border-left:1px solid var(--line);color:var(--muted)}
.ask details.why a{display:inline;padding:0;border-radius:0;background:none;color:var(--navy);text-decoration:underline;font:inherit}
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
      .map((r) => `<li>${r.url ? `<a href="${esc(safeUrl(r.url))}"><i>${esc(r.title)}</i></a>` : `<i>${esc(r.title)}</i>`}${r.author ? `, ${esc(r.author)}` : ""}${why(r)}</li>`)
      .join("")}</ul>`]);
  if (F.essays && essays.length)
    sections.push(["Essays", `<ul class="lines">${essays
      .map((e) => `<li><a href="/essays/${esc(e.slug)}">${esc(e.title)}</a> <span class="when">${prettyDate(e.date)}</span></li>`)
      .join("")}</ul>`]);
  if (site.quotes?.length)
    sections.push(["Quotes I live by", site.quotes
      .map((q) => `<blockquote>${inline(q.text)}${q.by ? `<cite>${esc(q.by)}</cite>` : ""}${why(q)}</blockquote>`)
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
${(site.lines || []).map((l) => `<li>${inline(textOf(l))}${why(l)}</li>`).join("\n")}
${(site.quietLines || []).map((l) => `<li class="quiet">${inline(textOf(l))}${why(l)}</li>`).join("\n")}
</ul>
${site.mainAsk?.button && site.mainAsk?.url ? `<div class="ask">${site.mainAsk.text ? `<p>${inline(site.mainAsk.text)}</p>` : ""}<a href="${esc(safeUrl(site.mainAsk.url))}">${esc(site.mainAsk.button)}</a>${why(site.mainAsk)}</div>` : ""}
<div class="more">
${nav.length ? `<nav class="nav" aria-label="Pages">${nav.join("")}</nav>` : ""}
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

function goalLi(id, text, inner = "", label = text, lead = "") {
  return `<li data-id="${esc(id)}"><button class="box" aria-label="Mark done: ${esc(label)}"></button><span class="t">${lead}${inline(text)}</span><time></time>${inner}</li>`;
}

// Optional dated record for a ranked line: history: [{ date: "2026-11-13", text: "original wording" }, …],
// oldest first. The first entry is when the line was adopted; every later entry is an amendment.
// The line's current wording is always its text. Nothing shows when there is no history.
function shortDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ""));
  return m ? `${MONTHS[+m[2] - 1].slice(0, 3)} ${+m[3]}, ${m[1]}` : esc(d || "");
}
function amendments(item) {
  const h = (item.history || []).filter((e) => e && e.date);
  if (!h.length) return "";
  const n = h.length - 1;
  const head = `Adopted ${shortDate(h[0].date)}`;
  if (!n) return `<div class="amd">${head}</div>`;
  const when = n === 1 ? `Amended ${shortDate(h[1].date)}` : `Amended ${n} times · latest ${shortDate(h[n].date)}`;
  const rows = h.map((e, k) => `<div><b>${k ? `Amendment ${k}` : "Original text"}</b> <i>(${shortDate(e.date)})</i><br>${inline(e.text || "")}</div>`).join("");
  return `<details class="amd"><summary>${head} · <span class="amd-b">${when}</span></summary><div class="amd-l">${rows}</div></details>`;
}

function goalsPage() {
  const G = site.goals;
  let n = 0;
  // Each section shows the range of line numbers it holds ("44–55"), computed from the list so it stays right as lines are added or cut.
  const range = (a, b) => (b >= a ? ` <span class="rg" aria-hidden="true">${a === b ? a : a + "\u2013" + b}</span><span class="vh">${a === b ? "line " + a : "lines " + a + " to " + b}</span>` : "");
  const items = G.list
    .map((g) => {
      let inner = "";
      if (g.sub?.length) inner += `<ul class="sub">${g.sub.map((s) => goalLi(s.id, s.text)).join("")}</ul>`;
      if (g.ranked?.groups?.length) {
        inner += (g.ranked.note ? `<span class="note">${inline(g.ranked.note)}</span>` : "") +
          g.ranked.groups
            .map((gr) => `<span class="group">${esc(gr.title)}${range(n + 1, n + gr.items.length)}</span><ul class="sub">${gr.items
              .map((i) => { n++; const lead = i.title ? `${n}. <b class="tt">${esc(i.title)}.</b> ` : `${n}. `; const label = i.title ? `${n}. ${i.title}. ${i.text}` : `${n}. ${i.text}`; return goalLi(i.id, i.text, amendments(i), label, lead); })
              .join("")}</ul>`)
            .join("");
      }
      return goalLi(g.id, g.text, why(g) + inner);
    })
    .join("\n");
  const answers = F.voting && rankedIds.size
    ? `<div class="card" id="answers" hidden><b>Objections, answered</b><div class="small" style="margin:0 0 8px">The strongest objections readers sent, and my answer to each.</div><div id="ans-list"></div></div>`
    : "";
  const voting = F.voting && rankedIds.size
    ? `<div class="card"><b>Help me rewrite this list</b>
<form id="v-form"><select id="v-id" aria-label="Which line"></select>
<div class="row"><label><input type="radio" name="v" value="keep" checked> Keep it</label><label><input type="radio" name="v" value="cut"> Cut it</label></div>
<textarea id="v-why" maxlength="600" aria-label="Why, or your change" placeholder="Why? Or how would you rewrite it?"></textarea>
<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
<button class="btn" type="submit">Send</button><div id="v-msg" style="color:var(--navy)"></div></form>
<div class="small">Vote counts are public. What you write goes only to me, unless I answer it above in “Objections, answered” (never with your name). One vote per line, and you can change it or take it back any time.</div></div>`
    : "";
  return page({
    title: `Goals · ${site.name}`,
    description: G.intro,
    path: "/goals",
    body: `<h1>Goals</h1><hr class="rule">
${G.intro ? `<p class="intro">${inline(G.intro)}</p>` : ""}
<ul class="goals">${items}</ul>
${answers}
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
// A picker that matches the site, grouped by section, with each line's full text. The real <select> stays (hidden) as the form value.
(function(){var wrap=document.createElement("div");wrap.className="pick";var btn=document.createElement("button");btn.type="button";btn.setAttribute("aria-haspopup","listbox");btn.setAttribute("aria-expanded","false");
var ul=document.createElement("ul");ul.setAttribute("role","listbox");ul.hidden=true;ul.tabIndex=-1;
function full(id){if(id==="new")return "A new idea for the list";var li=lis.filter(function(x){return x.dataset.id===id})[0];return li?li.querySelector(".t").textContent:id;}
function setv(id){sel.value=id;btn.textContent=full(id);[].forEach.call(ul.querySelectorAll("li[data-v]"),function(x){x.setAttribute("aria-selected",x.dataset.v===id?"true":"false")});}
var last=null;lis.forEach(function(li){var g=li.parentElement.previousElementSibling;if(g&&g.classList.contains("group")&&g!==last){last=g;var h=document.createElement("li");h.className="g";h.textContent=g.textContent;h.setAttribute("aria-hidden","true");ul.appendChild(h);}
var x=document.createElement("li");x.setAttribute("role","option");x.dataset.v=li.dataset.id;x.textContent=li.querySelector(".t").textContent;ul.appendChild(x);});
var n=document.createElement("li");n.setAttribute("role","option");n.dataset.v="new";n.textContent="A new idea for the list";ul.appendChild(n);
function open(o){ul.hidden=!o;btn.setAttribute("aria-expanded",o?"true":"false");if(o){var s=ul.querySelector("[aria-selected=true]");if(s)s.scrollIntoView({block:"nearest"});}}
btn.onclick=function(){open(ul.hidden)};ul.onclick=function(e){var x=e.target.closest("li[data-v]");if(!x)return;setv(x.dataset.v);open(false);btn.focus();};
document.addEventListener("click",function(e){if(!wrap.contains(e.target))open(false)});
wrap.addEventListener("keydown",function(e){if(e.key==="Escape"){open(false);btn.focus();return;}if(e.key!=="ArrowDown"&&e.key!=="ArrowUp")return;e.preventDefault();var all=[].slice.call(ul.querySelectorAll("li[data-v]")),i=all.findIndex(function(x){return x.dataset.v===sel.value});i=Math.max(0,Math.min(all.length-1,i+(e.key==="ArrowDown"?1:-1)));setv(all[i].dataset.v);if(!ul.hidden)all[i].scrollIntoView({block:"nearest"});});
// clicking a line's vote score or text elsewhere could preselect it later; for now start on the first line
sel.classList.add("vis-hidden");sel.tabIndex=-1;sel.setAttribute("aria-hidden","true");sel.parentNode.insertBefore(wrap,sel);wrap.append(btn,ul);setv(sel.value||(lis[0]&&lis[0].dataset.id)||"new");})();
// Objections, answered
fetch("/api/votes/answers").then(function(r){return r.json()}).then(function(j){var a=j.answers||[];if(!a.length)return;var box=document.getElementById("answers"),l=document.getElementById("ans-list");
a.forEach(function(x){var d=document.createElement("div");d.className="ans";var t=document.createElement("div");t.className="line";var li=lis.filter(function(y){return y.dataset.id===x.id})[0];t.textContent=li?li.querySelector(".t").textContent:"";
var q=document.createElement("div");q.className="q";q.textContent="“"+x.obj+"”";var an=document.createElement("div");an.className="a";an.textContent=x.ans;d.append(t,q,an);l.appendChild(d);});box.hidden=false;}).catch(function(){});
// Standing Keep/Cut votes: one per visitor per line. Tap to vote, tap again to take it back, tap the other to switch.
var U=null,V={},C={};try{U=localStorage.getItem("voteUid");V=JSON.parse(localStorage.getItem("myVotes")||"{}")||{}}catch(e){}
if(!U){U=(Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).slice(0,24);try{localStorage.setItem("voteUid",U)}catch(e){}}
function keepV(){try{localStorage.setItem("myVotes",JSON.stringify(V))}catch(e){}}
function paint(){lis.forEach(function(li){var r=li.querySelector(":scope>.vrow");if(!r)return;var x=C[li.dataset.id]||{},v=V[li.dataset.id],up=r.querySelector(".up"),dn=r.querySelector(".dn");
up.querySelector("b").textContent=x.keep||0;dn.querySelector("b").textContent=x.cut||0;up.setAttribute("aria-pressed",v==="keep");dn.setAttribute("aria-pressed",v==="cut");
up.setAttribute("aria-label",v==="keep"?"Take back my keep vote":"Keep this");dn.setAttribute("aria-label",v==="cut"?"Take back my cut vote":"Cut this");});}
function cast(id,v){return fetch("/api/votes/tap",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:id,v:v,u:U})}).then(function(r){return r.json()}).then(function(j){if(j.counts)C=j.counts;if(j.ok){if(j.mine)V[id]=j.mine;else delete V[id];keepV();}paint();return j;});}
lis.forEach(function(li){var r=document.createElement("div");r.className="vrow";r.innerHTML='<button type="button" class="up">▲ Keep <b>0</b></button><button type="button" class="dn">▼ Cut <b>0</b></button><span class="flash" aria-live="polite"></span>';
var t=li.querySelector(":scope>time");t.after(r);var fl=r.querySelector(".flash");
function tap(want){var v=V[li.dataset.id]===want?"none":want;cast(li.dataset.id,v).then(function(j){fl.textContent=j.ok?(v==="none"?"Vote taken back.":"Thanks! Tap again to take it back."):(j.error||"Try again later.");}).catch(function(){fl.textContent="Try again later.";});}
r.querySelector(".up").onclick=function(){tap("keep")};r.querySelector(".dn").onclick=function(){tap("cut")};});
fetch("/api/votes/mine?u="+encodeURIComponent(U)).then(function(r){return r.json()}).then(function(j){V=j.mine||{};C=j.counts||{};keepV();paint();}).catch(function(){});
document.getElementById("v-form").addEventListener("submit",function(e){e.preventDefault();var f=e.target,m=document.getElementById("v-msg"),w=document.getElementById("v-why"),id=sel.value,v=(f.querySelector("input[name=v]:checked")||{}).value||"keep",why=(w.value||"").trim();
if(id==="new"&&!why){m.textContent="Tell me your idea in the box.";return;}
var note=function(){if(!why)return Promise.resolve({ok:true});return fetch("/api/votes",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:id,v:v,why:why,website:f.website.value})}).then(function(r){return r.json()});};
(id==="new"?note():cast(id,v).then(function(j){return j.ok?note():j;})).then(function(j){m.textContent=j&&j.ok?"Thank you. I read every one of these.":((j&&j.error)||"That didn't work. Try again later.");if(j&&j.ok)w.value="";})
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
b.textContent=x.v+" · "+x.id;d.textContent=x.why;s.textContent=new Date(x.date).toLocaleString();li.append(b,d,s);
if(x.id!=="new"){var a=document.createElement("button");a.type="button";a.textContent="Answer publicly";a.style.cssText="display:block;margin-top:6px;font:inherit;font-size:15px;cursor:pointer";
a.onclick=function(){var obj=prompt("The objection as it will appear publicly (paraphrase it; no names):",x.why);if(!obj)return;var ans=prompt("Your answer:");if(!ans)return;
fetch("/api/votes/answers",{method:"POST",headers:{"content-type":"application/json","x-password":p||""},body:JSON.stringify({id:x.id,obj:obj,ans:ans})}).then(function(r){return r.json()}).then(function(j){a.textContent=j.ok?"Answered. It now shows on /goals.":(j.error||"Could not save.");});};li.appendChild(a);}
l.appendChild(li);});})
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
    body: `<article><h1>${esc(e.title)}</h1><p class="when" style="margin:10px 0 0">${prettyDate(e.date)}</p>${why(e)}<hr class="rule">${listen}${prose(e.body)}</article>`,
  });
}

function nowPage() {
  return page({
    title: `Now · ${site.name}`,
    path: "/now",
    body: `<h1>Now</h1><hr class="rule">${site.now.updated ? `<p class="intro">Updated ${esc(site.now.updated)}.</p>` : ""}<ul class="lines">${(site.now.items || [])
      .map((i) => `<li>${inline(textOf(i))}${why(i)}</li>`)
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

// Votes on ranked lines. Each visitor (a random id kept in their browser) has at most one
// standing vote per line, "keep" or "cut", which they can change or take back any time.
// New voters are capped per network per day, and notes per network per day.
function sameOrigin(request, url) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === url.host; } catch { return false; }
}
async function readJson(request) {
  const raw = await request.text();
  if (raw.length > 4000) return null;
  try { const f = JSON.parse(raw); return f && typeof f === "object" ? f : null; } catch { return null; }
}
const dayKey = async (prefix, request) =>
  prefix + (await hash((request.headers.get("cf-connecting-ip") || "") + "|" + Math.floor(Date.now() / 86400000)));
const voterKey = async (u) => "votes:voter:" + (await hash("u|" + u));
const validUid = (u) => /^[a-z0-9]{8,40}$/.test(u);

async function votesApi(request, env, url) {
  if (!F.voting || !env.SITE) return json({ counts: {} });
  if (request.method === "GET") return json({ counts: await load(env, "votes:counts", {}) });
  if (request.method !== "POST") return json({ ok: false }, 405);
  if (!sameOrigin(request, url)) return json({ ok: false, error: "Not allowed" }, 403);
  // Notes from "Help me rewrite this list" (the vote itself goes through /api/votes/tap).
  const f = await readJson(request);
  if (!f) return json({ ok: false, error: "Bad data" }, 400);
  if (f.website) return json({ ok: true }); // bots
  const id = String(f.id || ""), v = f.v === "cut" ? "cut" : "keep", why = String(f.why || "").trim().slice(0, 600);
  if (!(rankedIds.has(id) || id === "new") || !why) return json({ ok: false, error: "Write something in the box." }, 400);
  const lk = await dayKey("votes:notelim:", request);
  const n = Number((await env.SITE.get(lk)) || 0);
  if (n >= 30) return json({ ok: false, error: "That's a lot of notes for one day. Thank you! Try again tomorrow." }, 429);
  await env.SITE.put(lk, String(n + 1), { expirationTtl: 172800 });
  const notes = await load(env, "votes:notes", []);
  notes.push({ id, v, why, date: new Date().toISOString() });
  while (notes.length > 5000) notes.shift();
  await env.SITE.put("votes:notes", JSON.stringify(notes));
  return json({ ok: true });
}

async function myVotesApi(request, env, url) {
  const counts = F.voting && env.SITE ? await load(env, "votes:counts", {}) : {};
  const u = String(url.searchParams.get("u") || "");
  if (!F.voting || !env.SITE || !validUid(u)) return json({ mine: {}, counts });
  const M = await load(env, await voterKey(u), {});
  const mine = {};
  for (const k of Object.keys(M)) if (rankedIds.has(k)) mine[k] = M[k];
  return json({ mine, counts });
}

async function tapApi(request, env, url) {
  if (!F.voting || !env.SITE) return json({ ok: false, error: "Voting is off." }, 503);
  if (request.method !== "POST") return json({ ok: false }, 405);
  if (!sameOrigin(request, url)) return json({ ok: false, error: "Not allowed" }, 403);
  const f = await readJson(request);
  if (!f) return json({ ok: false, error: "Bad data" }, 400);
  const id = String(f.id || ""), v = String(f.v || ""), u = String(f.u || "");
  if (!rankedIds.has(id) || !["keep", "cut", "none"].includes(v)) return json({ ok: false, error: "Pick Keep or Cut." }, 400);
  if (!validUid(u)) return json({ ok: false, error: "Refresh the page and try again." }, 400);
  const vk = await voterKey(u);
  let M = await load(env, vk, null);
  if (!M) {
    const lk = await dayKey("votes:newvoter:", request);
    const n = Number((await env.SITE.get(lk)) || 0);
    if (n >= 25) return json({ ok: false, error: "Too many new voters from this network today. Try again tomorrow." }, 429);
    await env.SITE.put(lk, String(n + 1), { expirationTtl: 172800 });
    M = {};
  }
  const counts = await load(env, "votes:counts", {});
  const cur = M[id], next = v === "none" ? undefined : v;
  if (cur !== next) {
    const c = counts[id] || { keep: 0, cut: 0 };
    if (cur) c[cur] = Math.max(0, (c[cur] || 0) - 1);
    if (next) c[next] = (c[next] || 0) + 1;
    counts[id] = c;
    await env.SITE.put("votes:counts", JSON.stringify(counts));
  }
  if (next) M[id] = next; else delete M[id];
  await env.SITE.put(vk, JSON.stringify(M));
  return json({ ok: true, counts, mine: next || null });
}

// Public answers to readers' objections ("Objections, answered" on /goals).
async function answersApi(request, env) {
  if (!F.voting || !env.SITE) return json({ answers: [] });
  if (request.method === "GET") return json({ answers: await load(env, "votes:answers", []) });
  if (request.method !== "POST") return json({ ok: false }, 405);
  if (!checkPassword(request, env)) return json({ ok: false, error: "Wrong password" }, 401);
  let f;
  try { f = await request.json(); } catch { return json({ ok: false, error: "Bad data" }, 400); }
  const answers = await load(env, "votes:answers", []);
  if (f && Number.isInteger(f.remove)) { answers.splice(f.remove, 1); }
  else {
    const id = String(f?.id || ""), obj = String(f?.obj || "").trim().slice(0, 600), ans = String(f?.ans || "").trim().slice(0, 1200);
    if (!rankedIds.has(id) || !obj || !ans) return json({ ok: false, error: "Need a line, an objection and an answer." }, 400);
    answers.push({ id, obj, ans, date: new Date().toISOString() });
    while (answers.length > 500) answers.shift();
  }
  await env.SITE.put("votes:answers", JSON.stringify(answers));
  return json({ ok: true, answers });
}

// ── New-subscriber email (optional, off by default; see README) ──
// Buttondown sends each event to /api/buttondown/hook, signed with your signing key. When someone confirms, you get
// one plain email: their address, your subscriber count, the page they signed up from, and any flag you set in
// site.subscriberFlags (for example { "school.edu": "School" }). Always answers 200 once the signature checks out,
// so Buttondown never retries forever. Needs: features.subscriberEmails = true, an EMAIL send_email binding,
// and the secrets BUTTONDOWN_API_KEY, BUTTONDOWN_SIGNING_KEY and OWNER_EMAIL.
const b64 = (s) => { const b = new TextEncoder().encode(s); let x = ""; for (const c of b) x += String.fromCharCode(c); return btoa(x); };
const mimeHdr = (s) => "=?UTF-8?B?" + b64(s) + "?=";
async function signatureOk(raw, header, key) {
  let sig = String(header || "").trim();
  if (sig.toLowerCase().startsWith("sha256=")) sig = sig.slice(7);
  if (!/^[0-9a-f]{64}$/i.test(sig)) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", k, new Uint8Array(sig.match(/../g).map((h) => parseInt(h, 16))), raw);
}
async function buttondown(env, path) {
  const r = await fetch("https://api.buttondown.com/v1" + path, { headers: { authorization: "Token " + env.BUTTONDOWN_API_KEY, accept: "application/json" } });
  if (!r.ok) throw new Error("Buttondown " + path.split("?")[0] + " answered " + r.status);
  return r.json();
}
function subscriberEmail(from, to, sub, count) {
  const clean = (s) => String(s || "").replace(/[\r\n]+/g, " ").trim();
  const email = clean(sub.email_address) || "(address not found)";
  const rows = [["Email", email], ["Subscriber", "#" + count]];
  if (clean(sub.referrer_url)) rows.push(["Signed up from", clean(sub.referrer_url)]);
  for (const [domain, label] of Object.entries(site.subscriberFlags || {}))
    if (email.toLowerCase().endsWith("@" + String(domain).toLowerCase())) rows.push([label, "Yes"]);
  const subject = `New subscriber: ${email} (#${count})`;
  const text = "New subscriber\n\n" + rows.map((r) => r[0] + ": " + r[1]).join("\n") + "\n";
  const font = `'${T.font}',Georgia,'Times New Roman',serif`;
  const htmlBody = `<!doctype html><html><body style="margin:0;padding:24px;background:${T.background};font-family:${font};color:${T.accent}">`
    + `<div style="max-width:520px;margin:0 auto;border-top:3px solid ${T.highlight};padding-top:18px">`
    + `<p style="margin:0 0 14px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${T.highlight}">New subscriber</p>`
    + `<table style="border-collapse:collapse;font-size:18px;line-height:1.5">`
    + rows.map((r) => `<tr><td style="padding:2px 18px 2px 0;opacity:.7">${esc(r[0])}</td><td style="padding:2px 0">${esc(r[1])}</td></tr>`).join("")
    + `</table></div></body></html>`;
  const b = "sub-" + crypto.randomUUID();
  const wrap = (s) => b64(s).replace(/.{76}/g, "$&\r\n");
  const raw = [
    `From: ${mimeHdr(site.name || "My site")} <${from}>`, `To: <${to}>`, `Subject: ${mimeHdr(subject)}`,
    `Message-ID: <${crypto.randomUUID()}@${from.split("@")[1]}>`, `Date: ${new Date().toUTCString()}`, "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${b}"`, "",
    "--" + b, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(text),
    "--" + b, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", wrap(htmlBody),
    "--" + b + "--", "",
  ].join("\r\n");
  return new EmailMessage(from, to, raw);
}
async function subscriberHook(request, env, url) {
  if (!env.BUTTONDOWN_SIGNING_KEY) return json({ error: "not configured" }, 503);
  const header = request.headers.get("x-buttondown-signature");
  if (!header) return json({ error: "missing signature" }, 401);
  const raw = await request.arrayBuffer();
  if (raw.byteLength > 65536 || !(await signatureOk(raw, header, env.BUTTONDOWN_SIGNING_KEY))) return json({ error: "bad signature" }, 401);
  try {
    const ev = JSON.parse(new TextDecoder().decode(raw));
    if (!ev || ev.event_type !== "subscriber.confirmed") return json({ ok: true, ignored: true });
    if (!ev.id || !env.SITE) return json({ ok: true });
    const seen = "bd:evt:" + String(ev.id).slice(0, 120);
    if (await env.SITE.get(seen)) return json({ ok: true, duplicate: true });
    await env.SITE.put(seen, "1", { expirationTtl: 604800 });
    const d = ev.data || {};
    const id = typeof d.subscriber === "object" && d.subscriber ? d.subscriber.id : d.subscriber || d.subscriber_id || d.id;
    let sub = {};
    try { if (id && env.BUTTONDOWN_API_KEY) sub = await buttondown(env, "/subscribers/" + encodeURIComponent(id)); }
    catch (e) { console.log("subscriber lookup failed", e && e.message); }
    const prev = await env.SITE.get("bd:count");
    let count = prev === null ? NaN : Number(prev) + 1;
    if (!Number.isFinite(count)) {
      try { count = Number((await buttondown(env, "/subscribers?type=regular")).count); } catch (e) { console.log("subscriber count failed", e && e.message); }
    }
    if (Number.isFinite(count) && count > 0) await env.SITE.put("bd:count", String(count)); else count = "?";
    const to = String(env.OWNER_EMAIL || "").trim();
    if (!to || !env.EMAIL) { console.log("no OWNER_EMAIL or EMAIL binding, email skipped"); return json({ ok: true, emailed: false }); }
    const from = String(env.NOTIFY_FROM || "notify@" + url.hostname.replace(/^www\./, "")).trim();
    try { await env.EMAIL.send(subscriberEmail(from, to, sub, count)); }
    catch (e) { console.log("subscriber email failed", e && e.message); return json({ ok: true, emailed: false }); }
    return json({ ok: true, emailed: true });
  } catch (e) {
    console.log("subscriber hook error", e && e.message);
    return json({ ok: true, error: true });
  }
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
    if (p === "/api/buttondown/hook" && request.method === "POST" && F.subscriberEmails) return subscriberHook(request, env, url);
    if (p === "/api/goals") return goalsApi(request, env);
    if (p === "/api/votes") return votesApi(request, env, url);
    if (p === "/api/votes/answers") return answersApi(request, env);
    if (p === "/api/votes/tap") return tapApi(request, env, url);
    if (p === "/api/votes/mine") return myVotesApi(request, env, url);
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
