"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const database_1 = __importDefault(require("../src/config/database"));
const API_URL = 'http://localhost:3000/api';
const USER_ID = 1; // Assuming user 1 exists or we create one
function runVerification() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting US-003 Verification...");
        // 1. Setup Data
        console.log("Setting up test data...");
        yield new Promise((resolve, reject) => {
            database_1.default.serialize(() => {
                // Clear relevant tables
                database_1.default.run("DELETE FROM medications");
                database_1.default.run("DELETE FROM plans");
                database_1.default.run("DELETE FROM todos");
                database_1.default.run("DELETE FROM follow_ups");
                database_1.default.run("DELETE FROM records");
                // Insert Medication (Low Stock)
                database_1.default.run(`INSERT INTO medications (id, user_id, name, stock, unit, dosage, color) 
                    VALUES (1, ${USER_ID}, 'Test Med', 5, '片', '1.0', '#FF0000')`);
                // Insert Plan (08:00, 20:00)
                // We set times relative to now to ensure we get upcoming/missed
                const now = new Date();
                const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
                const past = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
                const futureTime = future.toTimeString().slice(0, 5);
                const pastTime = past.toTimeString().slice(0, 5);
                const times = `${pastTime},${futureTime}`;
                const today = now.toISOString().split('T')[0];
                database_1.default.run(`INSERT INTO plans (id, user_id, medication_id, time, frequency, start_date) 
                    VALUES (1, ${USER_ID}, 1, '${times}', 'daily', '${today}')`);
                // Insert Todo
                database_1.default.run(`INSERT INTO todos (id, user_id, title, status, due_date) 
                    VALUES (1, ${USER_ID}, 'Test Todo', 'pending', '${today} 10:00')`);
                // Insert FollowUp
                database_1.default.run(`INSERT INTO follow_ups (id, user_id, doctor, date, time, status) 
                    VALUES (1, ${USER_ID}, 'Dr. Who', '${today}', '09:00', 'pending')`, () => {
                    resolve();
                });
            });
        });
        // 2. Fetch Reminders
        console.log("Fetching reminders...");
        try {
            const res = yield axios_1.default.get(`${API_URL}/reminders`, {
                headers: { 'x-user-id': USER_ID }
            });
            const reminders = res.data;
            console.log(`Got ${reminders.length} reminders.`);
            // Verification Checks
            const types = reminders.map((r) => r.type);
            console.log("Reminder Types:", types);
            const hasStock = types.includes('stock_low');
            const hasTodo = types.includes('todo');
            const hasFollowUp = types.includes('follow_up');
            const hasMissed = types.includes('medication_missed'); // Past time
            const hasUpcoming = types.includes('medication_upcoming'); // Future time
            if (hasStock && hasTodo && hasFollowUp && hasMissed && hasUpcoming) {
                console.log("✅ AC1, AC2, AC3 Passed: All reminder types present.");
            }
            else {
                console.error("❌ Failed AC1/AC2/AC3. Missing types.");
                console.log({ hasStock, hasTodo, hasFollowUp, hasMissed, hasUpcoming });
            }
            // 3. Mark Medication as Done
            console.log("Marking missed medication as done...");
            const missedRem = reminders.find((r) => r.type === 'medication_missed');
            if (missedRem) {
                yield axios_1.default.post(`${API_URL}/records`, {
                    medication_id: missedRem.medication_id,
                    plan_id: missedRem.plan_id,
                    taken_at: new Date().toISOString(),
                    status: 'taken',
                    dosage_taken: 1.0
                }, { headers: { 'x-user-id': USER_ID } });
                // 4. Verify it's gone
                const res2 = yield axios_1.default.get(`${API_URL}/reminders`, {
                    headers: { 'x-user-id': USER_ID }
                });
                const reminders2 = res2.data;
                const stillHasMissed = reminders2.some((r) => r.id === missedRem.id);
                if (!stillHasMissed) {
                    console.log("✅ AC4 Passed: Medication reminder removed after completion.");
                }
                else {
                    console.error("❌ Failed AC4: Reminder still present after completion.");
                }
            }
            console.log("<promise>DONE</promise>");
        }
        catch (error) {
            console.error("Verification failed:", error);
        }
    });
}
runVerification();
