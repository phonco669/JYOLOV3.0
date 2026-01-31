# Personal Medication Alarm Implementation Plan

> **For Trae:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Personal Medication Alarm WeChat Mini Program with a Node.js backend.

**Architecture:** Monorepo with `backend` (Node/Express/TS) and `frontend` (WeChat Mini Program).

**Tech Stack:** Node.js, TypeScript, Express, PostgreSQL, WeChat Mini Program (Native).

---

### Task 1: Project Scaffolding

**Files:**
- Create: `medication-alarm/backend/package.json`
- Create: `medication-alarm/backend/tsconfig.json`
- Create: `medication-alarm/backend/src/app.ts`
- Create: `medication-alarm/frontend/app.json`

**Step 1: Create Directories**
Create `medication-alarm`, `medication-alarm/backend`, `medication-alarm/frontend`.

**Step 2: Initialize Backend**
Initialize `package.json` with `express`, `typescript`, `ts-node`.
Configure `tsconfig.json`.

**Step 3: Basic Server**
Create `src/app.ts` with a basic "Hello World" endpoint.

**Step 4: Verify**
Run the server and check the endpoint.

### Task 2: Backend - Database Setup & Users

**Files:**
- Create: `medication-alarm/backend/src/config/database.ts`
- Create: `medication-alarm/backend/src/models/User.ts`
- Create: `medication-alarm/backend/src/controllers/authController.ts`
- Create: `medication-alarm/backend/src/routes/authRoutes.ts`

**Step 1: Database Config**
Setup SQLite/Postgres connection (using SQLite for local dev simplicity initially, or mock if needed).

**Step 2: User Model**
Define User schema (`id`, `openid`).

**Step 3: Auth Endpoint**
Implement `POST /api/auth/login` (Mock WeChat login for now: accepts `code`, returns `token`).

**Step 4: Verify**
Test login endpoint.

### Task 3: Backend - Medications CRUD

**Files:**
- Create: `medication-alarm/backend/src/models/Medication.ts`
- Create: `medication-alarm/backend/src/controllers/medicationController.ts`
- Create: `medication-alarm/backend/src/routes/medicationRoutes.ts`

**Step 1: Medication Model**
Define Medication schema (`name`, `dosage`, `color`, etc.).

**Step 2: CRUD Endpoints**
Implement GET, POST, PUT, DELETE for medications.

**Step 3: Verify**
Test adding and listing medications.

### Task 4: Backend - Plans & Records

**Files:**
- Create: `medication-alarm/backend/src/models/Plan.ts`
- Create: `medication-alarm/backend/src/models/Record.ts`
- Create: `medication-alarm/backend/src/controllers/planController.ts`

**Step 1: Models**
Define Plan and Record schemas.

**Step 2: Endpoints**
Implement endpoints to create plans and record usage.

**Step 3: Verify**
Test creating a plan and recording a dose.

### Task 5: Frontend - Setup & Auth

**Files:**
- Create: `medication-alarm/frontend/app.js`
- Create: `medication-alarm/frontend/pages/index/index.wxml`

**Step 1: Basic App**
Create `app.js` and main page.

**Step 2: Auth Logic**
Implement `wx.login` flow (mocked if running in non-WeChat env).

**Step 3: Verify**
Check if app launches.

### Task 6: Frontend - Medication Management

**Files:**
- Create: `medication-alarm/frontend/pages/medications/list.wxml`
- Create: `medication-alarm/frontend/pages/medications/add.wxml`

**Step 1: List Page**
Display list of medications.

**Step 2: Add Page**
Form to add medication (Name, Dosage, Color).

**Step 3: Verify**
Simulate adding a medication.
