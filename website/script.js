
const API_URL = process.env.API_URL;

async function createUser(event) {
    event.preventDefault();
    const userId = Date.now().toString();
    const userData = {
        userId,
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        groupId: document.getElementById('userGroupId').value
    };

    await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    loadUsers();
    event.target.reset();
}

// Group Functions
async function createGroup(event) {
    event.preventDefault();
    const groupData = {
        groupId: Date.now().toString(),
        name: document.getElementById('groupName').value,
        leaderId: document.getElementById('groupLeaderId').value,
        createdAt: new Date().toISOString()
    };

    await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
    });

    loadGroups();
    event.target.reset();
}

// Task Functions
async function createTask(event) {
    event.preventDefault();
    const taskData = {
        taskId: Date.now().toString(),
        groupId: document.getElementById('taskGroupId').value,
        description: document.getElementById('taskDescription').value,
        assignedTo: document.getElementById('taskAssignedTo').value,
        status: 'PENDING',
        createdAt: new Date().toISOString()
    };

    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });

    loadTasks(taskData.groupId);
    event.target.reset();
}

// Loading Functions
async function loadGroups() {
    const response = await fetch(`${API_URL}/groups`);
    const groups = await response.json();
    
    updateGroupDropdowns(groups);
}

async function loadUsers() {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    const leaderSelect = document.getElementById('groupLeaderId');
    const assigneeSelect = document.getElementById('taskAssignedTo');
    
    leaderSelect.innerHTML = users.map(user => 
        `<option value="${user.userId}">${user.name} (${user.email})</option>`
    ).join('');
    
    assigneeSelect.innerHTML = leaderSelect.innerHTML;
}

function updateGroupDropdowns(groups) {
    const groupSelects = ['userGroupId', 'taskGroupId'];
    const options = groups.map(group => 
        `<option value="${group.groupId}">${group.name}</option>`
    ).join('');
    
    groupSelects.forEach(id => {
        document.getElementById(id).innerHTML = options;
    });
}

// Initial load
loadGroups();
loadUsers();