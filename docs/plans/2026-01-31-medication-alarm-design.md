# Personal Medication Alarm - Design Document

## 1. Overview
A WeChat Mini Program to help users manage medication schedules, with features for personalized reminders, flexible dosages (decimals), and medication inventory.

## 2. Architecture

### System Context
- **Frontend**: WeChat Mini Program (Native)
- **Backend**: Node.js RESTful API
- **Database**: PostgreSQL (with Redis for caching if needed)
- **Authentication**: WeChat Login (OpenID)

### Directory Structure
```
medication-alarm/
  ├── backend/          # Node.js + Express + TypeScript
  │   ├── src/
  │   │   ├── controllers/
  │   │   ├── models/
  │   │   ├── routes/
  │   │   ├── services/
  │   │   └── app.ts
  │   ├── tests/
  │   └── package.json
  └── frontend/         # WeChat Mini Program (Native)
      ├── pages/
      ├── components/
      ├── utils/
      └── app.json
```

## 3. Data Model

### Users
- `id` (PK)
- `openid` (WeChat OpenID, Unique)
- `created_at`

### Medications
- `id` (PK)
- `user_id` (FK -> Users)
- `name` (String)
- `dosage` (Decimal, e.g., 1.5)
- `unit` (String, e.g., "片")
- `color` (String, e.g., "blue")
- `stock` (Decimal)
- `created_at`

### Plans (Medication Schedules)
- `id` (PK)
- `user_id` (FK -> Users)
- `medication_id` (FK -> Medications)
- `time` (Time)
- `frequency` (String, e.g., "daily")
- `start_date`
- `end_date`

### Records (Medication History)
- `id` (PK)
- `user_id` (FK -> Users)
- `medication_id` (FK -> Medications)
- `taken_at` (Timestamp)
- `status` (Enum: taken, skipped)
- `dosage_taken` (Decimal)

### Reminders
- `id` (PK)
- `user_id` (FK -> Users)
- `type` (Enum: medication, stock, followup, todo)
- `title`
- `scheduled_time`
- `status`

## 4. API Design (Key Endpoints)

- `POST /api/auth/login` (WeChat Login)
- `GET /api/medications`
- `POST /api/medications`
- `GET /api/plans`
- `POST /api/plans`
- `GET /api/records`
- `POST /api/records` (Mark as taken)
- `GET /api/reminders`

## 5. UI/UX Strategy
- **Spotlight Guide**: Overlay for first-time users.
- **Color Coding**: Consistent color usage for medications across lists, calendars, and stats.
- **Decimal Display**: Ensure all numbers are formatted as decimals (e.g., "1.5").

## 6. Implementation Strategy
- **Phase 1**: Backend Setup & Auth
- **Phase 2**: Medication Management (CRUD + Colors)
- **Phase 3**: Plan & Reminder System
- **Phase 4**: Frontend Implementation (Basic Pages)
- **Phase 5**: Advanced Features (Stats, Inventory, Guide)
