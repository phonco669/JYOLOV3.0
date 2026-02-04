# Task Plan: Medication Alarm Real-Device Issues Fix

## Goal
Resolve 4 issues reported by the user during real-device testing of the WeChat Mini Program.

## User Issues
1.  **Home Page State**: "Clock-in"/"Taken" success doesn't update UI immediately; requires page switch.
2.  **Calendar Data**: Medication details in Calendar are unrelated to plan/results (data logic issue).
3.  **Statistics Data**: "Clock-in" on Home doesn't update Statistics (suspect Statistics uses Calendar's incorrect logic).
4.  **Home Page UI**: "Stock Warning", "Follow-up", "Todo" should be in "Reminders" tab, not Home.

## Phases

### Phase 1: Investigation & Reproduction 
- [ ] **Issue 1 (Home Refresh)**: Analyze `pages/index/index.js` for state update logic after "taken" action.
- [ ] **Issue 2 (Calendar Logic)**: Analyze `pages/calendar/index.js` and backend routes to understand current data source and identify why it's "unrelated".
- [ ] **Issue 3 (Statistics Logic)**: Analyze `pages/statistics/index.js` and backend `statisticsRoutes.ts`/`statisticsController.ts` to see how stats are calculated and if they query the correct `records` table.
- [ ] **Issue 4 (UI Layout)**: Identify components in `pages/index/index.wxml` and `pages/reminders/index.wxml` for migration.

### Phase 2: Fix Plan Formulation
- [ ] Document root causes for each issue in `findings.md`.
- [ ] Propose specific code changes for each issue.
- [ ] **Checkpoint**: Present plan to user for confirmation (as requested).

### Phase 3: Implementation (After Confirmation)
- [ ] **Fix Issue 1**: Implement immediate local state update or re-fetch on Home page.
- [ ] **Fix Issue 4**: Move UI components from Home to Reminders tab.
- [ ] **Fix Issue 2**: Correct Calendar data fetching logic to align with `plans` and `records`.
- [ ] **Fix Issue 3**: Correct Statistics data aggregation logic.

### Phase 4: Verification
- [ ] Verify Home page refresh.
- [ ] Verify Calendar data accuracy.
- [ ] Verify Statistics updates after clock-in.
- [ ] Verify UI layout changes.

## Current Status
- Status: **Planning**
- Current Phase: **Phase 1: Investigation**
