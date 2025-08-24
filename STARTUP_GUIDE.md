# Parent Connect App - Startup Guide

## Quick Start

The `parent-connect.sh` script provides easy management of your Parent Connect App (frontend + backend).

### Prerequisites

- **Node.js** (for frontend)
- **Bun** (for backend) - Install with: `curl -fsSL https://bun.sh/install | bash`

### Basic Commands

```bash
# Start the entire application (frontend + backend)
./parent-connect.sh start

# Stop the application
./parent-connect.sh stop

# Gracefully shutdown the application
./parent-connect.sh shutdown

# Restart the application
./parent-connect.sh restart

# Check current status
./parent-connect.sh status

# Clean up PID files (if processes are stuck)
./parent-connect.sh cleanup

# Force kill processes on app ports (emergency cleanup)
./parent-connect.sh force-kill
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
./parent-connect.sh cleanup
./parent-connect.sh start
```

**If ports are in use:**
```bash
# Check what's using the ports
./parent-connect.sh status

# Force kill processes on app ports
./parent-connect.sh force-kill

# Then start again
./parent-connect.sh start
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

### Manual Commands (if needed)

If you prefer to run services manually:

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

### Development Workflow

1. **Start development**: `./parent-connect.sh start`
2. **Make changes** to your code
3. **Check status**: `./parent-connect.sh status`
4. **Restart if needed**: `./parent-connect.sh restart`
5. **Stop when done**: `./parent-connect.sh stop`
