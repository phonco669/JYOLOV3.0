
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
    console.log('Starting Edge Case Verification...');

    // 1. Create Medication
    const medRes: any = await request('POST', '/medications', {
        name: 'Edge Med',
        dosage: '1',
        unit: 'pill',
        stock: 10,
        color: '#FF0000'
    });
    const medId = medRes.data.id;
    console.log('Created Med:', medId);

    // 2. Create Plan with trailing comma in time
    const planRes: any = await request('POST', '/plans', {
        medication_id: medId,
        time: "08:00,", // Trailing comma!
        frequency: "daily",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "2099-12-31"
    });
    const planId = planRes.data.id;
    console.log('Created Plan with trailing comma:', planId);

    // 3. Take Medication Once
    await request('POST', '/records', {
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

    const statusRes: any = await request('GET', `/plans/monthly?start=${start}&end=${end}`);
    const statusMap = statusRes.data;

    console.log(`Status for today (${today}):`, statusMap[today]);

    // Expectation: Should be 'all_taken' because "08:00," implies 1 valid time.
    // If bug exists, it will count 2 times and return 'partial'.
    
    if (statusMap[today] === 'partial') {
        console.error('FAIL: Trailing comma caused incorrect expectation (got partial, expected all_taken)');
        process.exit(1);
    } else if (statusMap[today] === 'all_taken') {
        console.log('PASS: Trailing comma handled correctly');
    } else {
        console.log('Unexpected status:', statusMap[today]);
    }

  } catch (error) {
    console.error('Test Error:', error);
    process.exit(1);
  }
};

runTests();
