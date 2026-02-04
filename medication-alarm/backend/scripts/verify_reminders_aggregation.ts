
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
    console.log('Starting Reminders Aggregation Verification...');

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().substring(0, 5);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toTimeString().substring(0, 5);

    // 1. Create Medication with Low Stock (<= 10)
    const medRes: any = await request('POST', '/medications', {
        name: 'Low Stock Med',
        dosage: '1',
        unit: 'pill',
        stock: 5,
        color: '#FF0000'
    });
    const medId = medRes.data.id;
    console.log('Created Low Stock Med:', medId);

    // 2. Create Plan for Upcoming (Time > Now)
    await request('POST', '/plans', {
        medication_id: medId,
        time: oneHourLater,
        frequency: "daily",
        start_date: today,
        end_date: "2099-12-31"
    });
    console.log(`Created Upcoming Plan at ${oneHourLater}`);

    // 3. Create Plan for Missed (Time < Now)
    await request('POST', '/plans', {
        medication_id: medId,
        time: oneHourAgo,
        frequency: "daily",
        start_date: today,
        end_date: "2099-12-31"
    });
    console.log(`Created Missed Plan at ${oneHourAgo}`);

    // 4. Create Todo
    await request('POST', '/todos', {
        title: 'Test Todo',
        description: 'Do something',
        due_date: today,
        type: 'custom',
        status: 'pending'
    });
    console.log('Created Todo');

    // 5. Create FollowUp
    await request('POST', '/followups', {
        date: today,
        time: '12:00',
        location: 'Hospital',
        doctor: 'Dr. House',
        note: 'Check leg',
        status: 'pending'
    });
    console.log('Created FollowUp');

    // 6. Get Reminders
    const res: any = await request('GET', '/reminders');
    const reminders = res.data;

    console.log('Reminders received:', reminders.length);
    
    // Check types
    const types = reminders.map((r: any) => r.type);
    console.log('Reminder Types:', types);

    const hasStock = types.includes('stock_low');
    const hasUpcoming = types.includes('medication_upcoming');
    const hasMissed = types.includes('medication_missed');
    const hasTodo = types.includes('todo');
    const hasFollowUp = types.includes('follow_up');

    if (hasStock && hasUpcoming && hasMissed && hasTodo && hasFollowUp) {
        console.log('PASS: All reminder types present.');
    } else {
        console.error('FAIL: Missing reminder types.');
        console.error({ hasStock, hasUpcoming, hasMissed, hasTodo, hasFollowUp });
        process.exit(1);
    }

  } catch (error) {
    console.error('Test Error:', error);
    process.exit(1);
  }
};

runTests();
