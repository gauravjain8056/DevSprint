<div align="center">
  <img src="https://via.placeholder.com/1200x400/0f172a/14b8a6?text=DevSprint+-+AI+Powered+Project+Management" alt="DevSprint Banner" width="100%" />

  <h1>DevSprint</h1>
  <p><strong>Intelligent Project Management & Kanban Software powered by Google Gemini</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

##  Overview

**DevSprint** is a production-grade, full-stack Project Management application built for modern engineering teams. It seamlessly combines highly performant Kanban boards with intelligent workflow assistance. 

At the core of DevSprint is its **Gemini-powered AI Assistant**. Unlike standard chatbots, the AI leverages the **Model Context Protocol (MCP)** to actively execute operations in your workspace—creating tasks, updating statuses, and summarizing project timelines completely autonomously based on your prompts.

## Key Features

-  **Robust Authentication:** Secure JWT-based HttpOnly cookie authentication and `bcrypt` password hashing.
-  **Fractional Indexing Kanban:** High-performance Drag-and-Drop task management utilizing fractional floating-point indexing to eliminate heavy database re-orders.
-  **AI Assistant (Gemini MCP):** Interact with a context-aware AI that can autonomously call backend services to create, manage, and summarize project tasks.
-  **Redis Caching & Rate Limiting:** Global rate limiters (100req/min) and high-speed memory caching for Dashboards and Kanban states.
-  **Cloudinary File Attachments:** Attach, preview, and manage assets directly inside tasks.
-  **Role-Based Access Control (RBAC):** Strict `OWNER` and `MEMBER` project boundaries enforced at the controller level.

## Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Drag & Drop:** `@hello-pangea/dnd`
- **Network:** Axios

### Backend
- **Framework:** Node.js / Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Caching:** Redis
- **Storage:** Cloudinary
- **AI Engine:** Google Gemini (1.5 Pro)

---

##  Architecture

```mermaid
graph TD;
    Client[React Frontend] -->|HTTPS / API Req| NGINX[Nginx Reverse Proxy];
    NGINX -->|/api/v1| Node[Express Backend API];
    
    Node -->|JWT Verify| AuthMiddleware;
    Node -->|Token Bucket| Redis[Redis Cache & Rate Limiting];
    
    AuthMiddleware --> ControllerLayer[Controllers];
    ControllerLayer --> ServiceLayer[Services];
    
    ServiceLayer -->|Prisma Client| PG[(PostgreSQL)];
    ServiceLayer -->|Upload/Delete| Cloudinary[(Cloudinary)];
    
    ServiceLayer -.->|MCP Tool Calling| Gemini[Google Gemini AI];
    Gemini -.->|Execute Task Updates| ServiceLayer;
```

##  Folder Structure

```text
c:\DevSprint
├── frontend/                 # React Vite Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable UI elements (Modals, Sidebars, AI Panel)
│   │   ├── context/          # React Context (AuthContext)
│   │   ├── pages/            # View Routes (Dashboard, Kanban, Profile)
│   │   ├── services/         # Axios API Handlers
│   │   └── types/            # TypeScript Interfaces
│   ├── Dockerfile
│   └── nginx.conf            # Nginx proxy mapping for Docker
├── setup/                    # Node.js Express Backend
│   ├── prisma/               # Database Schema & Migrations
│   ├── src/
│   │   ├── controllers/      # Manual Data Validation & Routing Logic
│   │   ├── middlewares/      # Auth & Redis Rate Limiters
│   │   ├── routes/           # Express Routers
│   │   ├── services/         # Business Logic & DB Interactions
│   │   └── utils/            # ApiErrors, Cloudinary Handlers
│   └── Dockerfile
├── docker-compose.yml        # Multi-container orchestration
└── README.md
```

---

##  Environment Variables

Create a `.env` file in the root `setup` directory with the following configuration:

```env
# Server
PORT=8000
CORS_ORIGIN=http://localhost

# Database (PostgreSQL & Redis)
DATABASE_URL=postgresql://postgres:password@localhost:5432/devsprint?schema=public
REDIS_URL=redis://localhost:6379

# JWT Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
REFRESH_TOKEN_EXPIRY=7d

# Third Party
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI
GEMINI_API_KEY=your_google_gemini_api_key
```

---

##  Docker Setup (Recommended)

DevSprint is built with a production-ready Docker Compose configuration.

1. Ensure Docker Desktop is running.
2. In the root directory (`c:\DevSprint`), run:
   ```bash
   docker-compose up --build
   ```
3. Docker will automatically:
   - Spin up PostgreSQL and Redis.
   - Wait for databases to become healthy.
   - Run Prisma migrations (`npx prisma migrate deploy`).
   - Start the Node.js API on port `8000`.
   - Build and serve the React app via Nginx on port `80`.

**Access the application at:** `http://localhost`

---

##  Local Development

If you prefer to run the application locally without Docker:

### 1. Database Setup
Ensure you have PostgreSQL and Redis instances running on your machine. Update the `.env` file accordingly.

### 2. Backend
```bash
cd setup
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

##  AI Features (Gemini + MCP)

DevSprint utilizes **Google's Gemini 1.5 Pro** model strictly via the **Model Context Protocol (MCP)**. 

- **Autonomous Execution:** The AI never accesses the database directly. Instead, it securely maps its decisions to Backend Service Functions (`TaskService.createTask`, etc.), ensuring all AI operations strictly obey your project's RBAC parameters.
- **Actions:** 
  -  Generate structured subtasks
  -  Summarize project statuses
  -  Estimate sprint timelines

---


##  Future Improvements

- **WebSockets (Socket.io):** Real-time collaborative syncing for Kanban board movements.
- **Advanced AI Forecasting:** Utilizing historical task velocity to predict sprint completion dates.
- **GitHub Integration:** Automatic PR-to-Task linking and commit tracking.

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
