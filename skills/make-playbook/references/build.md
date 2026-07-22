# Build

> Inspired by the "Build" chapter of Pieter Levels' *MAKE: The Indie Maker Blueprint*. This is an original checklist/diagnostic built around that chapter's core ideas — for the full chapter, examples, and author's voice, [buy the book](https://readmake.com).

## Core principles

- **Build fast and minimal.** Cheap hosting, mature frameworks, and no-code tools mean an idea can become a basic working product in days, not months. Users decide whether something is worth their attention almost immediately — slow, over-planned development loses to fast, minimal shipping.
- **Perfectionism is the main failure mode, not imperfection.** Endless meetings and iterations to get one detail "right" before shipping usually cost more than they're worth. Decide what genuinely needs to be right today, ship everything else as-is, and iterate. The floor is that the core function has to actually work — "minimal" is not an excuse for broken.
- **Do the early building yourself wherever you can.** Being able to fix a bug or ship a small change yourself, in minutes, compounds daily in a way that routing every change through someone else's schedule and availability cannot. You don't need to be an expert — being able to do it all reasonably well beats not being able to do it at all. This is specifically a *beginning-of-company* stance: once a model is proven, hiring to scale it is the right next move (see automate.md and monetize.md).
- **Use the tools you already have, and learn new ones just-in-time.** Don't spend months front-loading a new framework "because it's better" — proven, boring, well-documented technology works fine, and you can swap pieces out later once real usage forces the decision. Learn the specific thing you need, right when you need it, not speculatively.
- **Constraints are an advantage.** No budget forces full ownership and discipline. No office means access to talent and time zones everywhere. Limited tooling forces you toward the fastest path to a real test of the idea instead of premature engineering.
- **A dependency on someone else's API is a real business risk.** If your core product sits entirely on top of a third-party API, they can change or remove it without warning. Know that risk going in, and avoid making it a single point of failure where you can.

## Native vs. web

Web ships and iterates faster; native gives better platform integration and store discoverability but costs more time per change. A common sequence: validate on web first, go native once there's a real user base that justifies the investment. The distinction is also blurring — many "native" apps are largely web content in a native shell, and web apps increasingly get device-level capabilities.

## You can validate without writing code

A fully no-code MVP stack, usable to test real demand (including collecting real payment) before writing custom code:

1. **Landing page** — any no-code site builder (Carrd, Squarespace, Webflow, etc.)
2. **Data intake** — a form tool (Typeform, Google Forms) — some form tools can collect payment directly, which is the fastest way to test whether people will actually pay before building a payment flow yourself
3. **Workflow glue** — an automation tool (Zapier, Make, n8n) to connect the form to email, a spreadsheet, a task board, or a human who fulfills the request manually behind the scenes
4. **Fulfillment** — for a service-style idea, the "backend" can just be you (or a contractor) manually doing the work the automation routes to you, for the first dozen customers

This lets you test whether people want and will pay for the outcome before investing in the custom-built version.

## Technology selection heuristics

- Prefer well-established, well-documented technology over the newest option — newer isn't automatically better, and boring tech has a much larger pool of existing answers to your future questions.
- You can migrate pieces later once real usage data forces the decision — don't pre-optimize for scale you don't have yet.
- Evaluate a new tool only when you have a concrete, immediate need for it.
- Keep the architecture simple: a plain frontend, a backend in whatever language you're fluent in, a straightforward database, and a clean separation between client and server so the client never touches the database directly.

## Diagnostic questions to work through

1. Are you building this yourself, or planning to outsource/hire before shipping anything? If outsourcing, what specifically is stopping you from doing a rough version yourself first?
2. What's the smallest version that does the one core thing well, shippable in days rather than months?
3. Could this be validated with a no-code stack before you write custom code?
4. Are you stuck evaluating tools/frameworks instead of building? What's the smallest decision that unblocks you today?
5. Does this depend entirely on a third-party API you don't control? What's your exposure if it changes or disappears?

## A week of practice (optional homework)

Rank your idea backlog by which ideas you could execute *fastest* with the skills and tools you already have, with nothing new to learn. Build the first working prototype of the top one — no-code or coded, doesn't matter — as long as its core function actually works end to end.
