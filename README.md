## AI-Powered Job Tracker

A small fullstack app to track job applications, visualize your pipeline, store resume text, and get AI-powered suggestions for your job search.

### Features

- **Add & track job applications**: Company, role, location, applied date, job link, and notes.
- **Status tracking**: Quickly update between Applied / Interview / Offer / Rejected.
- **Analytics charts**: See counts per status and applications over time.
- **Resume storage**: Paste your resume text and keep it in the browser (localStorage).
- **AI suggestions (OpenAI)**: Ask for tailored resume and job-search suggestions based on your resume + an optional job description.

### Prerequisites

- **Node.js** 18+ (recommended)

### Setup

1. **Backend (API + OpenAI)**

   ```bash
   cd backend
   copy .env.example .env   # Or create .env manually
   ```

   Edit `.env` and set:

   ```bash
   OPENAI_API_KEY=your_real_openai_api_key
   PORT=5000
   ```

   Then install and start:

   ```bash
   npm install
   npm run dev
   ```

   The backend will run at `http://localhost:5000` and expose `POST /api/ai-suggestions`.

2. **Frontend (React + Vite)**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Vite will print a local dev URL (usually `http://localhost:5173`). Open it in the browser.

### Using the app

- **Add applications** in the "Add Application" panel, then see them listed with status controls.
- **Update statuses** from the dropdown next to each application.
- **See analytics** in the right-hand charts (by status and by month).
- **Paste your resume** and (optionally) a job description, then click **"Get AI Suggestions"**.

All job applications and resume text are stored in the browser using `localStorage`, so they persist per browser and machine but are not synced across devices.

