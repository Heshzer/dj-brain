fetch("https://dj-brain.vercel.app/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "password" })
}).then(async r => console.log(r.status, await r.text())).catch(console.error);
