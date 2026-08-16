# Interactive Repository System Map Specification

Use this specification to translate repository evidence into a consistent
teaching interface. Keep the data model small enough to inspect directly.

## Contents

- [Evidence model](#evidence-model)
- [Buildings and zones](#buildings-and-zones)
- [Relationships and payloads](#relationships-and-payloads)
- [Learner explanations](#learner-explanations)
- [Interface and interaction](#interface-and-interaction)
- [Isometric rendering](#isometric-rendering)
- [Accessibility and trust boundaries](#accessibility-and-trust-boundaries)
- [Acceptance checklist](#acceptance-checklist)

## Evidence Model

Embed one inspectable data object in the artifact. It needs only these shapes:

```text
repository
  url, branch, commit, commitTime, analyzedAt, focus

node
  id, label, kind, zone, position, height
  plainRole, repoRole, whyItMatters
  inputs[], outputs[], terms[], citations[], confidence

edge
  id, from, to, kind, verb, transport, timing
  payloads[], explanation, citations[], confidence

payload
  name, format, importantFields[], meaning, citation

flow
  id, label, plainSummary, steps[]

flow step
  nodeId, optional edgeId, action, payload, citation

citation
  path, startLine, endLine, permalink, proves

term
  name, plainMeaning, inThisRepo, whyItMatters, citation
```

Use stable lowercase IDs. Node IDs and edge IDs must be unique. Every edge
endpoint and flow step must reference an existing ID. Keep `confidence` to
`observed`, `inferred`, or `unknown`; never invent numeric confidence scores.

A citation should prove the adjacent claim, not merely mention the same noun.
For GitHub, build an immutable URL in this form:

```text
https://github.com/<owner>/<repo>/blob/<commit>/<path>#L<start>-L<end>
```

Adapt the permalink format for another forge. Encode path segments and retain a
visible `path:start-end` label so the evidence remains useful when navigation is
sandboxed.

## Buildings and Zones

Choose a building from runtime behavior, not directory naming.

| Runtime role | Isometric building | What qualifies |
| --- | --- | --- |
| User or client | Low entry pavilion | Starts a verified request or command |
| Gateway, CLI, or API | Gatehouse or narrow tower | Parses input and routes control |
| Service or core engine | Multi-story workshop | Owns business or orchestration logic |
| Worker, job, or scheduler | Long workshop with roof vents | Runs work outside the request path |
| Queue or event broker | Depot with loading bays | Buffers or distributes verified messages |
| Database | Cylindrical vault | Persists structured source-of-truth data |
| Cache | Short stacked storehouse | Holds derived or expiring values |
| Object or file store | Silo or archive shed | Persists blobs, files, or artifacts |
| External service | Detached outpost | Receives or returns a verified external call |
| Build or deploy system | Crane, rail terminal, or launch platform | Produces or deploys the running artifact |

Use a small number of readable zones such as `entry`, `application`, `async`,
`state`, `external`, and `delivery`. Separate zones through grid placement and
subtle floor treatment, not a wall of labeled panels.

Height may indicate architectural centrality or runtime responsibility, but the
legend must say which. Never imply traffic, cost, or risk from size unless the
repository supplies that measurement.

Prefer 8-18 nodes. Group replicas and packages that share one deployment and
role. A monorepo folder is not automatically a service; a dependency in a lock
file is not automatically a runtime building.

## Relationships and Payloads

Pair color with line shape and a plain verb. Keep directional arrows visible.

| Kind | Visual treatment | Typical verbs | Evidence to seek |
| --- | --- | --- | --- |
| Control | Solid route with arrow | calls, invokes, routes, schedules | function calls, handlers, commands |
| Data | Dashed route with payload marker | reads, writes, returns, uploads | queries, schemas, serializers |
| Event | Dot-dash route with pulse marker | publishes, emits, consumes | producers, topics, handlers |
| Build | Thin double route | compiles, packages, generates | manifests, build scripts, CI |
| Deploy | Thin route with terminal marker | deploys, provisions, releases | IaC, workflows, platform config |

A dependency is meaningful only after naming what crosses it. Prefer labels
such as `POST /jobs · JobRequest`, `publishes · user.created`, or
`writes · Session row` over `uses API` or `depends on`.

For each payload, show only fields needed to understand routing, ownership, or
state change. State the format or transport when verified. Do not infer a wire
format from an in-memory type. If the body is dynamic, label the verified
envelope and say `dynamic body`.

Every visible edge needs a citation or an explicit `inferred` marker. Avoid
drawing framework-internal calls that do not change the reader's mental model.

Define two or more named flows when evidence supports them. Each flow should
read as a short causal story: trigger, routing, transformation, persistence or
external effect, and result. Do not animate every edge at once.

## Learner Explanations

Selecting a building should answer:

1. **What is this?** One sentence in everyday language.
2. **In this repository:** Its concrete responsibility and boundaries.
3. **What enters and leaves?** Named controls, data, events, or artifacts.
4. **Why it matters:** The architectural consequence, not generic praise.
5. **Terms:** Short definitions for unfamiliar words used here.
6. **Evidence:** File citations and what each one proves.

Selecting a connection should answer:

1. who initiates it and who receives it;
2. whether it is synchronous, asynchronous, build-time, or deploy-time;
3. the transport and payload;
4. the failure or retry boundary when verified;
5. why this boundary exists;
6. the supporting citations.

Define every acronym and specialized term that appears in a visible label or
explanation. Keep a term definition to one plain sentence, then add one
repository-specific sentence. Good teaching connects the abstraction to the
exact code without turning the panel into an encyclopedia.

Distinguish easily confused terms when the repository uses them, for example:
process versus service, queue versus topic, cache versus database, request
versus event, schema versus payload, build versus deploy, and control flow
versus data flow.

## Interface and Interaction

Use this compact composition:

```text
repository snapshot and flow picker
legend
isometric map             selected-item explainer
flow step controls        citations and terms
```

At narrow widths, stack the explainer below the map. Keep the map visible while
a learner changes flow steps; do not replace it with separate slides.

Maintain one selected item and one selected flow step. Selection should:

- emphasize the item and its adjacent paths;
- dim unrelated marks without making them disappear;
- update the explainer through an `aria-live="polite"` region;
- preserve the current pan and zoom;
- never depend on color alone.

Legend controls toggle relationship kinds with native buttons or checkboxes and
correct `aria-pressed` or checked state. When a kind is hidden, hide its payload
markers and remove its edges from pointer targeting too.

Expose map nodes and connections through native links or synchronized native
controls so keyboard users can reach every selection without custom tab order.
Provide visible labels for zoom in, zoom out, and reset view. Support pointer
drag and touch drag for pan. Prevent page scrolling only while a pointer gesture
is actively manipulating the map.

The flow picker names real journeys, not abstract layers. Previous and Next
advance one causal step, highlight the active node and edge, and update a short
step explanation. Disable the unavailable direction at each endpoint.

Citations should be visible links when the host permits navigation and always
include copyable `path:line-line` text. Do not hide evidence in tooltips.

## Isometric Rendering

Use one responsive SVG with a measured container and a matching `viewBox`.
Project a logical grid consistently; a simple two-to-one isometric basis is
enough. Draw in back-to-front order so routes, buildings, and labels occlude
predictably.

Give each building a roof, left face, right face, contact shadow, and a visible
name. Vary silhouettes by runtime role while retaining one material system.
Keep floors and shadows subtle so routes remain legible.

Route connections along grid corridors where practical. Lift crossings with a
small bridge or separate them through spacing; do not create an unreadable knot.
Place arrowheads before the destination facade rather than beneath it.

Animate only the selected flow's payload markers. Use position changes rather
than opacity-only motion, avoid loops when no flow is selected, and disable
motion under `prefers-reduced-motion`. The map must remain understandable when
all animation is off.

Use theme-aware colors and stable encodings. Large surfaces stay neutral;
relationship colors belong on paths and legend marks. Keep all visible text at
least 11 screen pixels.

## Accessibility and Trust Boundaries

Use semantic headings, buttons, selects, and links. Give the SVG a concise
accessible name and description. Preserve native focus indicators and tab
order. Pair every encoded color with shape, line pattern, or text.

Never inject repository strings with `innerHTML`. Build DOM text with
`textContent`. When embedding JSON in a script, serialize it and escape `<` as
`\u003c` so repository content cannot close the script element. Encode forge
URLs and reject non-HTTP citation schemes.

Do not embed source files, secrets, environment values, tokens, user data, or
unredacted example payloads. Field names and small synthetic example values are
enough to teach the boundary.

Keep repository data inline. No `fetch`, XHR, WebSocket, or runtime access to
the analyzed checkout is allowed. The saved map should remain inspectable after
the temporary clone disappears.

## Acceptance Checklist

Evidence:

- [ ] The snapshot identifies repository, branch, immutable commit, and time.
- [ ] Remote `main` still points to the analyzed SHA at final verification.
- [ ] Every major node and visible edge has supporting evidence or is marked inferred.
- [ ] Payload names, fields, transports, and timing are verified rather than guessed.
- [ ] Citations use exact file lines and immutable links when the forge supports them.

Model:

- [ ] IDs are unique; every edge endpoint and flow step resolves.
- [ ] Buildings represent runtime roles, not a dressed-up directory tree.
- [ ] At least one control flow and one data or event flow are complete end to end.
- [ ] Every visible technical term has a plain, repository-specific explanation.

Interface:

- [ ] Buildings have visibly different, legend-backed silhouettes.
- [ ] Selection updates the explainer, adjacency emphasis, terms, and citations.
- [ ] Legend filters update routes, markers, and pointer targets together.
- [ ] Flow Previous and Next visit every step in order.
- [ ] Pan, zoom, and reset work with pointer and labeled controls.
- [ ] Keyboard users can select every map item and operate every control.
- [ ] Reduced motion, narrow layouts, labels, and focus indicators work.
- [ ] The browser console is clean and the page makes no runtime network request.
