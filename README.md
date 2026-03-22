# Placement Point

A full-stack web application for college placement management and technical interview preparation. It combines a job portal with AI-powered mock interviews, a collaborative code editor, and a practice problem platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS, React Router 7 |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Real-time | Socket.io |
| Code Editor | CodeMirror (C++, Python, JavaScript) |
| AI | Google Gemini 2.5 Flash |
| Code Execution | Judge0 API (via RapidAPI) |
| File Storage | Firebase Storage |
| Sheets Integration | Google Sheets API |

## Features

### Job Portal
- Browse and search jobs with filters (title, department, GPA)
- Admin can post jobs with PDF job descriptions and eligibility criteria
- Application status tracking via Google Sheets integration
- Visual hiring process roadmap (Applied → OA → Interview → HR → Offer)

### AI Mock Interview
- Upload resume and job description PDFs
- AI generates tailored interview questions using Gemini
- Webcam + microphone recording with speech-to-text
- 2-minute answer timer per question
- AI-generated feedback on all answers

### Code Practice
- Browse practice problems by difficulty (Easy / Medium / Hard)
- Solve problems in C++, Python, or JavaScript with syntax highlighting
- Run code against test cases via Judge0
- Auto-save drafts and track solutions

### Real-time Collaborative Coding
- Create rooms and share invite links
- Real-time code synchronization between users via Socket.io

### Admin Dashboard
- Post jobs with PDF upload and eligibility settings
- Create practice questions with test cases

## Project Structure

```
placement-point/
├── client/                   # React frontend
│   ├── src/
│   │   ├── pages/            # All page components
│   │   ├── components/       # Shared components (Navbar, Editor)
│   │   ├── context/          # Auth context (Firebase)
│   │   ├── config/           # API base URL config
│   │   └── firebase.js       # Firebase initialization
│   └── package.json
│
└── server/                   # Express backend
    ├── routes/               # API route handlers
    ├── models/               # Mongoose schemas (User, Job, Question, Solution)
    ├── middleware/            # Firebase token verification
    ├── config/               # Firebase Admin SDK setup
    ├── google/               # Google Sheets API helper
    ├── socket.js             # Socket.io real-time sync
    ├── server.js             # Entry point
    └── package.json
```

## Prerequisites

- **Node.js** (v18 or later)
- **MongoDB** instance (local or Atlas)
- **Firebase** project with Authentication and Storage enabled
- **Google Cloud** project with Sheets API and Generative AI (Gemini) API enabled
- **RapidAPI** account with Judge0 CE subscription

## Environment Variables

### Client (`client/.env`)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API=<your-firebase-api-key>
```

### Server (`server/.env`)

```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=<your-gemini-api-key>
RAPIDAPI_KEY=<your-rapidapi-key>
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```

Additionally, place the following service account JSON files in the server directory (these are git-ignored):

- `server/config/serviceAccountKey.json` — Firebase Admin SDK service account
- `server/google/googleServiceAccount.json` — Google Sheets API service account

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/placement-point.git
cd placement-point
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure environment variables

Create `.env` files in both `client/` and `server/` directories using the templates above.

### 4. Start the development servers

**Terminal 1 — Server:**

```bash
cd server
npm run dev
```

The server starts on `http://localhost:5000` with auto-reload via nodemon.

**Terminal 2 — Client:**

```bash
cd client
npm start
```

The client starts on `http://localhost:3000`.

## Usage

### As a Student
1. Register or sign in with Google
2. Complete your profile (GPA, department, batch)
3. Browse jobs on the dashboard or use search filters
4. View job details, check eligibility, and track application status
5. Practice coding problems in the built-in editor
6. Start an AI mock interview by uploading your resume and a job description
7. Collaborate in real-time by creating or joining a coding room

### As an Admin
1. Sign in with an admin account
2. Post new jobs with PDF descriptions and eligibility criteria
3. Add practice questions with test cases

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| POST | `/api/user/save` | Create/update profile |
| GET | `/api/user/check` | Check if profile exists |
| GET | `/api/job/all` | List all jobs |
| GET | `/api/job/:id` | Get job by ID |
| POST | `/api/job/post` | Post a new job (admin) |
| POST | `/api/job/apply/:id` | Apply to a job |
| POST | `/api/job/status` | Check application status |
| GET | `/api/questions` | List all questions |
| POST | `/api/questions` | Create a question |
| GET | `/api/questions/:id` | Get question by ID |
| POST | `/api/run` | Execute code via Judge0 |
| POST | `/api/interview/generate-questions` | Generate AI interview questions |
| POST | `/api/interview/generate-feedback` | Generate AI feedback |
| POST | `/api/solutions` | Save a solution |
| GET | `/api/solutions/:questionId/:userId` | Get a solution |
| PUT | `/api/solutions/:id` | Update a solution |

## Deployment

- **Backend**: Deployed on [Render](https://render.com). Set all server environment variables in the Render dashboard.
- **Frontend**: Can be deployed on [Vercel](https://vercel.com) or [Netlify](https://netlify.com). Set `REACT_APP_API_URL` to your deployed server URL.
- Remember to update `CLIENT_URL` on the server to match your deployed frontend URL for CORS.

## License

This project is for educational purposes.
