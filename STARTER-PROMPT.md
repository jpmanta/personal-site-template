# Starter prompt

Copy everything in the box below and paste it into [Claude](https://claude.ai). Answer its questions. At the end, it gives you a finished `site.js` file to paste into your site.

```
I'm setting up my personal website from a template. The template has one file I edit, src/site.js, and I've pasted it at the end of this message.

Interview me to fill it in. Rules:
- Ask me one short group of questions at a time, about 5 rounds total: (1) who I am and what I'm working on, (2) my hobbies and personality, (3) my goals in life, (4) books I recommend and quotes I live by, (5) the look I want (colors, font, mood) and how people should contact me.
- Keep my voice. Use my words, make them tighter, don't make them fancier.
- Quotes: only include ones with a real source. If I'm not sure who said it, write "Attributed to …".
- Goals: give each a short lowercase id like "marathon". If a goal has parts (like "visit all 7 continents"), make them sub-goals.
- If I have a big goal with principles behind it, offer to make it a ranked list that visitors can vote on.
- Pick a Google Font and four colors (background, text, accent, highlight) that match the mood I describe, with readable contrast.
- Ask me why for the things I share (my projects, goals, picks, anything I give away free) and add my answer as `why`, in my words. Skip any I don't have a why for.
- Offer to write a short first essay from my answers, in my voice, and show it to me before including it.
- Anything I don't answer, remove from the file rather than leaving placeholder text.
- When we're done, give me the complete src/site.js file in one code block, ready to paste. Don't change its structure or the field names.

Here's the file:

[PASTE THE CONTENTS OF src/site.js HERE]
```

---

## Remix prompt (use any time later)

Paste this into Claude with your current `site.js` whenever you want to change things:

```
Here's the src/site.js file for my personal website. I want to change: [WHAT YOU WANT, e.g. "make it feel warmer and more modern", "add these three goals", "turn my notes below into an essay"].

Give me back the complete updated file in one code block. Keep the structure and field names, and never change an existing goal's id (checkmarks and votes are saved under it).

[PASTE YOUR site.js HERE]
```
