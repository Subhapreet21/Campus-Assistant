# Campus OS - AI-Powered University Assistant

**Campus OS** is a comprehensive, multimodal web application designed to streamline the university experience for students and faculty. It integrates academic management (Timetable, Events) with an intelligent AI Assistant capable of answering context-aware queries about the university handbook and personal schedules.

---

## 🚀 Key Features

### 1. 🤖 AI Assistant (RAG-Powered)
*   **Contextual Intelligence**: Uses **Retrieval-Augmented Generation (RAG)** to answer questions based on the official University Handbook.
*   **Vector Search**: Ingests markdown documents into **Supabase Vector Store** using OpenAI Embeddings.
*   **Multimodal Input**: Supports **Voice Commands** (Web Speech API) and **Image Analysis** (for context-aware queries).
*   **Smart Suggestions**: Dynamic prompt chips (e.g., "Next Class?", "Exam Schedule?") based on user context.

### 2. 📅 Shared Timetable Architecture
*   **Group-Based Scheduling**: Instead of personal events, classes are assigned to **Department + Year + Section** groups.
*   **Role-Based Access**:
    *   **Students**: View-only access strictly filtered to their enrolled section (e.g., CSE - Year 4 - Section A).
    *   **Faculty**: View & Manage access for their assigned Department.
    *   **Admins**: Global access to all departments and sections ("God Mode").
*   **Dashboard Sync**: The "Next Class" widget on the dashboard automatically resolves the user's profile and fetches the correct upcoming class from the shared schedule.

### 3. 🛡️ Role-Based Access Control (RBAC)
*   **Authentication**: Secure login via **Clerk** (Google/Email).
*   **Profile Sync**: Auto-synchronization between Clerk metadata and Supabase `profiles` table.
*   **Onboarding Flow**:
    *   New users are guided through a role selection wizard.
    *   **Students**: Select Dept/Year/Section.
    *   **Faculty/Admin**: Enter secure Access Codes to verify privileges.

### 4. 📢 Events & Notices
*   **Real-Time Updates**: Centralized board for campus news and events.
*   **Role-Restricted Posting**: Only Admins (and Dept Heads) can post or edit notices.
*   **Smart Formatting**: Auto-formatted dates and locations.

### 5. 🔔 Reminders & Task Management
*   **Personalized Todo List**: Users can create private reminders.
*   **Cross-Module Integration**: Pending tasks appear in the Assistant Sidebar and Dashboard.

---

## 🏗️ Architecture & Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: TailwindCSS, Framer Motion (for animations)
*   **State Management**: React Context (Auth), Local State
*   **UI Components**: Lucide Icons, Custom Glassmorphism Design System

### Backend
*   **Runtime**: Node.js / Express
*   **AI/ML**: LangChain, Google Gemini (via API), OpenAI Embeddings
*   **Database**: Supabase (PostgreSQL + pgvector)
*   **Auth Middleware**: Clerk SDK (`RequireAuth`)

### Database Schema (Supabase)
*   **`profiles`**: Stores user role (`student`, `faculty`, `admin`) and academic details (`department`, `year`, `section`).
*   **`timetables`**: Stores class schedules linked to groups (`department`, `year`, `section`) rather than individuals.
*   **`kb_articles` & `kb_embeddings`**: Stores the University Handbook chunks and their vector representations for AI search.
*   **`events_notices`**: Public campus events.
*   **`reminders`**: Private user tasks.

---

## 🛠️ Methodology & Integration

### The Onboarding & Profile Sync Pipeline
1.  **Sign Up**: User creates an account via Clerk.
2.  **Onboarding**: The `/onboarding` page detects a new user and prompts for details.
3.  **Sync**: The `authController.ts` updates Supabase `profiles` with the selected Role and Academic Group.
4.  **Result**: The Dashboard and Timetable immediately reflect the user's specific schedule without manual setup.

### The RAG Pipeline (Retrieval-Augmented Generation)
1.  **Ingestion**: `seedHandbook.ts` reads `university_handbook.md`, splits it into chunks, generates embeddings, and stores them in `kb_embeddings`.
2.  **Query**: When a user asks a question in the **Assistant** page:
    *   The backend turns the question into a vector.
    *   Supabase performs a similarity search (`match_kb_articles` RPC).
    *   Relevant handbook sections are retrieved.
    *   The LLM generates an answer using ONLY the retrieved context.

---

## ⚡ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   Supabase Account (with pgvector enabled)
*   Clerk Account

### 1. Clone & Install
```bash
git clone <repo_url>
cd Campus-Assistant

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Environment Variables (.env)
**Backend (`backend/.env`)**
```env
PORT=8000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
GEMINI_API_KEY=your_gemini_key
ADMIN_SECRET=admin123
FACULTY_SECRET=faculty123
```

**Frontend (`frontend/.env`)**
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

### 3. Database Setup
Run the SQL scripts in `supabase/schema.sql` inside the Supabase SQL Editor to create tables and functions.

### 4. Run Application
**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to launch Campus OS.
