# Monetize

> Inspired by the "Monetize" chapter of Pieter Levels' *MAKE: The Indie Maker Blueprint*. This is an original checklist/diagnostic built around that chapter's core ideas — for the full chapter, worked examples, and author's voice, [buy the book](https://readmake.com).

## Core principles

- **Monetization is the clearest validation signal you'll get.** Free usage proves people will try something at zero cost; voluntary payment proves it's actually worth solving.
- **A side project without revenue stays a hobby.** Revenue is what turns something into a business you can justify investing more time and money into, and eventually hire around.
- **Charging money will generate some pushback — that's fine.** People who think everything should be free are not your customers. Paying customers are your real market; weight their feedback accordingly.
- **Pricing early, even modestly, sharpens the product.** Needing to justify a price forces clearer priorities than building indefinitely toward some future "ready" moment.
- **Expect only a small fraction of free users to convert to paid.** Size your audience-building goals against a realistic conversion rate, not an optimistic one, when figuring out how many users you actually need for a viable business.

## Common business models to consider

- **Freemium / feature-gating** — free core product, pay to unlock specific premium features
- **Usage- or feature-based pricing** — pay per specific feature or action rather than one flat tier
- **Advertising** — ideally native/relevant ads matched to your specific audience rather than generic programmatic ads, which tend to pay far less and feel more intrusive
- **Sponsorship** — a company pays a flat recurring amount to be associated with your product, in exchange for visibility to your audience
- **Patronage** — the product stays free; a portion of your audience voluntarily supports ongoing development
- **Subscription** — a recurring fee in exchange for continued access and maintenance; the most durable model over time because it compounds rather than resetting each sale (see the math below)
- **Community access** — the content or tool stays free, but access to a community of other users (chat, forum, events) built around it is paid, because people increasingly pay for connection more than for content alone
- **Marketplace / job-board style** — free for one side of the market (e.g. individuals), paid for the other side (e.g. businesses), which often has meaningfully higher willingness to pay
- **Productized service** — start by solving a specific problem for individual clients, notice the same problem recurring, and package the repeatable solution as a standalone paid product

### Why recurring revenue compounds

A one-time payment gets you one payment per customer, period. A subscription at a similar effective price gets you that payment repeated for as long as the customer stays — which, even accounting for some churn, tends to produce meaningfully more revenue over a multi-year horizon once you factor in any ongoing growth in customers. If you're choosing between a one-time price and a subscription for a similar product, model both scenarios out three to five years, including a realistic churn rate, before deciding.

## Payment infrastructure

- Use an established payment processor with strong developer tooling — it will save you significant integration time and handle subscription proration, tokenization, and compliance for you rather than you having to build it.
- Consider offering more than one payment method (card and a regional-preferred alternative) if your audience is international — different regions have meaningfully different comfort levels with credit cards versus bank transfers versus other local payment habits, and offering the right option for your audience can measurably lift conversion.

## Handling refunds

Refund quickly and without a fight when someone asks, and use the moment to ask what didn't meet their expectations — it's some of the most honest product feedback you'll get. Fighting a refund request risks the customer disputing the charge with their bank instead, which typically costs more (a dispute fee, plus the refunded amount, plus a mark against your standing with your payment processor) than just refunding proactively would have.

## Bookkeeping

Once revenue is meaningful, get a real accountant who's comfortable with the specifics of running an online subscription/product business (payment processor exports, multi-country tax, high transaction volume). Automate your own record-keeping as much as possible (e.g. an automatic export from your payment processor into a spreadsheet) and keep the number of income/expense sources small and consistent — it makes both ongoing bookkeeping and any future due diligence (see exit.md) far easier.

## Validate pricing before you build a full payment flow

Put a real "buy" step in front of users as early as possible — even a simple checkout test that clearly explains nothing will actually be charged yet — to see how many people get far enough to reach for a payment method. That's a far more honest signal of real purchase intent than an email signup count, because it captures people who got close enough to actually try to pay.

## Diagnostic questions to work through

1. Have you put a real "pay" step in front of users yet, even before the product feels finished?
2. Which model above fits how your users get value — a feature they'd pay to unlock, a connection to other people, a recurring need, or a one-time transaction?
3. Would a subscription make more sense than a one-time charge here — have you modeled a few years of each?
4. Do you have a refund process ready before launch, or will the first request be improvised?
5. What conversion rate are you assuming from free to paid, and does your realistic audience size actually support a viable revenue number at that rate?

## A week of practice (optional homework)

Pick one pricing model from the list above and implement it this week, even in a rough form. See whether you get any real payments within a few days. If the model clearly isn't working, drop it and try a different one rather than continuing to tweak a model that fundamentally doesn't fit.
