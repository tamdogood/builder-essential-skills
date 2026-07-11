# Async Learning Teacher

A portable agent skill for turning saved links, papers, articles, posts, videos, and reference collections into approachable teaching artifacts for later study.

## What It Does

Async Learning Teacher helps you queue interesting resources now and learn from them later. Instead of saving raw links that are hard to restart from, the agent converts them into readable explanations, study notes, or interactive tutoring checkpoints.

It supports two learning modes:

## Quick Teaching

Use this for a single link, paper, blog post, tweet thread, video, or small source set.

The agent creates a complete teaching artifact in one pass:

- Why the resource matters
- Prerequisites
- Step-by-step chapter-style explanation
- Subtle points and examples
- What to remember
- Follow-up questions
- Validation gaps

Example prompt:

```text
Use $async-learning-teacher to teach me this paper:
https://arxiv.org/abs/...
