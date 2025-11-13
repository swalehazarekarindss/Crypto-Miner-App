# Install node-cron

Run this command in the Server directory:

```bash
cd Server
npm install node-cron
```

Then restart your server:

```bash
npm start
```

You should see:
```
✅ MongoDB Connected
✅ Mining checker started - checking every minute
✅ Mining checker service started
🚀 Server running on port 5000
```

The server will now check every minute if any mining sessions are complete and log them.
