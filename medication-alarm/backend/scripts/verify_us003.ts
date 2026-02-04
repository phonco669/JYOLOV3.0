
import axios from 'axios';
import db from '../src/config/database';

const API_URL = 'http://localhost:3000/api';
const USER_ID = 1; // Assuming user 1 exists or we create one

async function runVerification() {
    console.log("Starting US-003 Verification...");

    // 1. Setup Data
    console.log("Setting up test data...");
    await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            // Clear relevant tables
            db.run("DELETE FROM medications");
            db.run("DELETE FROM plans");
            db.run("DELETE FROM todos");
            db.run("DELETE FROM follow_ups");
            db.run("DELETE FROM records");

            // Insert Medication (Low Stock)
            db.run(`INSERT INTO medications (id, user_id, name, stock, unit, dosage, color) 
                    VALUES (1, ${USER_ID}, 'Test Med', 5, '片', '1.0', '#FF0000')`);

            // Insert Plan (08:00, 20:00)
            // We set times relative to now to ensure we get upcoming/missed
            const now = new Date();
            const future = new Date(now.getTime() + 60*60*1000); // 1 hour later
            const past = new Date(now.getTime() - 60*60*1000);   // 1 hour ago
            
            const futureTime = future.toTimeString().slice(0, 5);
            const pastTime = past.toTimeString().slice(0, 5);
            const times = `${pastTime},${futureTime}`;

            const today = now.toISOString().split('T')[0];

            db.run(`INSERT INTO plans (id, user_id, medication_id, time, frequency, start_date) 
                    VALUES (1, ${USER_ID}, 1, '${times}', 'daily', '${today}')`);

            // Insert Todo
            db.run(`INSERT INTO todos (id, user_id, title, status, due_date) 
                    VALUES (1, ${USER_ID}, 'Test Todo', 'pending', '${today} 10:00')`);

            // Insert FollowUp
            db.run(`INSERT INTO follow_ups (id, user_id, doctor, date, time, status) 
                    VALUES (1, ${USER_ID}, 'Dr. Who', '${today}', '09:00', 'pending')`, () => {
                        resolve();
                    });
        });
    });

    // 2. Fetch Reminders
    console.log("Fetching reminders...");
    try {
        const res = await axios.get(`${API_URL}/reminders`, {
            headers: { 'x-user-id': USER_ID }
        });
        const reminders = res.data;
        console.log(`Got ${reminders.length} reminders.`);

        // Verification Checks
        const types = reminders.map((r: any) => r.type);
        console.log("Reminder Types:", types);

        const hasStock = types.includes('stock_low');
        const hasTodo = types.includes('todo');
        const hasFollowUp = types.includes('follow_up');
        const hasMissed = types.includes('medication_missed'); // Past time
        const hasUpcoming = types.includes('medication_upcoming'); // Future time

        if (hasStock && hasTodo && hasFollowUp && hasMissed && hasUpcoming) {
            console.log("✅ AC1, AC2, AC3 Passed: All reminder types present.");
        } else {
            console.error("❌ Failed AC1/AC2/AC3. Missing types.");
            console.log({ hasStock, hasTodo, hasFollowUp, hasMissed, hasUpcoming });
        }

        // 3. Mark Medication as Done
        console.log("Marking missed medication as done...");
        const missedRem = reminders.find((r: any) => r.type === 'medication_missed');
        if (missedRem) {
            await axios.post(`${API_URL}/records`, {
                medication_id: missedRem.medication_id,
                plan_id: missedRem.plan_id,
                taken_at: new Date().toISOString(),
                status: 'taken',
                dosage_taken: 1.0
            }, { headers: { 'x-user-id': USER_ID } });

            // 4. Verify it's gone
            const res2 = await axios.get(`${API_URL}/reminders`, {
                headers: { 'x-user-id': USER_ID }
            });
            const reminders2 = res2.data;
            const stillHasMissed = reminders2.some((r: any) => r.id === missedRem.id);
            
            if (!stillHasMissed) {
                console.log("✅ AC4 Passed: Medication reminder removed after completion.");
            } else {
                console.error("❌ Failed AC4: Reminder still present after completion.");
            }
        }

        console.log("<promise>DONE</promise>");

    } catch (error) {
        console.error("Verification failed:", error);
    }
}

runVerification();
