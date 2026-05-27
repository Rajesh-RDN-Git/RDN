# Incident Post-Mortem

**Status:** Draft / Under review / Final
**Incident ID:** INC-YYYY-MM-DD-XX
**Severity:** SEV1 / SEV2 / SEV3
**Date:** YYYY-MM-DD
**Author:** [name]
**Reviewers:** [list]

## TL;DR

[2–3 sentences. What happened, who was affected, what we did, what's next.]

## Impact

- **Users affected:** [number, %]
- **Duration:** [HH:MM]
- **Data integrity:** [intact / degraded / lost]
- **Revenue impact (INR):** [estimate]
- **DPB filing required:** [Y/N — link to filing]
- **DPDP retention obligations changed:** [Y/N]

## Timeline (all times UTC)

| Time  | Event                                                 | Actor  |
| ----- | ----------------------------------------------------- | ------ |
| HH:MM | First signal — [Sentry alert / user report / monitor] | [name] |
| HH:MM | IC declared                                           | [name] |
| HH:MM | Containment action: [X]                               | [name] |
| HH:MM | Public/user comms sent                                | [name] |
| HH:MM | Service restored                                      | [name] |
| HH:MM | All-clear                                             | [name] |

## Root cause

### What broke

[Technical explanation. File paths, code snippets, queries.]

### Why now

[Was this a latent bug, recent change, infrastructure event, third-party? Reference commit/deploy.]

### Why our defences didn't catch it

[CI, tests, monitors, runbooks — gap analysis]

## Five-whys

1. Why did X happen? → [...]
2. Why? → [...]
3. Why? → [...]
4. Why? → [...]
5. Why? → [root cause]

## What went well

- [list]

## What went poorly

- [list]

## What was lucky

- [list]

## Action items

| #   | Action                                | Owner | Due        | Status                    | Link       |
| --- | ------------------------------------- | ----- | ---------- | ------------------------- | ---------- |
| 1   | [e.g., add alert on metric X]         | @user | YYYY-MM-DD | Open / In progress / Done | [PR/issue] |
| 2   | [e.g., write Maestro test for flow Y] | @user | YYYY-MM-DD | Open                      | [link]     |
| 3   | [e.g., update runbook]                | @user | YYYY-MM-DD | Open                      | [link]     |

> Rule: every action item must have an owner, a due date, and a tracking link. No "to be discussed" items.

## Lessons for future

[2–3 paragraphs. What patterns should other teams watch for? What design choices should we revisit?]

## Related links

- Incident channel: [Slack #inc-YYYY-MM-DD-X]
- DPB filing: [link]
- User notifications: [link]
- Sentry: [link]
- Code changes: [PR links]
