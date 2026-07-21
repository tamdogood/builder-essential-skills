# Writing craft: make a technical post that people finish

The house voice (`voice.md`) tells you what to strip. This file tells you what to build. A
post that ranks but reads like a spec sheet can lose readers. Craft helps readers finish
and share a correct post.

Study the shipped posts before you write. They are the ground truth for the craft, not this
file. Read two full ones from your blog's source and notice what they actually do.

## Make the lead specific

Most readers decide in the first two sentences. The lead is also your meta description and
your search snippet, so it does double duty. Every shipped lead names a concrete, specific
problem the reader already feels, with zero throat-clearing.

- War-story open: `"A WebSocket that passed every localhost test and died the moment it
  spoke TLS."` A single failing scene, not a topic sentence.
- Tension open: `"Two agents can talk about a change all day. Handing over the change
  itself, byte for byte, is a different problem."` State the easy thing, then the hard thing.
- Contrarian open: `"AI agent memory in 2026 is mostly single-player."` A claim someone
  could disagree with.

Bad leads announce the topic ("In this post we'll explore agent memory"). Good leads state
the problem directly. If the lead can stand alone as a search result, it is ready. This is
where `/direct-response-copy` helps: run it on the title and lead specifically.

## Give the post a clear structure

A ranking technical post presents a sequence of claims. Each section advances one claim
and prepares the next. Read only the H2s in order. They must show the argument. If they
read like a glossary ("Overview", "Architecture", "Details", "Conclusion"), rewrite them
as specific claims.

Proven shapes:

- **Problem to mechanism.** Name the pain, show the naive fix, show why it breaks, show the
  real mechanism with code.
- **Numbered war stories.** N self-contained bug narratives, each with a one-line lesson,
  bound by a theme. Scannable and linkable.
- **Field guide.** Survey the landscape honestly, then place your thing inside it. Earns
  authority because it credits the alternatives.

## Show the machine

The strongest credibility signal in a technical post is real code, real commands, and real
numbers from your project. Read the actual source and docs before you quote them. An
invented API can make the whole post untrustworthy. One accurate short snippet is better
than several paragraphs that describe it.

Give every code block a job. Don't paste code and move on; the sentence before it says what
to watch for, the sentence after says what just happened. Numbers are strongest of all:
"buffers the whole blob in RAM" is fine, "buffers the whole blob in RAM, so a 200MB bundle
is 200MB resident" lands.

## Keep the prose clear

- Use short sentences. Combine sentences only when the relationship is clear. Read the
  draft out loud and fix sentences that are hard to follow.
- Have one opinion per post and defend it. A contrarian view is useful only when you show
  why it is correct, with code.
- Admit what's deferred. A limitations beat ("what this is NOT") is the reason the post
  reads like an engineer wrote it and not marketing. Candor converts.
- First person when it fits. "I shipped this and it warmed up my laptop" beats "the system
  experienced elevated CPU utilization."

## Close with a next action

Never end with "in conclusion, as agents evolve, the possibilities are endless." End on one
concrete thing the reader can do or check now: a command to run, a file to read, a repo to
clone, or a claim to verify.

## Which creative skill to reach for, when

These are optional helper skills; use them if available in your environment.

- `/humanizer`: mandatory pass on the finished draft. Strips AI tells. This is the gate
  in the main workflow. If it isn't available, apply the checklist in `voice.md` by hand.
- `/direct-response-copy`: the title, the description/lead, and the closing CTA. Use its
  framework vocabulary (a promise, a specific mechanism, a reason to act now) on those three
  surfaces. Do not let it inflate the body into ad copy; the body stays plain and technical.
- `/x-tweet`: after the post ships, for the distribution thread that seeds traction. See
  `seo.md`. A post nobody links to does not rank.

## The finish test

Read the whole post out loud once. Check three failure modes: it sounds like a generic
introduction, it sounds like a sales page, or a section repeats the previous section. Add a
specific opinion or example, cut promotional words, or remove repeated content. Ship only a
post that is clear and useful.
