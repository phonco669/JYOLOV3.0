const API_BASE = 'http://localhost:3000/api';
const USER_ID = '1';

const headers = {
  'x-user-id': USER_ID,
  'Content-Type': 'application/json'
};

async function runTest() {
  console.log('Starting Reminders Verification...');

  try {
    // 1. Create a Todo
    console.log('\n1. Creating Todo...');
    const createRes = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Original Title',
        description: 'Original Desc',
        due_date: '2026-02-01 10:00',
        type: 'custom'
      })
    });
    
    if (createRes.status !== 201) throw new Error('Create failed');
    const todo = await createRes.json();
    const todoId = todo.id;
    console.log(`Created Todo ID: ${todoId}`);

    // 2. Update the Todo
    console.log('\n2. Updating Todo...');
    const updateRes = await fetch(`${API_BASE}/todos/${todoId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Updated Title',
        due_date: '2026-02-02 12:00'
      })
    });
    
    if (updateRes.status !== 200) throw new Error('Update failed');
    console.log('Update success');

    // Verify Update
    const listRes1 = await fetch(`${API_BASE}/todos`, { headers });
    const todos1 = await listRes1.json();
    const updatedTodo = todos1.find((t: any) => t.id === todoId);
    if (updatedTodo.title !== 'Updated Title') throw new Error('Update verification failed');
    console.log('Update verified');

    // 3. Mark as Completed
    console.log('\n3. Marking as Completed...');
    await fetch(`${API_BASE}/todos/${todoId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'completed' })
    });
    console.log('Status updated to completed');

    // 4. Verify in List (should be completed)
    const listRes2 = await fetch(`${API_BASE}/todos`, { headers });
    const todos2 = await listRes2.json();
    const completedTodo = todos2.find((t: any) => t.id === todoId);
    if (completedTodo.status !== 'completed') throw new Error('Completion verification failed');
    console.log('Completion verified');

    // 5. Undo Completion
    console.log('\n5. Undoing Completion...');
    await fetch(`${API_BASE}/todos/${todoId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'pending' })
    });
    console.log('Status reverted to pending');

    // 6. Verify in List (should be pending)
    const listRes3 = await fetch(`${API_BASE}/todos`, { headers });
    const todos3 = await listRes3.json();
    const pendingTodo = todos3.find((t: any) => t.id === todoId);
    if (pendingTodo.status !== 'pending') throw new Error('Undo verification failed');
    console.log('Undo verified');

    console.log('\nAll tests passed!');

  } catch (error: any) {
    console.error('Test Failed:', error.message);
    process.exit(1);
  }
}

runTest();