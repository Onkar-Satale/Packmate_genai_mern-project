fetch('https://packmate-backend.onrender.com/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: `test${Date.now()}@test.com`, password: 'Password123!', firstName: 'Test', lastName: 'User' })
})
.then(r => r.json().then(j => console.log(r.status, j)))
.catch(console.error);
