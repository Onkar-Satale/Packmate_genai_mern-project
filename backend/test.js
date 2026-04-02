fetch('http://localhost:5000/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: `test${Date.now()}@test.com`, password: 'Password123!', firstName: 'Test', lastName: 'User' })
})
.then(r => [r.status, r.json()])
.then(async ([status, jsonPromise]) => console.log(status, await jsonPromise));
