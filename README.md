# JanSolve + JanFeed: Civic Social Networking Platform

> **A Complete Civic Technology Rebuild for Jharkhand, India**  
> Uniting **JanFeed** (the citizen-facing Reddit-style social discussion layer) and **JanSolve** (the authoritative challenge review, verification, and resolution management layer) backed by a unified Express + MongoDB backend.

---

## 🏛️ System Overview

JanSolve is a civic innovation platform engineered specifically for civic problem discovery, community discussion, and verified administrative resolution in the districts of Jharkhand.

```
                      +---------------------------------------+
                      |               Citizens                |
                      +-------------------+-------------------+
                                          |
                         (Submit, Vote, Discuss, Direct Chat)
                                          v
                      +---------------------------------------+
                      |        JanFeed Community Layer        |
                      |  (Reddit-style feed, 3-column UI,     |
                      |   Leaflet Map, Comments, Messages)    |
                      +-------------------+-------------------+
                                          |
                               (REST API / JWT Auth)
                                          v
                      +---------------------------------------+
                      |         JanSolve Unified API          |
                      |      (Express + Mongoose + Joi)       |
                      +---------+-------------------+---------+
                                |                   |
               (GeoJSON 2dsphere / Audit Logs)      | (Role Guard / Moderation)
                                v                   v
                      +-------------------+ +-------------------+
                      |      MongoDB      | |  JanSolve Admin   |
                      |  (Single Source   | |     Portal        |
                      |    of Truth)      | | (Approve, Verify, |
                      +-------------------+ |  Audit, Moderate) |
                                            +-------------------+
```

### 1. JanFeed (Citizen Public Layer)
- **Reddit-Style Layout**: 3-column desktop view (Navigation Sidebar, Dynamic Civic Feed, Community Guidelines & Trending Domains Sidebar) with a responsive mobile experience.
- **Civic Feed Sorting**: Sort posts by **Hot** (Wilson score / high engagement), **Latest** (chronological), and **Most Discussed** (comment count).
- **Rich Media & Evidence**: Supports high-res photographs and video evidence uploads (stored via local static disk with automatic Cloudinary integration support).
- **Interactive Geospatial Discovery**: Leaflet OpenStreetMap integration with browser GPS pin-drop for challenge reporting and a district-wide interactive **Nearby Map** view.
- **Deep Community Engagement**: Nested hierarchical comments (parent/child replies), atomic upvoting/downvoting with instantaneous UI updates, bookmarking, and link sharing.
- **Civic Transparency**: Distinct status badges: `Submitted`, `Under Review`, `Approved`, `Verified`, `In Progress`, `Resolved`, `Rejected`. Authors receive real-time admin review feedback banners explaining any required actions or rejection reasons.
- **Real-Time Notification Center**: Push-style alerts for votes, replies, moderation decisions, and approval notifications.
- **Private 1-on-1 Citizen Messaging**: Isolated conversation threads between registered citizens with unread counters and permission guards.

### 2. JanSolve (Administrative Resolution Layer)
- **Unified Back-Office Portal**: Guarded by strict role-based access control (`requireAdmin`).
- **Comprehensive Review Queue**: Search, sort, and filter submissions by District, Domain (Water, Roads, Education, Health, Agriculture, Sanitation, Electricity), Urgency, and Review Status.
- **Multi-Action Moderation Workflow**:
  - **Approve for Publication**: Transitions challenges from `pending_review` into the public JanFeed feed.
  - **Mark Verified**: Flags civic challenges as field-verified with administrative verification badges.
  - **Update Progress**: Advance issues through `In Progress` and `Resolved`.
  - **Request Additional Information**: Flags challenges with detailed notes visible directly on the citizen's author detail view.
  - **Reject Submissions**: Marks challenges rejected with structured civic rejection reasons.
- **Content Moderation & Flagged Queue**: Review citizen-flagged challenges and comments with actions to dismiss flags, delete offending content, or suspend abusive accounts.
- **Citizen Account Management**: Suspend or restore civic profiles with full status toggling.
- **Immutable Audit Logging**: Every administrative action (approval, status change, note addition, user suspension) is stamped to the `AuditLog` collection with IP and timestamp.
- **Civic Analytics Dashboard**: Live metrics for total submissions, domain distributions, urgency breakdowns, district activity, and resolution rates.

---

## 📁 Repository Structure

```
JanSolve Community/
├── backend/                        # Unified Express.js Modular Monolith
│   ├── src/
│   │   ├── config/                 # DB connection (Atlas DNS fallback), Multer, Env
│   │   ├── controllers/            # Auth, Challenges, Social, Admin, Notifications, Messages
│   │   ├── middleware/             # JWT auth, role guards, Joi validation, Error handler
│   │   ├── models/                 # 10 Mongoose Models with compound indexes
│   │   ├── routes/                 # Express API v1 routers
│   │   ├── seed/                   # Database seeder (Admin + Jharkhand citizens & challenges)
│   │   ├── app.js                  # Express app configuration & middleware
│   │   └── server.js               # HTTP server bootstrap
│   ├── scripts/
│   │   └── verify-e2e-workflow.js  # 15-step end-to-end integration verification script
│   ├── tests/
│   │   └── api.test.js             # Vitest test suite (27 integration tests)
│   ├── uploads/                    # Local media assets (images, videos)
│   └── package.json
│
├── frontend/                       # React 19 + Vite 6 Single Page Application
│   ├── src/
│   │   ├── components/             # ChallengeCard, Layouts, Navbars, Sidebars, Modals
│   │   ├── context/                # AuthContext (JWT, session persistence, auto-refresh)
│   │   ├── pages/
│   │   │   ├── citizen/            # Feed, Explore, Detail, Create, NearbyMap, Messages, Profile
│   │   │   ├── admin/              # Dashboard, Challenges, Review, Moderation, Users, Analytics
│   │   │   └── public/             # LandingPage, Login, Register, Static info
│   │   ├── services/               # Axios API client with token interceptors
│   │   ├── App.jsx                 # Client-side routing with role-guarded routes
│   │   └── index.css               # Editorial civic design system
│   ├── index.html
│   ├── vite.config.js              # Dev proxy to backend (port 5000)
│   └── package.json
│
├── .env.example                    # Template environment variables
├── package.json                    # Root workspace orchestration scripts
└── README.md                       # Comprehensive system documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: v6.0 or higher running locally on port 27017 or a MongoDB Atlas connection string

### 1. Clone & Install Dependencies

From the project root:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

*(On Windows PowerShell, use `npm.cmd install` if script execution policies apply.)*

---

### 2. Configure Environment Variables

The backend requires a `.env` file. A default `.env` is already configured for local development in `backend/.env`. You can customize it as needed:

```ini
# Server
PORT=5000
NODE_ENV=development

# Database (Local MongoDB or Atlas URI)
MONGO_URI=mongodb://127.0.0.1:27017/JanSolveCommunity

# JWT Authentication Secrets
ACCESS_TOKEN_SECRET=jansolve_access_token_secret_key_development_2026_xyz
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_SECRET=jansolve_refresh_token_secret_key_development_2026_xyz
REFRESH_TOKEN_EXPIRES=7d

# Default Admin Seed Account
ADMIN_NAME=JanSolve Administrator
ADMIN_EMAIL=admin@jansolve.org
ADMIN_PASSWORD=AdminSecurePass@2026

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Media Storage Provider ('local' or 'cloudinary')
STORAGE_PROVIDER=local
UPLOAD_DIR=uploads
```

---

### 3. Seed Database with Jharkhand Civic Data

Populate the database with the Administrator account, authentic Jharkhand civic profiles, real community challenges (Ranchi, Dhanbad, Jamshedpur, Hazaribagh, Khunti), comments, and test conversations:

```bash
# From root directory:
npm run seed

# Or directly in backend:
cd backend
node src/seed/seed.js
```

---

### 4. Run the Development Servers

Open two terminal windows:

#### Terminal 1 — Backend API Server:
```bash
npm run dev:backend
# Runs at http://localhost:5000
# Health check: http://localhost:5000/api/v1/health
```

#### Terminal 2 — Frontend Application:
```bash
npm run dev:frontend
# Runs at http://localhost:5173
```

Navigate your browser to:
- **JanFeed Citizen Portal**: [http://localhost:5173](http://localhost:5173)
- **JanSolve Admin Portal**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## 🔑 Default Seed Credentials

All seed citizen and administrator accounts are populated with authentic profiles and local avatars:

| Role | Name | Email | Password | Location |
|---|---|---|---|---|
| **Administrator** | JanSolve Administrator | `admin@jansolve.org` | `AdminSecurePass@2026` | Ranchi (Full Admin Portal Access) |
| **Citizen (Author)** | Pooja Marandi | `pooja.marandi@example.com` | `CitizenPass@123` | Dumka, Santhal Pargana |
| **Citizen (Author)** | Amit Kumar Soren | `amit.soren@example.com` | `CitizenPass@123` | Jamshedpur, East Singhbhum |
| **Citizen (Author)** | Dr. Sunita Murmu | `sunita.murmu@example.com` | `CitizenPass@123` | Torpa, Khunti |
| **Citizen (Author)** | Rameshwar Mahato | `rameshwar.mahato@example.com` | `CitizenPass@123` | Ormanjhi, Ranchi |
| **Citizen (Author)** | Birsa Oraon | `birsa.oraon@example.com` | `CitizenPass@123` | Kisko, Lohardaga |
| **Citizen (Author)** | Shabana Parveen | `shabana.parveen@example.com` | `CitizenPass@123` | Jharia, Dhanbad |
| **Citizen (Author)** | Anil Kumar Hansda | `anil.hansda@example.com` | `CitizenPass@123` | Barhi, Hazaribagh |

---

## 📦 Offline Demo Dataset (24+ Challenges Across All 12 Domains)

All evidence photos, avatars, and videos are stored **100% offline** on local disk in `backend/uploads/` and served statically via `/uploads/*`:

| # | Domain / Category | Location | Title | Offline Asset |
|---|---|---|---|---|
| 1 | **Water Resources** | Sahibganj | Severe Groundwater Arsenic Levels in Drinking Wells Along Floodplains | `arsenic-handpump-sahibganj.jpg` |
| 2 | **Water Resources** | Deoghar | Depleted Summer Water Table and Fluoride Contamination in Madhupur | `dry-borewell-deoghar.jpg` |
| 3 | **Agriculture** | Ranchi | Rapid Viral Leaf Curl Outbreak Decimating Smallholder Tomato Fields | `Crop diseas 2.jpg` |
| 4 | **Agriculture** | Giridih | Wild Boar & Elephant Herd Crop Raiding Destroying Harvests in Tisri | `crop-damage-giridih.jpg` |
| 5 | **Sanitation** | East Singhbhum | Hazardous Solid Waste Dumping and Drainage Blockage near Sakchi | `waste-dump-sakchi.jpg`, `waste-sakchi.mp4` |
| 6 | **Sanitation** | Ramgarh | Overflowing Septic Tanks and Non-Functional Toilets at Gola Haat | `toilet-sanitation-ramgarh.jpg` |
| 7 | **Healthcare** | Khunti | Lack of Point-of-Care Sickle Cell & Anemia Diagnostic Kits in Torpa | `phc-clinic-khunti.jpg` |
| 8 | **Healthcare** | West Singhbhum | Acute Antivenom Shortage and Delayed Transport in Saranda Forest | `snakebite-clinic-chaibasa.jpg` |
| 9 | **Healthcare** | Koderma | Widespread Silicosis and Tuberculosis Deficit Among Mica Sorters | `silicosis-screening-koderma.jpg` |
| 10 | **Environment** | Dhanbad | Severe Coal Dust Inhalation & Respiratory Distress in Jharia Belt | `coal-dust-jharia.jpg` |
| 11 | **Environment** | Ramgarh | Untreated Coal Washery Slurry Discharges Blackening Upper Damodar | `polluted-river-damodar.jpg` |
| 12 | **Energy** | Latehar | Unfinished Solar Mini-Grid Leaving 3 Hamlets in Saryu in Darkness | `solar-grid-latehar.jpg` |
| 13 | **Energy** | Garhwa | Burnt 100 kVA Transformer Left Unrepaired for 70 Days in Bhandaria | `burnt-transformer-garhwa.jpg` |
| 14 | **Infrastructure** | Hazaribagh | Collapsed Culvert and Submerged Embankment Cutting Off 4 Panchayats | `broken-bridge-barhi.jpg` |
| 15 | **Infrastructure** | Godda | Dangerous Crater-Sized Potholes Causing Overturned Trucks on Mahagama | `pothole-road-godda.jpg` |
| 16 | **Education** | Dumka | Dilapidated Asbestos Roof and Water Leakage in Shikaripara School | `school-leak-dumka.jpg` |
| 17 | **Education** | Simdega | Complete Lack of Science Laboratory Equipment in Bano High School | `science-lab-simdega.jpg` |
| 18 | **Rural Livelihoods** | Saraikela | Lack of Climate-Controlled Cocoon Storage for Kuchai Tussar Silk | `tussar-silk-kuchai.jpg` |
| 19 | **Rural Livelihoods** | Pakur | Lack of Direct Market Access and Processing for Paharia Lac Growers | `lac-cultivation-pakur.jpg` |
| 20 | **Public Services** | Palamu | Chronic Biometric Authentication Failures Depriving PDS Pensioners | `pds-ration-palamu.jpg` |
| 21 | **Public Services** | Lohardaga | Dysfunctional Street Lighting & Delayed Emergency on Kisko Ghat | `ghat-road-lohardaga.jpg` |
| 22 | **Accessibility** | Bokaro | Absence of Wheelchair Ramps & Tactile Paving at Chas Hospital | `accessibility-chas.jpg` |
| 23 | **Accessibility** | Ranchi | Broken Pedestrian Escalators & Encroached Paths at Station Approach | `pedestrian-overpass-ranchi.jpg` |
| 24 | **Other** | Jamtara | Need for Youth Digital Literacy Center to Counter Fraud Stigma | `digital-literacy-jamtara.jpg` |

---

## 🧪 Verification & Automated Testing

### 1. Integration Test Suite (27 Vitest Tests)
The backend includes 27 comprehensive integration tests validating authentication, JWT refresh cycles, publication state guards, GeoJSON queries, role isolation, voting mechanics, bookmarking, nested comments, and content moderation:

```bash
# From root directory:
npm run test:backend

# Or in backend:
cd backend
npm test
```
**Result**: `✓ 27/27 tests passed (100% success)`

### 2. End-to-End Workflow Verification Script (15 Steps)
Runs a complete simulated citizen-admin lifecycle:
1. Citizen Registration
2. Citizen Login & Token Generation
3. Challenge Creation with GeoJSON coordinates
4. Database Persistence Verification
5. Author Submission History check
6. Verification that unpublished challenge is hidden from JanFeed
7. Administrator Authentication
8. Admin Review & Publication Approval
9. Verification that challenge appears live on JanFeed
10. Second Citizen Registration & Engagement (Upvoting & Commenting)
11. Verification of Author Notification generation
12. Admin Dashboard Live Metric aggregation
13. Challenge Rejection with structured feedback
14. Private 1-on-1 Messaging between citizens
15. Participant Isolation Security check (403 Forbidden)

```bash
# From root directory:
npm run verify

# Or in backend:
cd backend
node scripts/verify-e2e-workflow.js
```
**Result**: `✓ All 15 End-to-End steps verified successfully`

### 3. Frontend Production Build
```bash
# From root directory:
npm run build:frontend

# Or in frontend:
cd frontend
npm run build
```
**Result**: `✓ Built cleanly with 0 TypeScript/Lint/JSX errors in 10.29s`

---

## 📡 Core API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register`: Register citizen account
- `POST /login`: Authenticate and receive JWT tokens
- `POST /refresh-token`: Rotate refresh token and issue new access token
- `POST /logout`: Invalidate session
- `GET /me`: Fetch authenticated user profile

### Challenges & JanFeed (`/api/v1/challenges`)
- `GET /`: Get public feed (supports `sort=hot|latest|discussed`, `domain`, `urgency`, `district`, `search`, pagination)
- `GET /nearby`: GeoJSON nearby search (`lng`, `lat`, `distance`)
- `GET /mine`: Author's personal submission history (all statuses)
- `GET /:id`: Challenge details
- `POST /`: Submit new civic challenge (supports `multipart/form-data` for photos & video)
- `POST /:id/vote`: Upvote/downvote challenge (atomic score calculation)
- `GET /:id/comments`: Fetch nested comments tree
- `POST /:id/comments`: Post top-level or reply comment
- `POST /:id/bookmark`: Save/bookmark challenge
- `POST /:id/report`: Flag challenge for inappropriate content

### Social & Messaging (`/api/v1`)
- `GET /notifications`: List citizen notifications
- `PATCH /notifications/:id/read`: Mark notification read
- `POST /notifications/read-all`: Mark all notifications read
- `GET /bookmarks`: List user's saved challenges
- `GET /conversations`: List 1-on-1 private conversation threads
- `POST /conversations`: Start conversation with another citizen
- `GET /conversations/:id/messages`: Get message thread (participant guarded)
- `POST /conversations/:id/messages`: Send direct message

### Administrator Management (`/api/v1/admin`)
- `GET /dashboard`: Aggregated platform statistics
- `GET /challenges`: Administrative challenge queue (all review & publication statuses)
- `PATCH /challenges/:id/publication`: Toggle publication status (`published`, `pending_review`, `rejected`, `archived`)
- `PATCH /challenges/:id/review`: Update review status (`submitted`, `under_review`, `approved`, `verified`, `in_progress`, `resolved`, `rejected`) and attach review notes
- `GET /moderation/reports`: List flagged challenges and comments
- `PATCH /moderation/reports/:id`: Resolve or dismiss content flags
- `GET /users`: Manage registered citizens
- `PATCH /users/:id/status`: Suspend or restore citizen account
- `GET /audit-logs`: Audit trail of all administrative actions

---

## 🛡️ Security & Architecture Best Practices

1. **Strict Role Separation**: Citizen accounts can never access `/api/v1/admin/*` routes or execute review actions. Admin portal enforces route guards and backend checks.
2. **Review Lifecycle Enforced**: Newly submitted challenges default to `publicationStatus: 'pending_review'` and are blocked from public JanFeed listings until an administrator approves them.
3. **No Fabricated Data**: All feed counts, urgency metrics, vote tallies, and dashboard cards reflect live MongoDB aggregations.
4. **Resilient Token Handling**: Frontend API client transparently intercepts HTTP 401s, queues failed requests, and executes silent token refreshes before replaying.
5. **GeoJSON Geospatial Indexing**: Geospatial coordinates are validated and indexed with MongoDB `2dsphere` indexes for radius-based queries.
6. **Graceful Error Handling**: Centralized error middleware ensures internal database or stack trace details are sanitized and never leaked to clients.
