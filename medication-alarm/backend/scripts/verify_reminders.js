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
const API_BASE = 'http://localhost:3000/api';
const USER_ID = '1';
const headers = {
    'x-user-id': USER_ID,
    'Content-Type': 'application/json'
};
function runTest() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting Reminders Verification...');
        try {
            // 1. Create a Todo
            console.log('\n1. Creating Todo...');
            const createRes = yield fetch(`${API_BASE}/todos`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: 'Original Title',
                    description: 'Original Desc',
                    due_date: '2026-02-01 10:00',
                    type: 'custom'
                })
            });
            if (createRes.status !== 201)
                throw new Error('Create failed');
            const todo = yield createRes.json();
            const todoId = todo.id;
            console.log(`Created Todo ID: ${todoId}`);
            // 2. Update the Todo
            console.log('\n2. Updating Todo...');
            const updateRes = yield fetch(`${API_BASE}/todos/${todoId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    title: 'Updated Title',
                    due_date: '2026-02-02 12:00'
                })
            });
            if (updateRes.status !== 200)
                throw new Error('Update failed');
            console.log('Update success');
            // Verify Update
            const listRes1 = yield fetch(`${API_BASE}/todos`, { headers });
            const todos1 = yield listRes1.json();
            const updatedTodo = todos1.find((t) => t.id === todoId);
            if (updatedTodo.title !== 'Updated Title')
                throw new Error('Update verification failed');
            console.log('Update verified');
            // 3. Mark as Completed
            console.log('\n3. Marking as Completed...');
            yield fetch(`${API_BASE}/todos/${todoId}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'completed' })
            });
            console.log('Status updated to completed');
            // 4. Verify in List (should be completed)
            const listRes2 = yield fetch(`${API_BASE}/todos`, { headers });
            const todos2 = yield listRes2.json();
            const completedTodo = todos2.find((t) => t.id === todoId);
            if (completedTodo.status !== 'completed')
                throw new Error('Completion verification failed');
            console.log('Completion verified');
            // 5. Undo Completion
            console.log('\n5. Undoing Completion...');
            yield fetch(`${API_BASE}/todos/${todoId}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status: 'pending' })
            });
            console.log('Status reverted to pending');
            // 6. Verify in List (should be pending)
            const listRes3 = yield fetch(`${API_BASE}/todos`, { headers });
            const todos3 = yield listRes3.json();
            const pendingTodo = todos3.find((t) => t.id === todoId);
            if (pendingTodo.status !== 'pending')
                throw new Error('Undo verification failed');
            console.log('Undo verified');
            console.log('\nAll tests passed!');
        }
        catch (error) {
            console.error('Test Failed:', error.message);
            process.exit(1);
        }
    });
}
runTest();
