require('dotenv').config();
const mongoose = require('mongoose');

async function runVerification() {
    try {
        const baseUrl = 'http://localhost:5000/api';
        const ts = Date.now();
        const testEmail = `test_${ts}@test.com`;
        const pwd = 'Password123!';

        console.log('1. Registering test user...');
        const regRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: pwd, name: 'Test User' })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error('Registration failed: ' + JSON.stringify(regData));

        console.log('2. Making user admin in DB...');
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('./src/modules/auth/models/User.js');
        await User.updateOne({ email: testEmail }, { $set: { role: 'admin' } });
        console.log('   User is now admin.');
        await mongoose.disconnect();

        console.log('2b. Re-logging in to get admin token...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: pwd })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
        const adminToken = loginData.token;

        const hdrs = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };

        console.log('3. Creating Workflow...');
        const wfRes = await fetch(`${baseUrl}/workflows`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({
                name: `Verify WF ${ts}`,
                description: 'Auto-verification testing',
                states: [
                    { name: 'TODO', type: 'initial', color: '#ff0000', order: 0 },
                    { name: 'IN_PROGRESS', type: 'active', color: '#3b82f6', order: 1 },
                    { name: 'DONE', type: 'terminal', color: '#00ff00', order: 2 }
                ],
                defaultState: 'TODO'
            })
        });
        const wfData = await wfRes.json();
        if (!wfRes.ok) throw new Error('Workflow creation failed: ' + JSON.stringify(wfData));
        const workflowId = wfData.workflow._id;
        console.log('   Workflow created: ' + workflowId);

        console.log('4. Creating Project...');
        const projRes = await fetch(`${baseUrl}/projects`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({
                name: `Verify Project ${ts}`,
                key: `VRF${ts.toString().slice(-4)}`,
                description: 'Testing verification flow',
                workflowId
            })
        });
        const projData = await projRes.json();
        if (!projRes.ok) throw new Error('Project creation failed: ' + JSON.stringify(projData));
        const projectId = projData.project._id;
        console.log('   Project created: ' + projectId);

        console.log('5. Creating Sprint...');
        const spRes = await fetch(`${baseUrl}/sprints`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({
                projectId,
                name: `Sprint ${ts}`,
                goal: 'Test sprint creation',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 86400000 * 7).toISOString()
            })
        });
        const spData = await spRes.json();
        if (!spRes.ok) throw new Error('Sprint creation failed: ' + JSON.stringify(spData));
        const sprintId = spData.data._id;
        console.log('   Sprint created: ' + sprintId);

        console.log('6. Creating Task...');
        const taskRes = await fetch(`${baseUrl}/tasks`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({
                projectId,
                sprintId,
                type: 'task',
                title: `Verification Task ${ts}`,
                description: 'Ensure creation pipeline works',
                priority: 'high'
            })
        });
        const taskData = await taskRes.json();
        if (!taskRes.ok) throw new Error('Task creation failed: ' + JSON.stringify(taskData));
        console.log('   Task created: ' + taskData.task._id);

        console.log('\n=== ALL VERIFICATION PASSED ===');

    } catch (error) {
        console.error('\n=== VERIFICATION FAILED ===');
        console.error(error.message || error);
    } finally {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        process.exit(0);
    }
}

runVerification();
