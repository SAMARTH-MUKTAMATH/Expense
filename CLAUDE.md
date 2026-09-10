# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## RULE 1 — DO NOT WRITE COMMENTS (this is the most important rule here)

**Default to zero comments. Write code that explains itself instead.**

This codebase had a serious over-commenting problem: giant JSDoc blocks, essays
above regexes, section banners, and paragraphs restating what the code already
said. That is noise. It rots, it lies after the next edit, and it buries the
actual logic. Do not add more of it.

### Hard limits

- **No comment may exceed 10 words.** If you need more than 10 words to explain
  a line, the line is wrong — rename it, extract a function, or restructure it.
- **No multi-line comments.** No `/** ... */` blocks. No JSDoc. No `@param`,
  `@returns`, `@typedef`, `@property`. Single-line `//` only.
- **No section banner comments.** No `// ---- Helpers ----`, no
  `// === Public API ===`, no ASCII dividers.
- **No file-header comments.** No "This module does X" preamble. No
  "Phase N of docs/..." breadcrumbs.
- **No comment that restates the code.** If the comment and the line say the
  same thing, delete the comment.
- **No commented-out code.** Delete it. Git remembers.
- **No changelog or narration comments.** No "added this for X", "fixed bug
  where Y", "moved from Z". That belongs in the commit message.

### The only comments allowed

A comment is allowed **only** when it records something the code physically
cannot say, and it must still be under 10 words:

- A non-obvious *why*: `// increment avoids clobbering concurrent writes`
- A real external constraint: `// Vercel Edge caps bundles at 1MB`
- A genuine `// TODO:` or `// HACK:` with a reason
- A `// eslint-disable-...` or similar tooling directive

If you are unsure whether a comment qualifies, **do not write it.**

### Write this instead of a comment

Name things well. A function called `rejectPromotionalMessages()` needs no
paragraph above it. Split long functions. Use named constants instead of
explaining a magic number. Make the types and the control flow obvious.

### When editing existing code

If you touch a function that carries bloated comments, **strip them as part of
the edit.** Do not preserve them out of politeness. Never re-add a comment block
you previously deleted.

---

## RULE 2 — No unrequested extras

Do what was asked. Do not add defensive wrappers, extra abstraction layers,
"future-proofing", or new files that were not requested.

---

## Project

Paisa — a Next.js personal finance tracker.

- Next.js 16 App Router, React 19, JavaScript (not TypeScript)
- Prisma 7 + Postgres, Clerk auth, Arcjet middleware, Inngest jobs
- Tailwind v4 + shadcn/ui, Recharts, Sonner
- Server Actions live in `actions/`, shared logic in `lib/`, routes in `app/`

Commands: `npm run dev`, `npm run build`, `npm run lint`
