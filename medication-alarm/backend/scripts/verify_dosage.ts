import axios from 'axios';

const API_BASE = 'http://192.168.1.36:3000/api';

// Temporary script to verify alternating dosage logic
const testAlternatingDosage = async () => {
    try {
        console.log('--- Testing Alternating Dosage Logic ---');
        
        // 1. Create User
        // Assuming user 1 exists or using a test user
        const userId = 1;
        
        // 2. Create Medication with alternating dosage
        console.log('Creating medication...');
        const medRes = await axios.post(`${API_BASE}/medications`, {
            name: 'Test Med ' + Date.now(),
            dosage: '0.25, 0.5',
            unit: '片',
            color: '#FF0000',
            stock: 100
        }, { headers: { 'x-user-id': userId } });
        const medId = medRes.data.id;
        console.log('Medication created:', medId);

        // 3. Create Plan starting TODAY
        const today = new Date().toISOString().split('T')[0];
        console.log('Creating plan starting:', today);
        await axios.post(`${API_BASE}/plans`, {
            medication_id: medId,
            time: '08:00',
            frequency: 'daily',
            start_date: today
        }, { headers: { 'x-user-id': userId } });

        // 4. Fetch Daily Schedule for TODAY (Day 0) -> Should be first dosage (0.25)
        console.log('Fetching schedule for today...');
        const res1 = await axios.get(`${API_BASE}/plans/daily?date=${today}`, {
            headers: { 'x-user-id': userId }
        });
        const item1 = res1.data.find((i: any) => i.medication_id === medId);
        console.log(`Day 0 Dosage Expected: 0.25, Actual: ${item1.dosage}`);

        // 5. Fetch Daily Schedule for TOMORROW (Day 1) -> Should be second dosage (0.5)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        console.log('Fetching schedule for tomorrow...');
        const res2 = await axios.get(`${API_BASE}/plans/daily?date=${tomorrowStr}`, {
            headers: { 'x-user-id': userId }
        });
        const item2 = res2.data.find((i: any) => i.medication_id === medId);
        console.log(`Day 1 Dosage Expected: 0.5, Actual: ${item2.dosage}`);
        
        // 6. Fetch Daily Schedule for DAY AFTER TOMORROW (Day 2) -> Should be first dosage (0.25)
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];
        
        console.log('Fetching schedule for day after tomorrow...');
        const res3 = await axios.get(`${API_BASE}/plans/daily?date=${dayAfterStr}`, {
            headers: { 'x-user-id': userId }
        });
        const item3 = res3.data.find((i: any) => i.medication_id === medId);
        console.log(`Day 2 Dosage Expected: 0.25, Actual: ${item3.dosage}`);

        if (item1.dosage === '0.25' && item2.dosage === '0.5' && item3.dosage === '0.25') {
            console.log('SUCCESS: Alternating dosage logic verified!');
        } else {
            console.error('FAILURE: Dosage sequence incorrect.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
};

testAlternatingDosage();
