
import http from 'http';

const request = (method: string, path: string, body?: any) => {
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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
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

const runTests = async () => {
  try {
    console.log('--- 1. List Medications ---');
    const medsRes: any = await request('GET', '/medications');
    console.log('Status:', medsRes.status);
    console.log('Meds:', medsRes.data);

    if (medsRes.data.length === 0) {
        console.log('No medications found. Skipping Plan/Record creation.');
        return;
    }
    const medId = medsRes.data[0].id;

    console.log('\n--- 2. Create Plan ---');
    const planRes: any = await request('POST', '/plans', {
        medication_id: medId,
        time: "08:00",
        frequency: "daily",
        start_date: "2026-01-31",
        end_date: "2026-12-31"
    });
    console.log('Status:', planRes.status);
    console.log('Plan:', planRes.data);

    console.log('\n--- 3. List Plans ---');
    const plansRes: any = await request('GET', '/plans');
    console.log('Status:', plansRes.status);
    console.log('Plans:', plansRes.data);

    console.log('\n--- 4. Create Record ---');
    const recordRes: any = await request('POST', '/records', {
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
    const scheduleRes: any = await request('GET', `/plans/schedule?date=${today}`);
    console.log('Daily Schedule:', JSON.stringify(scheduleRes.data, null, 2));

    // 7. Get Monthly Status
    console.log('\n7. Fetching Monthly Status...');
    // Use current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const monthlyRes: any = await request('GET', `/plans/monthly?start=${startOfMonth}&end=${endOfMonth}`);
  console.log('Monthly Status (Partial):', JSON.stringify(monthlyRes.data, null, 2));

  // 8. Todos
  console.log('\n8. Creating Todo...');
  const todoData = {
    title: '购买维生素',
    description: '维生素C和D',
    due_date: '2026-02-01',
    type: 'custom'
  };
  const createTodoRes: any = await request('POST', '/todos', todoData);
  console.log('Create Todo Status:', createTodoRes.status);
  
  console.log('\n9. Fetching Reminders...');
  const remindersRes: any = await request('GET', '/reminders');
  console.log('Reminders:', JSON.stringify(remindersRes.data, null, 2));

  // 10. Delete Record (Undo Take)
  console.log('\n10. Deleting Record (Undo Take)...');
  const deleteRes: any = await request('DELETE', `/records/${recordRes.data.id}`);
  console.log('Delete Status:', deleteRes.status);
  
  // Verify schedule again to see if it's pending
  console.log('Verifying Schedule Reversion...');
  const scheduleRes2: any = await request('GET', `/plans/schedule?date=${today}`);
  // Check if the plan status is 'pending'
  const planInSchedule = scheduleRes2.data.find((p: any) => p.plan_id === planRes.data.id);
  console.log('Plan Status after delete:', planInSchedule ? planInSchedule.status : 'Not found');

  console.log('\nVerification finished successfully!');

} catch (err) {
    console.error('Test failed:', err);
  }
};

runTests();
