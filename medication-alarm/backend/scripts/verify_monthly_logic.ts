
const API_BASE = 'http://localhost:3000/api';
const USER_ID = '1';

const headers = {
  'x-user-id': USER_ID,
  'Content-Type': 'application/json'
};

async function runTest() {
  console.log('Starting Monthly Status Logic Verification...');
  const today = new Date().toISOString().split('T')[0];
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  try {
    // 1. Create Medication A
    console.log('1. Creating Medication A...');
    const medARes = await fetch(`${API_BASE}/medications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Med A', dosage: '1', unit: 'pill', color: '#FF0000', stock: 100 })
    });
    const medA = await medARes.json();

    // 2. Create Plan A (Daily)
    console.log('2. Creating Plan A...');
    const planARes = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ medication_id: medA.id, time: '08:00', frequency: 'daily', start_date: today, end_date: '2030-01-01' })
    });
    const planA = await planARes.json();

    // 3. Check Monthly Status (Should be 'pending' for today)
    console.log('3. Checking Monthly Status (Expect pending)...');
    const statusRes1 = await fetch(`${API_BASE}/plans/monthly?start=${start}&end=${end}`, { headers });
    const statusMap1 = await statusRes1.json();
    if (statusMap1[today] !== 'pending') throw new Error(`Expected pending, got ${statusMap1[today]}`);
    console.log('Passed: Today is pending');

    // 4. Take Med A
    console.log('4. Taking Med A...');
    await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ medication_id: medA.id, plan_id: planA.id, taken_at: new Date().toISOString(), status: 'taken', dosage_taken: 1 })
    });

    // 5. Check Monthly Status (Should be 'all_taken' for today)
    console.log('5. Checking Monthly Status (Expect all_taken)...');
    const statusRes2 = await fetch(`${API_BASE}/plans/monthly?start=${start}&end=${end}`, { headers });
    const statusMap2 = await statusRes2.json();
    if (statusMap2[today] !== 'all_taken') throw new Error(`Expected all_taken, got ${statusMap2[today]}`);
    console.log('Passed: Today is all_taken');

    // 6. Create Medication B & Plan B
    console.log('6. Creating Med B & Plan B...');
    const medBRes = await fetch(`${API_BASE}/medications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Med B', dosage: '1', unit: 'pill', color: '#00FF00', stock: 100 })
    });
    const medB = await medBRes.json();
    const planBRes = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ medication_id: medB.id, time: '09:00', frequency: 'daily', start_date: today, end_date: '2030-01-01' })
    });
    const planB = await planBRes.json();

    // 7. Check Monthly Status (Should be 'partial' for today: 1 taken, 1 pending)
    console.log('7. Checking Monthly Status (Expect partial)...');
    const statusRes3 = await fetch(`${API_BASE}/plans/monthly?start=${start}&end=${end}`, { headers });
    const statusMap3 = await statusRes3.json();
    if (statusMap3[today] !== 'partial') throw new Error(`Expected partial, got ${statusMap3[today]}`);
    console.log('Passed: Today is partial');

    console.log('All Monthly Logic Verified!');
  } catch (e: any) {
    console.error('Test Failed:', e.message);
    process.exit(1);
  }
}

runTest();
