# Student Management Backend

## 🚀 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Login, register, logout
│   │   ├── studentController.js   # CRUD for students
│   │   ├── courseController.js    # CRUD for courses
│   │   ├── gradeController.js     # CRUD for grades
│   │   └── dashboardController.js # Stats & analytics
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   ├── errorMiddleware.js     # Global error handler
│   │   ├── validateMiddleware.js  # Request validation
│   │   └── uploadMiddleware.js    # File upload (multer)
│   ├── models/
│   │   ├── User.js                # Admin/Teacher user model
│   │   ├── Student.js             # Student model
│   │   ├── Course.js              # Course model
│   │   └── Grade.js               # Grade/Result model
│   ├── routes/
│   │   ├── index.js               # Root router
│   │   ├── authRoutes.js          # /api/auth
│   │   ├── studentRoutes.js       # /api/students
│   │   ├── courseRoutes.js        # /api/courses
│   │   ├── gradeRoutes.js         # /api/grades
│   │   └── dashboardRoutes.js     # /api/dashboard
│   ├── utils/
│   │   ├── apiResponse.js         # Standardized API responses
│   │   ├── generateToken.js       # JWT token generator
│   │   └── pagination.js          # Pagination helper
│   ├── uploads/                   # Uploaded files (profile pics)
│   │   └── .gitkeep
│   └── server.js                  # App entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## 🛠 Installation

```bash
cd backend
npm install
npm run dev
```

## 📡 API Endpoints

### Auth
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| POST   | /api/auth/register | Register admin     |
| POST   | /api/auth/login    | Login              |
| GET    | /api/auth/me       | Get current user   |
| POST   | /api/auth/logout   | Logout             |

### Students
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/students         | Get all students     |
| POST   | /api/students         | Create student       |
| GET    | /api/students/:id     | Get student by ID    |
| PUT    | /api/students/:id     | Update student       |
| DELETE | /api/students/:id     | Delete student       |
| GET    | /api/students/:id/grades | Get student grades |

### Courses
| Method | Endpoint            | Description        |
|--------|---------------------|--------------------|
| GET    | /api/courses        | Get all courses    |
| POST   | /api/courses        | Create course      |
| GET    | /api/courses/:id    | Get course by ID   |
| PUT    | /api/courses/:id    | Update course      |
| DELETE | /api/courses/:id    | Delete course      |

### Grades
| Method | Endpoint          | Description      |
|--------|-------------------|------------------|
| GET    | /api/grades       | Get all grades   |
| POST   | /api/grades       | Add grade        |
| PUT    | /api/grades/:id   | Update grade     |
| DELETE | /api/grades/:id   | Delete grade     |

### Dashboard
| Method | Endpoint            | Description         |
|--------|---------------------|---------------------|
| GET    | /api/dashboard/stats | Overall statistics |
