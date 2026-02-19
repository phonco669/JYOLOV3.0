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
        console.log('Starting Reminders Aggregation Verification...');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toTimeString().substring(0, 5);
        // 1. Create Medication with Low Stock (<= 10)
        const medRes = yield request('POST', '/medications', {
            name: 'Low Stock Med',
            dosage: '1',
            unit: 'pill',
            stock: 5,
            color: '#FF0000'
        });
        const medId = medRes.data.id;
        console.log('Created Low Stock Med:', medId);
        // 2. Create Plan for Upcoming (Time > Now)
        yield request('POST', '/plans', {
            medication_id: medId,
            time: oneHourLater,
            frequency: "daily",
            start_date: today,
            end_date: "2099-12-31"
        });
        console.log(`Created Upcoming Plan at ${oneHourLater}`);
        // 3. Create Plan for Missed (Time < Now)
        yield request('POST', '/plans', {
            medication_id: medId,
            time: oneHourAgo,
            frequency: "daily",
            start_date: today,
            end_date: "2099-12-31"
        });
        console.log(`Created Missed Plan at ${oneHourAgo}`);
        // 4. Create Todo
        yield request('POST', '/todos', {
            title: 'Test Todo',
            description: 'Do something',
            due_date: today,
            type: 'custom',
            status: 'pending'
        });
        console.log('Created Todo');
        // 5. Create FollowUp
        yield request('POST', '/followups', {
            date: today,
            time: '12:00',
            location: 'Hospital',
            doctor: 'Dr. House',
            note: 'Check leg',
            status: 'pending'
        });
        console.log('Created FollowUp');
        // 6. Get Reminders
        const res = yield request('GET', '/reminders');
        const reminders = res.data;
        console.log('Reminders received:', reminders.length);
        // Check types
        const types = reminders.map((r) => r.type);
        console.log('Reminder Types:', types);
        const hasStock = types.includes('stock_low');
        const hasUpcoming = types.includes('medication_upcoming');
        const hasMissed = types.includes('medication_missed');
        const hasTodo = types.includes('todo');
        const hasFollowUp = types.includes('follow_up');
        if (hasStock && hasUpcoming && hasMissed && hasTodo && hasFollowUp) {
            console.log('PASS: All reminder types present.');
        }
        else {
            console.error('FAIL: Missing reminder types.');
            console.error({ hasStock, hasUpcoming, hasMissed, hasTodo, hasFollowUp });
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    }
});
runTests();
