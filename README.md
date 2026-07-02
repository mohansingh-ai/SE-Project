# TalentAI — AI-Powered Semantic Recruitment System

TalentAI is a full-stack, serverless recruitment system designed to streamline candidate sourcing and matching using Gemini AI. It automatically extracts details from PDF/DOCX resumes, matches applicants to job postings using semantic analysis, and displays them on role-based portals for Recruiters and Candidates.

---

## ⚡ Live Demo & Credentials
* **Live App URL**: [http://localhost:5173](http://localhost:5173) (Run `npm run dev` to start)
* **Demo Recruiter Account**:
  - **Email**: `recruiter_success@example.com`
  - **Password**: `password123`

---

## ✨ Features
1. **AI Resume Parsing**: Drag & drop any PDF or Word DOCX resume to instantly extract personal data, professional summary, education history, work history, and skills list in structural JSON using Gemini AI.
2. **Semantic Matching Engine**: Compares applicant profiles against job requirements and scores them (out of 100%) based on semantic proximity (e.g. "ReactJS" == "React.js") instead of simple keyword overlap.
3. **Recruiter Dashboard**: Lists job postings, applicant counts, and a ranked leader board of candidates per job sortable by score.
4. **Interactive Comparison Drawer**: Provides a side-by-side match breakdown showing matched skills, missing skills, and detailed AI feedback.
5. **Candidate Tracker**: Enables candidates to track applications, read status updates, and view specific upskilling suggestions.
6. **Real-time Notifications**: Triggers in-app alerts on status updates and new applications via live Firestore listeners.
7. **Base64 Storage Fallback**: Bypasses storage payment configurations on free Spark plans by serializing resumes to local Base64 strings.

---

## 🛠 Tech Stack
- **Frontend Framework**: React 18 (Vite)
- **Styling**: Vanilla CSS (Premium Dark Mode & Glassmorphism Design System)
- **Database & Auth**: Cloud Firestore, Firebase Authentication
- **AI Core**: Google Gemini 2.5 Flash API
- **Parsers**: PDFjs-dist, Mammoth.js
- **Routing**: React Router Dom v6

---

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "SE Project"
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment variables (`.env`)**:
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key_from_ai_studio
   ```

4. **Launch Dev Server**:
   ```bash
   npm run dev
   ```

5. **Deploy Security Rules (Optional)**:
   ```bash
   npx firebase deploy --only firestore
   ```

---

## 🤖 AI Tools Used
- **Claude / Gemini (Antigravity Code Assistant)**: Assisted with scaffolding React router, configuring Firestore real-time sub-portals, writing client-side PDF/DOCX extractors, designing security rules, and setting up the local Base64 uploader.
- **Google Gemini 2.5 Flash**: Orchestrated JSON parsing structure and semantic match algorithms.

---

## 📁 Repository Structure
```
d:\SE Project\
├── src/
│   ├── components/       # UI Components (Navbar, Uploader, Score bar)
│   ├── context/          # Context states (AuthContext)
│   ├── pages/            # App portals (Recruiter, Candidate, Landing)
│   ├── firebase.js       # Firebase initialization
│   ├── gemini.js         # API integration rules
│   ├── index.css         # Global styling tokens
│   └── utils.js          # Helpers (Base64 openers)
├── database/
│   └── schema_design.md  # Database fields and indexes specifications
├── docs/
│   ├── user_manual.md    # Operating guide for users
│   └── installation.md   # Setup guide
├── report/
│   └── sars_and_design_report.md # Comprehensive software engineering report
├── testing/
│   └── test_cases.md     # Testing strategy & case matrix
├── cors.json             # CORS policy file
├── firestore.rules       # Security rules configuration
└── firestore.indexes.json # Database composite indexes
```
