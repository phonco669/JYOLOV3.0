# Findings

## Technical Decisions
- **Dosage Storage:** Stored as string in backend to support "1.5,1.75" alternate dosages (verified in previous session).
- **Plan vs Record:** 
    - `Plan`: The schedule (e.g., "Take Med A at 8:00 daily").
    - `Record`: The execution (e.g., "Took Med A at 8:05 on 2026-01-31").
- **Dashboard Logic:** Needs to combine `Plan` (what to take) and `Record` (what was taken) to show the daily status.

## Gaps Identified (PRD vs Implementation)
- **US-008 (Day/Week/Month View):** Currently only have a raw list. Need a proper schedule view.
- **US-002 (Guide):** Missing.
- **US-003 (Unified Reminders):** Only medication plans exist.

## User Feedback History
- **2026-01-31:** User requested Day View on Homepage (Dashboard).
