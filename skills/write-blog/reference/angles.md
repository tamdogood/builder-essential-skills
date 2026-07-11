# Picking an angle that doesn't cannibalize

The blog's job is SEO traction to your project and its site. That only works if each post
owns a **distinct search cluster.** Two posts chasing the same keywords split their own
ranking. So the first rule of a new post is: pick an angle no shipped post already owns.

## How to check what's taken

Your post registry / index is the live record. Read every title, description, and tag set
before pitching. Each shipped post should own one spine, one topic cluster. Write down, for
each existing post, the one search cluster it owns, then make sure your new angle sits in a
gap between them, not on top of one.

For example, on a developer-tool blog the shipped posts might each own a distinct spine: one
on how the core mechanism works, one on a specific integration, a numbered "bugs that hid
until production" war-stories post, a field-guide survey of the landscape, and a "why not
just use X" honest-comparison post. A new post has to find the next gap, not re-litigate one
of those.

Always re-read the registry at write time; any list you wrote down earlier is a snapshot and
the registry is the truth.

## Finding an untapped angle

Good starting points for a gap the existing posts don't cover:

- **A deep dive on a subsystem no post has centered yet** (security/trust model, storage and
  ops, a specific protocol or format). Check that a related post hasn't already spent the key
  anecdotes; if it has, the new post needs a different spine.
- **A "how we actually build this" process post** if the engineering workflow itself is
  interesting and undocumented.
- **An interoperability or integration story** that a broad post only mentioned in passing.
- **An honest comparison** ("why not just use X") that no existing post has made head-on.

Mine your own docs and issues for these. The best untapped angles are usually questions your
users already ask that no post answers directly yet.

## When to write a checklist / listicle instead

Usually don't. The house format is a spine with a thesis, not a listicle. A "top N tools"
post ranks briefly and ages badly, and it doesn't fit the voice. If a contributor wants one,
steer them to a spine post on the same topic instead.

## Keyword discipline

- One primary phrase per post; put it in the `title`, the description (meta description),
  the first H2, and the tags.
- Pick phrases a real developer in your audience would type into a search box (an exact error
  message, the plain name of a concept, a comparison like "X vs Y"), not brand-y phrases
  nobody searches.
- Internal-link to 1-2 sibling posts so ranking flows between them instead of competing.
