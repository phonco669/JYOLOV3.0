# Findings

## Issue 1: Home Page State Refresh
- **Observation**: User reports UI doesn't update after "success" toast.
- **Hypothesis**: `this.setData` is missing or `onShow` isn't triggered (which is expected for same-page actions), or the list isn't re-fetched.
- **File**: `pages/index/index.js`

## Issue 2: Calendar Data Logic
- **Observation**: Data seems unrelated to actual plan/results.
- **Hypothesis**: Might be using mock data or querying a different/incorrect table/API endpoint.
- **File**: `pages/calendar/index.js`, Backend `calendar`/`plan` routes.

## Issue 3: Statistics Data Consistency
- **Observation**: Stats don't update after Home page clock-in.
- **Hypothesis**: Stats might be calculated from a different source or cached? Or maybe the "clock-in" record isn't being saved correctly (though Home says success).
- **File**: `pages/statistics/index.js`, Backend `statistics` endpoints.

## Issue 4: Home Page UI Clutter
- **Observation**: Stock, Follow-up, Todo are on Home.
- **Requirement**: Move to "Reminders" tab.
- **Files**: `pages/index/index.wxml`, `pages/reminders/index.wxml`.
