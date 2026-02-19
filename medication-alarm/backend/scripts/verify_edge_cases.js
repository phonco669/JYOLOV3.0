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
        console.log('Starting Edge Case Verification...');
        // 1. Create Medication
        const medRes = yield request('POST', '/medications', {
            name: 'Edge Med',
            dosage: '1',
            unit: 'pill',
            stock: 10,
            color: '#FF0000'
        });
        const medId = medRes.data.id;
        console.log('Created Med:', medId);
        // 2. Create Plan with trailing comma in time
        const planRes = yield request('POST', '/plans', {
            medication_id: medId,
            time: "08:00,", // Trailing comma!
            frequency: "daily",
            start_date: new Date().toISOString().split('T')[0],
            end_date: "2099-12-31"
        });
        const planId = planRes.data.id;
        console.log('Created Plan with trailing comma:', planId);
        // 3. Take Medication Once
        yield request('POST', '/records', {
            medication_id: medId,
            plan_id: planId,
            taken_at: new Date().toISOString(),
            status: 'taken',
            dosage_taken: 1
        });
        console.log('Taken Med once');
        // 4. Check Monthly Status
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];
        const statusRes = yield request('GET', `/plans/monthly?start=${start}&end=${end}`);
        const statusMap = statusRes.data;
        console.log(`Status for today (${today}):`, statusMap[today]);
        // Expectation: Should be 'all_taken' because "08:00," implies 1 valid time.
        // If bug exists, it will count 2 times and return 'partial'.
        if (statusMap[today] === 'partial') {
            console.error('FAIL: Trailing comma caused incorrect expectation (got partial, expected all_taken)');
            process.exit(1);
        }
        else if (statusMap[today] === 'all_taken') {
            console.log('PASS: Trailing comma handled correctly');
        }
        else {
            console.log('Unexpected status:', statusMap[today]);
        }
    }
    catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    }
});
runTests();
