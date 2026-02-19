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
const API_BASE = 'http://192.168.1.36:3000/api';
// Script to populate future follow-up data for verification
const populateFutureData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('--- Populating Future Data for UX Verification ---');
        const userId = 1;
        // 1. Create a future follow-up (next month)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const dateStr = nextMonth.toISOString().split('T')[0];
        console.log(`Creating Follow-up for ${dateStr}...`);
        const res = yield axios_1.default.post(`${API_BASE}/followups`, {
            doctor: 'Dr. Future (Test)',
            location: 'Virtual Clinic',
            date: dateStr,
            time: '10:00',
            note: 'Routine checkup'
        }, { headers: { 'x-user-id': userId } });
        console.log('Created Follow-up ID:', res.data.id);
        console.log('--- Data Ready ---');
        console.log('Please check "Reminders" page -> Bottom of list for "未来复诊预告"');
    }
    catch (error) {
        console.error('Failed:', error);
    }
});
populateFutureData();
