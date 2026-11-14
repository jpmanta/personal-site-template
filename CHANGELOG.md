# What's new

Updates to this template, newest first. If your site was made from it, your site picks these up by itself every Monday. To get them right away: open your repository on GitHub → Actions → Get updates → Run workflow.

Updates only ever change the engine (`src/worker.js`) and these instructions. Your words, photo and settings (`src/site.js`, `public/`, `wrangler.jsonc`) are never touched.

- **Nov 14, 2026:** Voting is now one standing vote per person per line, instead of one vote a day. Every ranked line has ▲ Keep and ▼ Cut buttons with live counts. Tap one to vote, tap it again to take your vote back, or tap the other to switch. "Help me rewrite this list" now offers just Keep it and Cut it: it sets the same vote and sends your note. Votes counted before this update stay in the totals.
- **Nov 14, 2026:** The links under your name are now pill buttons on one line, and they shrink to fit on phones. Voting on /goals has a picker that matches your site and shows each line in full, grouped by section. New: "Objections, answered". At /goals/feedback, press "Answer publicly" under a note to post a reader's objection (paraphrased, never their name) with your answer, and it shows on /goals. Also new and optional: one main ask, a card with a button under your lines. To turn it on, add `mainAsk` to `src/site.js` (there's an example there).
- **Nov 14, 2026:** Your site can now get updates by itself. Every Monday it checks this template for improvements and installs them, then Cloudflare republishes your site.
