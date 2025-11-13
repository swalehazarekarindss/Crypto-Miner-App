# API Configuration

## Server Setup

1. Start your backend server:
```bash
cd Server
npm start
```

2. Update the API URL in `services/api.ts`:
   - For Android Emulator: `http://10.0.2.2:5000/api/user`
   - For iOS Simulator: `http://localhost:5000/api/user`
   - For Physical Device: `http://YOUR_COMPUTER_IP:5000/api/user`

Current setting: `http://192.168.1.5:5000/api/user`

## Troubleshooting

### If signup is not working:

1. **Check if server is running:**
   ```bash
   cd Server
   npm start
   ```
   You should see: "✅ MongoDB Connected" and "🚀 Server running on port 5000"

2. **Test server connection:**
   ```bash
   node test-server.js
   ```

3. **Check your IP address:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
   - Update the IP in `services/api.ts`

4. **For Android Emulator:**
   - Use `http://10.0.2.2:5000/api/user` instead of localhost

5. **Check Metro bundler logs:**
   - Look for console.log messages showing the API calls
   - Check for network errors

6. **Verify MongoDB connection:**
   - Make sure your MongoDB Atlas cluster is accessible
   - Check if IP whitelist includes your current IP

## API Endpoints Used

- POST `/api/user/register` - User signup
- POST `/api/user/login` - User login
- GET `/api/user/me` - Get user details (protected)
