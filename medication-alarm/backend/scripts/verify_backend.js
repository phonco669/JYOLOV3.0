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
const http_1 = __importDefault(require("http"));
const request = (method, path, body) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': '1'
            }
        };
        const req = http_1.default.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                }
                catch (e) {
                    console.error('Error parsing JSON:', data);
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', (e) => {
            reject(e);
        });
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};
const runTests = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('--- 1. List Medications ---');
        const medsRes = yield request('GET', '/medications');
        console.log('Status:', medsRes.status);
        console.log('Meds:', medsRes.data);
        if (medsRes.data.length === 0) {
            console.log('No medications found. Skipping Plan/Record creation.');
            return;
        }
        const medId = medsRes.data[0].id;
        console.log('\n--- 2. Create Plan ---');
        const planRes = yield request('POST', '/plans', {
            medication_id: medId,
            time: "08:00",
            frequency: "daily",
            start_date: "2026-01-31",
            end_date: "2026-12-31"
        });
        console.log('Status:', planRes.status);
        console.log('Plan:', planRes.data);
        console.log('\n--- 3. List Plans ---');
        const plansRes = yield request('GET', '/plans');
        console.log('Status:', plansRes.status);
        console.log('Plans:', plansRes.data);
        console.log('\n--- 4. Create Record ---');
        const recordRes = yield request('POST', '/records', {
            medication_id: medId,
            plan_id: planRes.data.id,
            taken_at: new Date().toISOString(),
            status: "taken",
            dosage_taken: 1.0
        });
        console.log('Status:', recordRes.status);
        console.log('Record:', recordRes.data);
        // 6. Get Daily Schedule
        console.log('\n6. Fetching Daily Schedule...');
        const today = new Date().toISOString().split('T')[0];
        const scheduleRes = yield request('GET', `/plans/daily?date=${today}`);
        console.log('Daily Schedule:', JSON.stringify(scheduleRes.data, null, 2));
        // 7. Get Monthly Status
        console.log('\n7. Fetching Monthly Status...');
        // Use current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const monthlyRes = yield request('GET', `/plans/monthly?start=${startOfMonth}&end=${endOfMonth}`);
        console.log('Monthly Status (Partial):', JSON.stringify(monthlyRes.data, null, 2));
        // 8. Todos
        console.log('\n8. Creating Todo...');
        const todoData = {
            title: '购买维生素',
            description: '维生素C和D',
            due_date: '2026-02-01',
            type: 'custom'
        };
        const createTodoRes = yield request('POST', '/todos', todoData);
        console.log('Create Todo Status:', createTodoRes.status);
        console.log('\n9. Fetching Reminders...');
        const remindersRes = yield request('GET', '/reminders');
        console.log('Reminders:', JSON.stringify(remindersRes.data, null, 2));
        // 10. Undo Take
        console.log('\n10. Deleting Record (Undo Take)...');
        const delRes = yield request('DELETE', `/records/${recordRes.data.id}`);
        console.log('Delete Status:', delRes.status);
        console.log('Verifying Schedule Reversion...');
        const scheduleRes2 = yield request('GET', `/plans/daily?date=${today}`);
        const item2 = scheduleRes2.data.find((i) => i.plan_id === planRes.data.id);
        if (item2 && item2.status === 'pending') {
            console.log('✅ Schedule reverted to pending.');
        }
        else {
            console.error('❌ Schedule failed to revert', item2);
        }
    }
    catch (error) {
        console.error('Test failed:', error);
    }
});
runTests();
