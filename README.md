# TaskBoard Pro

TaskBoard Pro is a full-stack task management application that helps teams organize, track, and collaborate on tasks and projects. The application features a modern, responsive UI built with React and a robust backend API powered by Node.js, Express, and MongoDB.

## 🚀 Features

### Project Management
- Create and manage multiple projects
- Invite team members to collaborate
- Assign different roles (Admin, Editor, Viewer) with granular permissions
- Customize project task statuses

### Task Management
- Intuitive kanban board for visualizing task workflow
- Drag and drop tasks between status columns
- Create, edit, and delete tasks with rich details:
  - Title and description
  - Assignee
  - Due date
  - Priority levels (Low, Medium, High, Urgent)
  - Tags
  - File attachments
  - Time tracking

### Task Dependencies
- Set up dependencies between tasks
- Establish blocking relationships
- Prevent circular dependencies

### Real-time Collaboration
- Live updates with WebSockets
- Notification system for task assignments, status changes, etc.
- Team member activity tracking

### Automation
- Create custom automation rules
- Trigger actions based on task events
- Auto-assign tasks, change statuses, send notifications

### Analytics and Reporting
- Project progress visualization
- Team performance metrics
- Task completion tracking
- Custom reports with filtering options
- Export data to CSV

### User Management
- Firebase authentication
- Profile management
- Role-based access control

## 🔧 Technical Architecture

### Frontend
- **Framework**: React 19
- **Routing**: React Router 7
- **State Management**: Context API
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io client
- **Authentication**: Firebase Auth
- **Drag & Drop**: @dnd-kit
- **Build Tool**: Vite 6

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Admin SDK
- **Real-time**: Socket.io
- **File Storage**: Local file system (production would use cloud storage)
- **Validation**: express-validator

## 📊 Database Schema

### User Model
```javascript
{
  uid: String,          // Firebase UID
  displayName: String,
  email: String,
  photoURL: String,
  projects: [ObjectId], // References to Project model
  badges: [{
    name: String,
    awardedAt: Date,
    projectId: ObjectId
  }]
}
```

### Project Model
```javascript
{
  title: String,
  description: String,
  owner: ObjectId,       // Reference to User model
  members: [{
    user: ObjectId,      // Reference to User model
    role: String,        // "Admin", "Editor", or "Viewer"
    joinedAt: Date
  }],
  statuses: [{
    name: String,
    order: Number
  }],
  createdAt: Date
}
```

### Task Model
```javascript
{
  title: String,
  description: String,
  project: ObjectId,     // Reference to Project model
  status: String,
  assignee: ObjectId,    // Reference to User model
  dueDate: Date,
  priority: String,      // "Low", "Medium", "High", "Urgent"
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: Date,
    uploadedBy: ObjectId // Reference to User model
  }],
  dependencies: [{
    task: ObjectId,      // Reference to Task model
    type: String         // "blocks" or "blocked_by"
  }],
  timeTracking: {
    estimate: Number,    // minutes
    logged: Number,      // minutes
    history: [{
      startTime: Date,
      endTime: Date,
      duration: Number,  // minutes
      description: String,
      user: ObjectId     // Reference to User model
    }]
  },
  createdBy: ObjectId,   // Reference to User model
  createdAt: Date,
  updatedAt: Date
}
```

### Automation Model
```javascript
{
  project: ObjectId,     // Reference to Project model
  name: String,
  trigger: {
    type: String,        // "task_status_change", "task_assignment", etc.
    condition: Object,   // Varies based on trigger type
    conditional: {
      operator: String,  // "and", "or", "not"
      conditions: [Object]
    }
  },
  actions: [{
    type: String,        // "change_status", "assign_badge", etc.
    params: Object       // Parameters for the action
  }],
  createdBy: ObjectId,   // Reference to User model
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  recipient: ObjectId,   // Reference to User model
  content: String,
  type: String,          // "task_assignment", "status_change", etc.
  isRead: Boolean,
  relatedProject: ObjectId, // Reference to Project model
  relatedTask: ObjectId,    // Reference to Task model
  createdAt: Date
}
```

## 🔐 Authentication & Authorization

TaskBoard Pro uses Firebase Authentication for user management and JWT for API authorization.

### Authentication Flow
1. Users sign up/sign in through Firebase Auth (email/password or Google)
2. Firebase issues an ID token after successful authentication
3. The token is stored in localStorage and sent with API requests
4. The backend verifies the token using Firebase Admin SDK
5. If verification succeeds, the user's profile is fetched or created in MongoDB

### Authorization
- Role-based access control (RBAC) for project resources
- Middleware checks for permissions based on user's role in a project
- Custom middleware for socket connections

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Required Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/register` | Register new user | `uid`, `displayName`, `email`, `photoURL` | User object |
| POST | `/api/auth/user-profile` | Update user profile | `uid`, `displayName`, `photoURL` | User object |
| GET | `/api/auth/me` | Get current user profile | - | User object with projects |

### Project Endpoints

| Method | Endpoint | Description | Required Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/projects` | Get user's projects | - | Array of projects |
| POST | `/api/projects` | Create new project | `title`, `description` | Project object |
| GET | `/api/projects/:projectId` | Get project details | - | Project object with members |
| PUT | `/api/projects/:projectId` | Update project | `title`, `description` | Updated project |
| POST | `/api/projects/:projectId/invite` | Invite user to project | `email`, `role` | Success message |
| POST | `/api/projects/:projectId/statuses` | Update project statuses | `statuses` array | Updated project |
| GET | `/api/projects/:projectId/members` | Get project members | - | Array of members |
| PUT | `/api/projects/:projectId/members/:memberId/role` | Update member role | `role` | Updated member |
| DELETE | `/api/projects/:projectId/members/:memberId` | Remove member | - | Success message |
| DELETE | `/api/projects/:projectId` | Delete project | - | Success message |

### Task Endpoints

| Method | Endpoint | Description | Required Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/tasks/project/:projectId` | Get project tasks | - | Array of tasks |
| GET | `/api/tasks/filter` | Get filtered tasks | Query params | Array of tasks |
| POST | `/api/tasks` | Create new task | Task object | Created task |
| PUT | `/api/tasks/:taskId` | Update task | Task fields | Updated task |
| DELETE | `/api/tasks/:taskId` | Delete task | - | Success message |
| POST | `/api/tasks/:taskId/time` | Add time tracking entry | Time entry | Updated task |
| PUT | `/api/tasks/:taskId/dependencies` | Update dependencies | `dependencies` | Updated task |

### Automation Endpoints

| Method | Endpoint | Description | Required Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/automations/project/:projectId` | Get project automations | - | Array of automations |
| POST | `/api/automations` | Create automation | Automation object | Created automation |
| PUT | `/api/automations/:automationId` | Update automation | Automation fields | Updated automation |
| DELETE | `/api/automations/:automationId` | Delete automation | - | Success message |

### Notification Endpoints

| Method | Endpoint | Description | Required Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/notifications` | Get user notifications | - | Array of notifications |
| PUT | `/api/notifications/:notificationId/read` | Mark notification as read | - | Updated notification |
| PUT | `/api/notifications/read-all` | Mark all as read | - | Success message |

### File Endpoints

| Method | Endpoint | Description | Required Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/files/upload/:taskId` | Upload file attachment | Multipart form | Attachment object |
| GET | `/api/files/:filename` | Download file | - | File stream |
| DELETE | `/api/files/:taskId/:attachmentId` | Delete attachment | - | Success message |

## 📱 Socket Events

### Client to Server
- `join-project`: Join a project's real-time updates room
- `leave-project`: Leave a project's updates room

### Server to Client
- `task-updated`: When a task is updated
- `task-created`: When a new task is created
- `task-deleted`: When a task is deleted
- `comment-added`: When a comment is added to a task
- `project-updated`: When project details are updated
- `notification`: When a user receives a notification

## 🔄 Development Workflow

### Environment Setup
1. Clone the repository
2. Set up MongoDB database
3. Create a Firebase project for authentication
4. Configure environment variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taskboard-pro
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Running the Application
```bash
# Backend
cd taskboard-pro-backend
npm install
npm run dev

# Frontend
cd taskboard-pro-frontend
npm install
npm run dev
```

## 🛣️ Future Roadmap

- **Advanced Reporting**: Add more analytics and data visualization options
- **Email Notifications**: Send email notifications for important events
- **API Integrations**: Connect with third-party services (Slack, GitHub, etc.)
- **Mobile App**: Develop mobile applications for iOS and Android
- **AI Features**: Implement smart task suggestions and priority management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
