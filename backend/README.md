# ParentConnect Backend

A high-performance backend for ParentConnect built with Bun and Elysia, providing real-time messaging, authentication, and data management for school parent communication.

## 🚀 Features

- **Real-time Messaging**: WebSocket support for instant communication
- **JWT Authentication**: Secure user authentication and authorization
- **SQLite Database**: Built-in database with Bun for easy deployment
- **TypeScript**: Full type safety throughout the application
- **RESTful API**: Clean, documented API endpoints
- **File Upload Support**: Image and document sharing capabilities
- **Message Read Status**: Track message delivery and read receipts

## 🛠️ Tech Stack

- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Elysia (TypeScript-first web framework)
- **Database**: SQLite (built into Bun)
- **Authentication**: JWT tokens
- **Real-time**: WebSocket support
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Node.js 18+ (for development tools)

## 🚀 Quick Start

1. **Install Bun** (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

2. **Install dependencies**:
```bash
bun install
```

3. **Start the development server**:
```bash
bun run dev
```

4. **Access the API**:
- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/swagger

## 📁 Project Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── index.ts      # Database service and operations
│   │   └── schema.sql    # SQLite database schema
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   └── index.ts          # Main Elysia server
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new parent account
- `POST /api/auth/login` - Login with email and password

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

### Children
- `GET /api/children` - Get user's children
- `POST /api/children` - Add a new child

### Chats
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:id` - Get specific chat details
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send a message
- `POST /api/chats/:id/read` - Mark messages as read

### WebSocket
- `WS /ws` - Real-time messaging and typing indicators

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 💾 Database Schema

The application uses SQLite with the following main tables:

- **users** - Parent accounts
- **children** - Children linked to parents
- **classes** - School classes
- **chats** - Chat rooms
- **messages** - Chat messages
- **message_reads** - Message read status

## 🌐 WebSocket Events

### Client to Server
- `join` - Join a chat room
- `leave` - Leave a chat room
- `typing` - Send typing indicator

### Server to Client
- `message` - New message received
- `typing` - User typing indicator

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

## 📦 Production Deployment

1. **Build the application**:
```bash
bun run build
```

2. **Start the production server**:
```bash
bun run start
```

## 🧪 Testing

Run tests (when implemented):
```bash
bun test
```

## 📊 Performance

- **Fast Startup**: Bun starts in milliseconds
- **Low Memory**: Efficient memory usage
- **High Throughput**: Can handle thousands of concurrent connections
- **Real-time**: WebSocket support for instant messaging

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Secure authentication
- **CORS Protection**: Cross-origin request protection
- **Input Validation**: Type-safe request validation
- **SQL Injection Protection**: Parameterized queries

## 🚀 Future Enhancements

- **File Upload**: Image and document sharing
- **Push Notifications**: Mobile notification support
- **Message Encryption**: End-to-end encryption
- **Admin Panel**: School administration tools
- **Analytics**: Usage statistics and insights
- **Multi-tenancy**: Support for multiple schools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
