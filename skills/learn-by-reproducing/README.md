# Learn by Reproducing

<p align="center">
  <a href="SKILL.md"><img src="../../assets/skill-banners/learn-by-reproducing.webp" alt="learn-by-reproducing — learn ML by understanding and testing a paper's decisions" width="100%"></a>
</p>

Turn an ML paper into a project that teaches you why the method works, which decisions matter, and what you can use its outputs for. Keep concepts, derivations, implementation steps, experiments, and readiness checks in **one integrated reproduction note**.

## Use it

After adding this skill to your checkout, install it into a project with:

```bash
node /path/to/builder-essential-skills/bin/builder-essential-skills.js --skill learn-by-reproducing --project
```

After the updated collection is published, the npm installer can install the same skill:

```bash
npx @tamng0905/builder-essential-skills --skill learn-by-reproducing --project
```

Restart your agent, then invoke:

```text
Use $learn-by-reproducing with this ML paper: [paper URL].
I know Python and basic ML. Update my reproduction README so it teaches
the critical decisions, gives controlled experiments, and explains the
practical use and limits of the outputs. Keep it all in the same note.
```

For the worked example:

```text
Use $learn-by-reproducing for https://ar5iv.labs.arxiv.org/html/1802.07127.
Help me learn ML through VAEP and build recent-player ratings. Check which
datasets have the event detail and dates this needs, and distinguish an
adaptation from an exact reproduction.
```

## What you get

- A source-grounded explanation of the target, objective, representation, model, evaluation, and output units.
- Original-paper choices, released-code behavior, proposed adaptations, and unknowns labeled separately.
- A hand-worked example and small verified pipeline before larger experiments.
- Controlled baselines, ablations, failure analysis, and readiness gates.
- A useful capstone with traceable evidence and a record of what you actually demonstrated.

For narrow questions, the skill answers directly and updates the same note. Asking for a guide does not imply that model training has run. Unavailable original data is treated as a constraint, not hidden behind plausible rankings.

Read the [workflow](SKILL.md), [learning-project reference](references/learning-project.md), or [VAEP example](references/vaep-example.md). The example's settings are not defaults for other papers. The deterministic [SVG card](../../assets/skill-cards/learn-by-reproducing.svg) accompanies the banner.
