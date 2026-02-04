import axios from 'axios';

const API_BASE = 'http://192.168.1.36:3000/api';

// Script to populate future follow-up data for verification
const populateFutureData = async () => {
    try {
        console.log('--- Populating Future Data for UX Verification ---');
        
        const userId = 1;
        
        // 1. Create a future follow-up (next month)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const dateStr = nextMonth.toISOString().split('T')[0];
        
        console.log(`Creating Follow-up for ${dateStr}...`);
        const res = await axios.post(`${API_BASE}/followups`, {
            doctor: 'Dr. Future (Test)',
            location: 'Virtual Clinic',
            date: dateStr,
            time: '10:00',
            note: 'Routine checkup'
        }, { headers: { 'x-user-id': userId } });
        
        console.log('Created Follow-up ID:', res.data.id);
        console.log('--- Data Ready ---');
        console.log('Please check "Reminders" page -> Bottom of list for "未来复诊预告"');
        
    } catch (error) {
        console.error('Failed:', error);
    }
};

populateFutureData();
