// ─────────────────────────────────────────────────────────────
//  THIS IS THE ONLY FILE YOU NEED TO EDIT.
//  Easiest way: paste STARTER-PROMPT.md into Claude, answer its
//  questions, and replace this whole file with what it gives you.
// ─────────────────────────────────────────────────────────────

export default {
  // ── Who you are ──────────────────────────────────────────
  name: "Your Name",
  description: "A short sentence about you, shown in Google results and link previews.",
  // Put a square photo at public/me.jpg and write "/me.jpg" here.
  // Leave it empty ("") to show your initials instead.
  photo: "",

  // One line each, shown under your name. [text](link) makes a link.
  lines: [
    "Studying something at Some University.",
    "Building [My Project](https://example.com), 2026 onward.",
  ],
  // Optional: one main ask, shown as a card under your lines.
  // Leave it out (or delete it) if you don't want one.
  // mainAsk: { text: "This year I'm building My Project. Come try it.", button: "Try My Project", url: "https://example.com" },

  // Quieter, italic lines for hobbies and personality.
  quietLines: [
    "Chess by day, jazz by night.",
  ],

  // ── Look and feel ────────────────────────────────────────
  theme: {
    background: "#FAF9F6",
    text: "#1B2233",
    accent: "#14244A",  // headings and links
    highlight: "#B39556", // lines, checkboxes, underlines
    // Any Google Font name: https://fonts.google.com
    font: "Cormorant Garamond",
  },

  // ── Homepage sections (each one opens and closes) ────────
  reading: [
    { title: "The Almanack of Naval Ravikant", author: "Eric Jorgenson", url: "https://www.navalmanack.com" },
    { title: "How to Do Great Work", author: "Paul Graham", url: "https://paulgraham.com/greatwork.html" },
  ],
  quotes: [
    // Only quotes you can source. If you're unsure, write "Attributed to …".
    { text: "Play long-term games with long-term people.", by: "Naval Ravikant" },
  ],

  // ── Goals page (/goals) ──────────────────────────────────
  // You cross goals off on the live site with your password.
  // Give every goal a short id and never change it afterwards:
  // checkmarks and votes are saved under that id.
  goals: {
    intro: "Things I want to do with my life. I cross them off as I go.",
    list: [
      { id: "marathon", text: "Run a marathon" },
      {
        id: "continents", text: "Set foot on all seven continents",
        sub: [
          { id: "c-europe", text: "Europe" },
          { id: "c-asia", text: "Asia" },
        ],
      },
      {
        id: "company", text: "Build a company that matters",
        // Optional: a ranked list of beliefs under one goal, which
        // visitors can vote Keep / Cut / Change on (see features.voting).
        ranked: {
          note: "The principles I'll build it on, ranked. Vote on any line and tell me what you'd change.",
          groups: [
            { title: "How I work", items: [
              { id: "r-honest", text: "Tell the truth, even when it costs me" },
              { id: "r-customers", text: "Talk to customers every week" },
            ]},
          ],
        },
      },
    ],
  },

  // ── Essays (/essays) ─────────────────────────────────────
  // Write in plain text. Blank line = new paragraph.
  // *italic*, **bold**, [link](https://…), and "## " starts a heading.
  essays: [
    {
      slug: "hello",
      title: "Why I Made This Site",
      date: "2026-11-13",
      body: `I wanted one place on the internet that's actually mine.

## What's here

My goals, which I cross off as I go, and the ideas I keep coming back to. Tell me what you think.`,
    },
  ],

  // ── Now page (/now): what you're focused on these days ───
  now: {
    updated: "November 2026",
    items: [
      "Finishing my degree.",
      "Reading a lot about game theory.",
    ],
  },

  // ── Contact ──────────────────────────────────────────────
  contact: {
    text: "The best way to reach me is email. I read everything.",
    email: "you@example.com",
    links: [
      { label: "LinkedIn", url: "https://www.linkedin.com/" },
    ],
  },

  // ── Features: switch things on and off ───────────────────
  features: {
    goals: true,     // the /goals page
    voting: true,    // public Keep / Cut / Change votes on ranked lists
    essays: true,    // the /essays page
    readAloud: true, // a "Listen" button on essays (free, uses the browser's voice)
    now: true,       // the /now page
  },
};
