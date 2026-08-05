# Naming Clearance Reference

Use this reference for preliminary brand screening and live domain verification. It creates decision-grade evidence, not a legal opinion.

Validate only the serious shortlist, normally three to five names. Batch compatible searches, put evidence beside the claim it supports, and stop when the decision has enough evidence. Do not research a raw creative pool.

## Keep availability surfaces separate

1. **Domain registration:** whether a registrar currently offers the exact domain.
2. **Trademark risk:** whether earlier marks may create confusion for related goods, services, or markets.
3. **Business-entity name:** whether a jurisdiction permits the legal entity name.
4. **Social or marketplace handle:** whether a platform identifier can be claimed.
5. **Technical namespace:** whether repositories, package registries, commands, protocols, app stores, or other identifiers conflict.

Passing one says nothing conclusive about the others. Report each separately.

## Domain evidence levels

Use these exact concepts:

- **Registered:** authoritative RDAP returns a domain object or a registrar says the domain is taken.
- **No registry record:** authoritative RDAP returns a not-found response. This is a useful signal, not proof that the domain is purchasable; it may be reserved, premium, restricted, blocked, or unsupported.
- **Verified available at check time:** no registry record plus a reputable registrar's live transactional search explicitly offers the exact domain for registration.
- **Premium or brokered:** available only at a special acquisition price or from an existing owner. Do not call this ordinarily available.
- **Unknown:** rate limit, inconsistent sources, unsupported TLD, registrar block, ambiguous response, or missing live confirmation.

Never use an empty website, NXDOMAIN, a failed HTTP request, search-engine absence, or a WHOIS privacy response as availability proof.

## Precise status language

Use the narrowest state the evidence supports:

- **Active company or product found:** current first-party or authoritative evidence shows use.
- **Registered:** a registry record exists; do not infer whether the owner actively uses it.
- **Listed for sale, premium, or brokered:** acquisition may be possible at a special price; do not call it ordinarily available.
- **No obvious indexed use found:** the searches run found no clear use; this is not availability.
- **Verified available at check time:** use only for a domain that passed the registry-plus-registrar gate.
- **Not verified:** a relevant source was unavailable, blocked, ambiguous, or not searched.

Do not collapse one surface into another. An unused package name says nothing about the domain, trademark, company, or repository organization.

## Domain verification procedure

1. Normalize the candidate to its exact ASCII/IDNA domain and inspect homograph risk.
2. Query authoritative RDAP with `scripts/check_domains.py`. Preserve its evidence URL and UTC timestamp.
3. Open a reputable registrar's current search or registration screen. Confirm the exact spelling and TLD, whether it is standard or premium, the initial price, and the renewal price when shown.
4. Resolve disagreements. A positive registration record overrides a registrar's optimistic search result. When RDAP is unavailable, require two independent registrar confirmations and label the registry gap.
5. Capture a direct link or concise evidence note and the local ISO 8601 check time.
6. Remind the user that the check does not reserve the domain. Recommend registration before public announcement, but never purchase without permission.

Query only the serious shortlist when confidentiality matters. Domain and registrar lookups reveal the queried strings to external services.

## Search and market collision screen

Search the exact quoted name and close variants with:

- the category and adjacent categories;
- `company`, `brand`, `app`, `product`, or the relevant business noun;
- launch countries, cities, or languages;
- live landing pages, app stores, major marketplaces, industry directories, and social platforms when relevant;
- GitHub and relevant package ecosystems such as npm, PyPI, crates.io, container registries, plugins, or extensions for technical products.

Look beyond exact matches. A dominant unrelated result can make a name expensive to own in search; a smaller but category-adjacent result can create genuine confusion. Record the query, strongest collision, source, and judgment.

For a technical name, distinguish:

- an exact namespace collision;
- an inactive or abandoned artifact;
- a close spelling that will cause install or import mistakes;
- a project whose audience or category creates affiliation risk;
- a free identifier on one surface while the surrounding brand is already occupied.

Never treat an open-source code license as permission to reuse the project's trademark, name, logo, or identity. License rights and naming rights are separate. If the proposed name could imply an official fork, extension, compatibility layer, or successor, verify the source project's trademark and naming guidance or label the relationship unresolved.

## Preliminary trademark screen

Search official trademark-office databases for every launch jurisdiction that matters. Include:

- exact spelling;
- plural, spacing, and punctuation variants;
- phonetic equivalents and likely misspellings;
- similar-looking coined words;
- translated or transliterated equivalents when relevant;
- related goods and services, not only identical category labels;
- live and recently abandoned or cancelled records when they illuminate risk.

Start with the user's national or regional trademark office and use an international database for broader visibility. Trademark classes organize the search but do not determine confusion by themselves.

Use cautious result language:

- **No obvious conflict found in this preliminary search** — include jurisdiction, categories, query scope, date, and links.
- **Potential conflict requiring counsel** — identify the similar mark, owner if publicly listed, goods or services, status, and why it may matter.
- **Not screened** — state what is missing and do not recommend launch.

Never say “trademark available,” “legally safe,” or “cleared” unless a qualified professional with authority supplied that conclusion and the user provided it as evidence.

## Language and cultural screen

For each launch language:

- test intended pronunciation and the most likely alternative pronunciations;
- search ordinary dictionaries, slang references, and exact quoted results;
- check transliteration, morphology, gender, and unwanted sound-alikes;
- consider dialect and regional differences;
- ask a qualified native speaker to review high-stakes finalists in context.

Automated translation is a first pass. Do not overrule a native speaker or claim cultural safety from a dictionary search.

## Evidence log

Keep one row per finalist:

| Field | Required evidence |
| --- | --- |
| Candidate and pronunciation | exact spelling plus pronunciation guide |
| Exact domain | full domain, no shorthand |
| Registry signal | status, RDAP evidence URL, UTC timestamp |
| Registrar confirmation | registrar, offered/taken/premium status, prices shown, local timestamp, link or evidence note |
| Search collision | strongest relevant result and query |
| Trademark screen | jurisdiction, database, queries, relevant classes or goods/services, result, date |
| Language screen | languages checked, sources or reviewers, unresolved concerns |
| Entity, handle, marketplace checks | only when relevant, clearly separated |
| Technical namespace checks | repositories, packages, commands, protocols, or app stores relevant to the product |
| Source affiliation | official relationship, independent inspiration, or unresolved risk |
| Decision | pass, reject, or needs expert review, with one reason |

Clearance evidence ages quickly. Put the check time beside the claim instead of burying it in a footnote.
