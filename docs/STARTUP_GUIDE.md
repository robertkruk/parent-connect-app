# Parent Connect App - Startup Guide

## 🚀 Quick Start

**The `scripts/parent-connect.sh` script is the recommended way to manage your Parent Connect App.** It handles both frontend and backend services automatically, eliminating the need to run `npm run dev` or `bun run dev` commands manually.

### ⚠️ Important: Use the Startup Script

Instead of running individual commands like:
- ❌ `npm run dev` (frontend)
- ❌ `bun run dev` (backend)

Use the unified startup script:
- ✅ `./scripts/parent-connect.sh start` (starts both services)

### Prerequisites

- **Node.js** (for frontend)
- **Bun** (for backend) - Install with: `curl -fsSL https://bun.sh/install | bash`

### Basic Commands

```bash
# Start the entire application (frontend + backend)
./scripts/parent-connect.sh start

# Stop the application
./scripts/parent-connect.sh stop

# Gracefully shutdown the application
./scripts/parent-connect.sh shutdown

# Restart the application
./scripts/parent-connect.sh restart

# Check current status
./scripts/parent-connect.sh status

# Clean up PID files (if processes are stuck)
./scripts/parent-connect.sh cleanup

# Force kill processes on app ports (emergency cleanup)
./scripts/parent-connect.sh force-kill
```

### What the Script Does

1. **Automatic Dependency Installation**: Checks if `node_modules` exists and installs dependencies if needed
2. **Process Management**: Tracks running processes using PID files
3. **Health Checks**: Verifies services start successfully
4. **Logging**: Captures output to `app.log`
5. **Colored Output**: Easy-to-read status messages
6. **Graceful Shutdown**: Sends SIGTERM first, then force kills if needed
7. **Port Management**: Prevents multiple instances and handles port conflicts
8. **Instance Detection**: Checks for existing processes and port usage

### Application URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Logs**: `app.log` (in project root)

### Troubleshooting

**If services won't start:**
```bash
# Clean up and try again
./scripts/parent-connect.sh cleanup
./scripts/parent-connect.sh start
```

**If ports are in use:**
```bash
# Check what's using the ports
./scripts/parent-connect.sh status

# Force kill processes on app ports
./scripts/parent-connect.sh force-kill

# Then start again
./scripts/parent-connect.sh start
```

**If you see "Bun is not installed":**
```bash
curl -fsSL https://bun.sh/install | bash
```

**To view logs in real-time:**
```bash
tail -f app.log
```

**If you see port conflicts:**
The script will automatically attempt to free occupied ports, but if that fails, use `force-kill` to manually clear them.

### Manual Commands (Alternative - Not Recommended)

**Note:** The startup script is preferred as it handles dependency installation, process management, and error handling automatically.

If you must run services manually:

**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
cd backend
bun install
bun run dev
```

**Why use the startup script instead?**
- ✅ Automatic dependency installation
- ✅ Process management and monitoring
- ✅ Port conflict resolution
- ✅ Graceful shutdown handling
- ✅ Unified logging
- ✅ Health checks and error recovery

### Development Workflow

1. **Start development**: `./scripts/parent-connect.sh start`
2. **Make changes** to your code
3. **Check status**: `./scripts/parent-connect.sh status`
4. **Restart if needed**: `./scripts/parent-connect.sh restart`
5. **Stop when done**: `./scripts/parent-connect.sh stop`

### Key Benefits of Using the Startup Script

- **No Manual Commands**: No need to remember `npm run dev` or `bun run dev`
- **Automatic Setup**: Dependencies are installed automatically
- **Process Management**: Handles starting, stopping, and restarting both services
- **Error Recovery**: Automatically handles port conflicts and process failures
- **Unified Interface**: Single command to manage the entire application
- **Production Ready**: Same script can be used in development and production
