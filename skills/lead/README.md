# Lead

<p align="center">
  <a href="SKILL.md"><img src="../../assets/skill-banners/lead.webp" alt="lead — build and delivery skill" width="100%"></a>
</p>

Run a provider-neutral autonomous build factory. The Lead makes decisions and
uses the current runtime's native subagents for every repository read, write,
command, implementation, review, and integration, finishing with one pull
request without writing code itself.

## Install

Install this skill for your user account:

```bash
npx @tamng0905/builder-essential-skills --skill lead
```

Install it into the current repository instead:

```bash
npx @tamng0905/builder-essential-skills --skill lead --project
```

Restart your agent runtime, then invoke `/lead` or ask for an autonomous build
run. Native subagent delegation is required; no provider/model config is needed.

See the full workflow in [SKILL.md](SKILL.md).
