# ParentConnect

A safe and organized communication platform for parents of school children, designed to replace unmanaged WhatsApp groups with a moderated, child-focused environment.

## 🎯 Problem Solved

Schools often use unmanaged WhatsApp chats for parent communication, which can lead to:
- Unmoderated content and inappropriate discussions
- Difficulty identifying which parent belongs to which child
- Lack of structure and organization
- Privacy and safety concerns

ParentConnect provides a solution by creating a dedicated, safe space for parent communication.

## ✨ Key Features

### 🔒 Safety & Verification
- **Verified Parent Accounts**: All users are verified parents
- **Child-Linked Identities**: Parents are identified by their children's names
- **Moderated Environment**: Built-in safety features and community guidelines

### 👨‍👩‍👧‍👦 Parent-Child Connection
- **Multiple Children Support**: Parents can have multiple children in different classes
- **Child Name Display**: Easy identification of parents through child names
- **Class-Based Organization**: Automatic grouping by school classes

### 💬 Communication Features
- **Class Chats**: Dedicated chat rooms for each class
- **Direct Messages**: Private conversations between parents
- **Real-time Messaging**: Instant communication with typing indicators
- **Message History**: Persistent chat history
- **Search Functionality**: Find specific chats and messages

### 📱 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **WhatsApp-like Experience**: Familiar chat interface
- **Clean UI**: Modern, intuitive design with Tailwind CSS
- **Accessibility**: Screen reader friendly and keyboard navigable

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher) for frontend
- Bun (will be installed automatically for backend)

### Quick Start (Recommended)

The easiest way to get started is using the provided startup script:

1. Clone the repository:
```bash
git clone <repository-url>
cd parent-connect-app
```

2. Make the startup script executable:
```bash
chmod +x parent-connect.sh
```

3. Start the entire application (frontend + backend):
```bash
./parent-connect.sh start
```

4. Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/swagger

### Application Management

The `parent-connect.sh` script provides easy management of your application:

```bash
# Start the application
./parent-connect.sh start

# Stop the application
./parent-connect.sh stop

# Restart the application
./parent-connect.sh restart

# Check current status
./parent-connect.sh status

# Gracefully shutdown
./parent-connect.sh shutdown

# Clean up PID files
./parent-connect.sh cleanup

# Force kill processes on app ports (emergency cleanup)
./parent-connect.sh force-kill
```

### Manual Setup (Alternative)

If you prefer to run services manually:

**Frontend Setup:**
```bash
npm install
npm run dev
```

**Backend Setup:**
```bash
cd backend
bun install
bun run dev
```

### Demo Accounts

The app includes several demo parent accounts for testing:

- **Sarah Johnson** (Emma's mom - 3rd Grade)
- **Michael Chen** (Alex's dad - 3rd Grade)
- **Emily Rodriguez** (Sophia's mom - 3rd Grade)
- **David Thompson** (James's dad - 4th Grade)
- **Lisa Wang** (Mia's mom - 3rd Grade)

## 🏗️ Technical Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **State Management**: React Hooks (local state)

### Backend (Bun + Elysia)
- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Elysia (TypeScript-first web framework)
- **Database**: SQLite (built into Bun)
- **Authentication**: JWT tokens
- **Real-time**: WebSocket support
- **Documentation**: Swagger/OpenAPI

## 📁 Project Structure

```
parent-connect-app/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── ChatLayout.tsx  # Main layout with sidebar and chat area
│   │   ├── ChatSidebar.tsx # Chat list and user info
│   │   ├── ChatWindow.tsx  # Message display and input
│   │   └── LoginPage.tsx   # Authentication page
│   ├── data/              # Mock data and sample content
│   │   └── mockData.ts    # Users, children, classes, messages
│   ├── lib/               # Utility functions
│   │   └── utils.ts       # Helper functions
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Interface definitions
│   └── App.tsx            # Main application component
├── backend/               # Bun + Elysia backend
│   ├── src/
│   │   ├── database/      # Database operations
│   │   │   ├── index.ts   # Database service
│   │   │   └── schema.sql # SQLite schema
│   │   ├── types/         # Backend type definitions
│   │   │   └── index.ts   # API types
│   │   └── index.ts       # Main Elysia server
│   ├── package.json       # Backend dependencies
│   └── setup.sh           # Backend setup script
└── README.md              # Project documentation
```

## 🔮 Future Enhancements

- **Real-time Backend**: WebSocket integration for live messaging
- **File Sharing**: Image and document sharing capabilities
- **Push Notifications**: Mobile notifications for new messages
- **Admin Panel**: School administration tools
- **Event Management**: School event coordination features
- **Calendar Integration**: Homework and event scheduling
- **Multi-language Support**: Internationalization
- **Mobile App**: Native iOS and Android applications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the need for safer parent communication in schools
- Built with modern web technologies for optimal user experience
- Designed with accessibility and usability in mind
