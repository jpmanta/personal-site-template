# Make your own personal website

A simple, beautiful personal site with goals you cross off as you go, essays visitors can listen to, and a list of beliefs people can vote on. It's free to host, it's yours, and you change it by talking to Claude.

Made by [Jonathan Manta](https://jonathanmanta.com). Take it and make it your own.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jpmanta/personal-site-template)

## Get your site live (about 5 minutes, no code)

1. **Click the orange "Deploy to Cloudflare" button above.** Sign up for free with Cloudflare and GitHub if it asks.
2. **Pick a password when it asks for `ADMIN_PASSWORD`.** You'll type it on your site to cross off goals.
3. **Click Deploy.** In a minute you'll have a live site at `your-site-name.your-name.workers.dev`.

It starts with example text. Next, make it yours:

4. **Open [STARTER-PROMPT.md](STARTER-PROMPT.md) and paste the prompt into [Claude](https://claude.ai).** Claude interviews you and writes your whole site.
5. **On GitHub, open your new repository → `src/site.js` → the pencil icon.** Replace everything with what Claude gave you, then click **Commit changes**. Your site updates itself in about a minute.

That's it. To change anything later, use the remix prompt at the bottom of STARTER-PROMPT.md and repeat step 5.

## Common questions

**What does it cost?** Nothing. Cloudflare's free plan covers a personal site. A custom domain like `yourname.com` is optional, about $10–20 a year.

**How do I add my photo?** On GitHub, open the `public` folder → **Add file → Upload files**, upload a square photo named `me.jpg`, and commit. Then set `photo: "/me.jpg"` in `src/site.js`.

**How do I cross off a goal?** Go to `/goals` on your site, tap the box next to it and enter your password. It records the month you did it.

**Where do I read what people wrote when they voted?** Go to `/goals/feedback` on your site and enter your password. Vote counts are public; the comments are only for you.

**How do I use my own domain?** In Cloudflare, open your Worker → **Settings → Domains & Routes → Add → Custom domain**.

**How do I turn something off?** In `src/site.js`, set any of the `features` to `false`.

**Can I get an email when someone subscribes to my newsletter?** Yes, if your newsletter is on [Buttondown](https://buttondown.com) and your site is on your own domain. It's off until you set it up:
1. In Cloudflare, turn on **Email Routing** for your domain and verify your own address there.
2. In `wrangler.jsonc`, add `"send_email": [{ "name": "EMAIL", "destination_address": "you@example.com" }]` with that address.
3. In Cloudflare, open your Worker → **Settings → Variables and Secrets** and add three secrets: `BUTTONDOWN_API_KEY` (Buttondown → Settings → API), `BUTTONDOWN_SIGNING_KEY` (any long random text) and `OWNER_EMAIL` (the same address as in step 2). Optional: `NOTIFY_FROM`, the address it sends from (default `notify@yourdomain`).
4. In `src/site.js`, set `subscriberEmails: true` under `features`.
5. In Buttondown → **Settings → Webhooks → New webhook**: URL `https://yourdomain/api/buttondown/hook`, event `subscriber.confirmed`, and the same signing key.

**I forgot my password.** In Cloudflare, open your Worker → **Settings → Variables and Secrets**, and edit `ADMIN_PASSWORD`.

## What's inside

- `src/site.js` is everything about you: words, goals, essays, colors and font. It's the only file you need to edit.
- `src/worker.js` is the engine that turns it into pages. You don't need to touch it, but you can (ask Claude).
- `public/` holds your photo and any other files.

Pages: `/` (home), `/goals`, `/essays`, `/now`, plus a sitemap so Google can find you.

## License

MIT. Use it, change it, share it.
