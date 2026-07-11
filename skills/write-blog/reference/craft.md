# Writing craft: make a technical post that people finish

The house voice (`voice.md`) tells you what to strip. This file tells you what to build. A
post that ranks but reads like a spec sheet gets a 90% bounce and never earns a backlink.
Craft is what turns a correct post into one people finish and share.

Study the shipped posts before you write. They are the ground truth for the craft, not this
file. Read two full ones from your blog's source and notice what they actually do.

## The lead is 80% of the job

Most readers decide in the first two sentences. The lead is also your meta description and
your search snippet, so it does double duty. Every shipped lead names a concrete, specific
problem the reader already feels, with zero throat-clearing.

- War-story open: `"A WebSocket that passed every localhost test and died the moment it
  spoke TLS."` A single failing scene, not a topic sentence.
- Tension open: `"Two agents can talk about a change all day. Handing over the change
  itself, byte for byte, is a different problem."` State the easy thing, then the hard thing.
- Contrarian open: `"AI agent memory in 2026 is mostly single-player."` A claim someone
  could disagree with.

Bad leads announce the topic ("In this post we'll explore agent memory"). Good leads drop
the reader into a problem mid-scene. If your lead would survive being pasted into a search
result as the one line that wins the click, it's ready. This is where `/direct-response-copy`
earns its keep: run it on the title and lead specifically.

## Structure is a spine, not a pile

A ranking technical post is an argument that moves. Each section advances one claim and
hands off to the next. The test: read only your H2s in order. Do they tell a story on their
own? If they read like a glossary ("Overview", "Architecture", "Details", "Conclusion"),
the spine is missing. Rewrite the H2s to be claims: "Identity is not authorization",
"One SQLite file, two search engines".

Proven shapes:

- **Problem to mechanism.** Name the pain, show the naive fix, show why it breaks, show the
  real mechanism with code.
- **Numbered war stories.** N self-contained bug narratives, each with a one-line lesson,
  bound by a theme. Scannable and linkable.
- **Field guide.** Survey the landscape honestly, then place your thing inside it. Earns
  authority because it credits the alternatives.

## Show the machine

The single biggest credibility lever in a technical post is real code, real commands, real
numbers from your project, quoted accurately. Read the actual source and docs of your
project and paste the actual thing. A reader who spots one invented API stops trusting the
whole post. One accurate 8-line snippet beats three paragraphs describing it.

Give every code block a job. Don't paste code and move on; the sentence before it says what
to watch for, the sentence after says what just happened. Numbers are strongest of all:
"buffers the whole blob in RAM" is fine, "buffers the whole blob in RAM, so a 200MB bundle
is 200MB resident" lands.

## Rhythm and voice

- Vary sentence length on purpose. A four-word sentence after a long one is a drum hit. If
  every sentence is the same length the reader's eye glazes; the humanizer will not catch
  monotony, only you will. Read it out loud.
- Have exactly one opinion per post and defend it. Contrarian-but-earned is the house
  register: "most guides get this wrong" only works if you then show why, with code.
- Admit what's deferred. A limitations beat ("what this is NOT") is the reason the post
  reads like an engineer wrote it and not marketing. Candor converts.
- First person when it fits. "I shipped this and it warmed up my laptop" beats "the system
  experienced elevated CPU utilization."

## Close on a next action, not a summary

Never end with "in conclusion, as agents evolve, the possibilities are endless." End on one
concrete thing the reader can do or check right now: a command to run, a file to read, a
repo to clone, a claim to go verify. The close is where you convert a reader into a repo
star or a hub signup, so make it a door, not a wall.

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

Read the whole thing out loud once. Three failure modes to catch: it sounds like a
Wikipedia intro (clean but no pulse: add an opinion or a war story), it sounds like a sales
page (promotional: cut adjectives, add code), or you got bored reading it (the spine
sagged: find the section that repeats the one before it and cut it). Only ship a post you
would actually finish reading.
