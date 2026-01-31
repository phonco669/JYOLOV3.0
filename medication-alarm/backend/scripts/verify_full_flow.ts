const API_BASE = 'http://localhost:3000/api';
const USER_ID = '1';

const headers = {
  'x-user-id': USER_ID,
  'Content-Type': 'application/json'
};

async function runTest() {
  console.log('Starting Full Flow Verification...');
  const today = new Date().toISOString().split('T')[0];

  try {
    // --- PART 1: Medication & Plan ---
    console.log('\n--- PART 1: Medication & Plan Flow ---');

    // 1. Create Medication
    console.log('1. Creating Medication...');
    const medRes = await fetch(`${API_BASE}/medications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Med',
        dosage: '1',
        unit: 'pill',
        color: '#FF0000',
        stock: 100
      })
    });
    if (medRes.status !== 201) throw new Error('Create Medication failed');
    const med = await medRes.json();
    console.log(`Created Medication ID: ${med.id}, Stock: ${med.stock}`);

    // 2. Create Plan
    console.log('2. Creating Plan...');
    const planRes = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        medication_id: med.id,
        time: '08:00',
        frequency: 'daily',
        start_date: today,
        end_date: '2030-01-01'
      })
    });
    if (planRes.status !== 201) throw new Error('Create Plan failed');
    const plan = await planRes.json();
    console.log(`Created Plan ID: ${plan.id}`);

    // 3. Get Schedule (Should be pending)
    console.log('3. Checking Schedule (Pending)...');
    const scheduleRes1 = await fetch(`${API_BASE}/plans/schedule?date=${today}`, { headers });
    const schedule1 = await scheduleRes1.json();
    const item1 = schedule1.find((s: any) => s.plan_id === plan.id);
    if (!item1 || item1.status !== 'pending') throw new Error(`Schedule check failed: status is ${item1?.status}`);
    console.log('Schedule is pending');

    // 4. Take Medication
    console.log('4. Taking Medication...');
    const takeRes = await fetch(`${API_BASE}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        medication_id: med.id,
        plan_id: plan.id,
        taken_at: new Date().toISOString(),
        status: 'taken',
        dosage_taken: 1
      })
    });
    if (takeRes.status !== 201) throw new Error('Take Medication failed');
    const record = await takeRes.json();
    console.log(`Created Record ID: ${record.id}`);

    // 5. Verify Schedule (Taken) & Stock
    console.log('5. Checking Schedule (Taken) & Stock...');
    const scheduleRes2 = await fetch(`${API_BASE}/plans/schedule?date=${today}`, { headers });
    const schedule2 = await scheduleRes2.json();
    const item2 = schedule2.find((s: any) => s.plan_id === plan.id);
    if (!item2 || item2.status !== 'taken') throw new Error(`Schedule check failed: status is ${item2?.status}`);
    
    const medRes2 = await fetch(`${API_BASE}/medications`, { headers });
    const meds2 = await medRes2.json();
    const updatedMed = meds2.find((m: any) => m.id === med.id);
    if (updatedMed.stock !== 99) throw new Error(`Stock check failed: expected 99, got ${updatedMed.stock}`);
    console.log('Schedule is taken, Stock reduced to 99');

    // 6. Undo Take (Delete Record)
    console.log('6. Undoing Take...');
    const undoRes = await fetch(`${API_BASE}/records/${record.id}`, {
      method: 'DELETE',
      headers
    });
    if (undoRes.status !== 200) throw new Error('Undo failed');
    console.log('Undo successful');

    // 7. Verify Schedule (Pending) & Stock Restored
    console.log('7. Checking Schedule (Pending) & Stock Restored...');
    const scheduleRes3 = await fetch(`${API_BASE}/plans/schedule?date=${today}`, { headers });
    const schedule3 = await scheduleRes3.json();
    const item3 = schedule3.find((s: any) => s.plan_id === plan.id);
    if (!item3 || item3.status !== 'pending') throw new Error(`Schedule check failed: status is ${item3?.status}`);

    const medRes3 = await fetch(`${API_BASE}/medications`, { headers });
    const meds3 = await medRes3.json();
    const restoredMed = meds3.find((m: any) => m.id === med.id);
    if (restoredMed.stock !== 100) throw new Error(`Stock check failed: expected 100, got ${restoredMed.stock}`);
    console.log('Schedule reverted to pending, Stock restored to 100');


    // --- PART 2: Reminders ---
    console.log('\n--- PART 2: Reminders Flow ---');

    // 8. Create Todo
    console.log('8. Creating Todo...');
    const todoRes = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Test Reminder',
        due_date: `${today} 10:00`,
        type: 'custom'
      })
    });
    if (todoRes.status !== 201) throw new Error('Create Todo failed');
    const todo = await todoRes.json();
    console.log(`Created Todo ID: ${todo.id}`);

    // 9. Update Todo
    console.log('9. Updating Todo...');
    const updateRes = await fetch(`${API_BASE}/todos/${todo.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Updated Reminder',
        due_date: `${today} 12:00`
      })
    });
    if (updateRes.status !== 200) throw new Error('Update Todo failed');
    console.log('Update successful');

    // 10. Complete Todo
    console.log('10. Completing Todo...');
    const completeRes = await fetch(`${API_BASE}/todos/${todo.id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'completed' })
    });
    if (completeRes.status !== 200) throw new Error('Complete Todo failed');
    
    // Verify list (should be completed)
    const listRes = await fetch(`${API_BASE}/todos`, { headers });
    const todos = await listRes.json();
    const completedTodo = todos.find((t: any) => t.id === todo.id);
    if (completedTodo.status !== 'completed') throw new Error('Completion verification failed');
    console.log('Todo completed');

    // 11. Undo Complete
    console.log('11. Undoing Complete...');
    const undoTodoRes = await fetch(`${API_BASE}/todos/${todo.id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'pending' })
    });
    if (undoTodoRes.status !== 200) throw new Error('Undo Todo failed');

    // Verify list (should be pending)
    const listRes2 = await fetch(`${API_BASE}/todos`, { headers });
    const todos2 = await listRes2.json();
    const pendingTodo = todos2.find((t: any) => t.id === todo.id);
    if (pendingTodo.status !== 'pending') throw new Error('Undo verification failed');
    console.log('Todo reverted to pending');

    console.log('\nAll tests passed!');

  } catch (error: any) {
    console.error('Test Failed:', error.message);
    process.exit(1);
  }
}

runTest();
