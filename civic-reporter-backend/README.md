# Civic Issue Reporter — Backend

Crowdsourced civic issue reporting API (MERN stack). Citizens report issues (potholes,
streetlights, garbage, water, electrical hazards) with photo + geolocation; authorities
track and resolve them. Includes emergency flagging, duplicate detection, and
auto-escalation for unresolved emergencies.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your real values:
   ```bash
   cp .env.example .env
   ```
   You need:
   - A MongoDB Atlas connection string (`MONGO_URI`)
   - A Cloudinary account (cloud name, API key, API secret) for photo uploads
   - (Optional) Gmail address + App Password for email notifications

3. Run in development (auto-restarts on file changes):
   ```bash
   npm run dev
   ```

4. Server runs at `http://localhost:5000`. You should see:
   ```
   Server running on port 5000
   MongoDB connected
   Escalation cron job scheduled (runs every 30 minutes)
   ```

## API Reference

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register (`name`, `email`, `password`, optional `role`) |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Private | Get current logged-in user |

### Issues
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/issues` | Private | Create issue (form-data, supports `photo` file). Auto-merges duplicates within 50m. Photo upload fails gracefully if Cloudinary isn't configured — the issue still saves. |
| GET | `/api/issues` | Public | List issues. Filters: `category`, `status`, `isEmergency`, `sortBy=upvotes` |
| GET | `/api/issues/near?lat=&lng=&radius=` | Public | Issues near a point (radius in meters, default 2000) |
| GET | `/api/issues/mine` | Private | `{ reported, affected }` — issues you filed vs. ones you got merged into |
| GET | `/api/issues/:id` | Public | Single issue detail — upvotes, affected users, and comment authors are populated with public profile info (name, ward, avatar) |
| PUT | `/api/issues/:id/upvote` | Private | Toggle upvote |
| POST | `/api/issues/:id/comments` | Private | Add a comment (`{ text }`) |
| PUT | `/api/issues/:id/comments/:commentId/like` | Private | Toggle like on a comment |
| PUT | `/api/issues/:id/status` | Admin only | Update status (`pending`/`in-progress`/`resolved`) + optional `note` |
| GET | `/api/issues/admin/all` | Admin only | All issues, emergency + escalated sorted first |

### Profile
| Method | Route | Access | Description |
|---|---|---|---|
| PUT | `/api/auth/profile` | Private | Edit name, phone, ward, address |
| PUT | `/api/auth/avatar` | Private | Upload profile photo (form-data, `avatar` file field) |
| PUT | `/api/auth/password` | Private | Change password |
| GET | `/api/auth/verify/:token` | Public | Confirms an email verification link |

## On identity verification (why not Aadhaar)

A real Aadhaar/eKYC integration requires registering as a UIDAI-licensed Authentication
User Agency, goes through a compliance process, and is legally restricted to specific
approved use cases — it isn't something you can wire up for a student project, and
storing Aadhaar numbers without that authorization would violate the Aadhaar Act.

Instead, this project uses two lighter, achievable trust mechanisms:

1. **Email verification** — on registration, a signed token is emailed (reusing the
   existing Nodemailer setup); clicking it sets `isVerified: true`. If `EMAIL_USER`/
   `EMAIL_PASS` aren't configured, accounts are simply left unverified rather than
   silently marked as verified.
2. **Trust score** — a `trustScore` field on `User`, intended to rise as an admin
   resolves issues a user reported (and could fall if reports are marked invalid).
   The field exists on the model now; wiring the increment into `updateIssueStatus`
   is a natural next step if you want to build it out further.

This is worth mentioning as a deliberate design decision in an interview — it shows
you understood the constraint rather than skipping the feature.

## Create Issue — expected form-data fields

| Key | Type | Notes |
|---|---|---|
| title | Text | required |
| description | Text | required |
| category | Text | one of: pothole, streetlight, garbage, water, electrical, other |
| longitude | Text | required |
| latitude | Text | required |
| address | Text | optional |
| isEmergency | Text | "true" or "false" |
| photo | File | optional image upload |

## Key features

- **JWT auth** with role-based access (`citizen` / `admin`)
- **Geospatial duplicate detection** — MongoDB `2dsphere` index, merges reports within 50m of the same category into one issue (`alsoAffectedBy` array)
- **Emergency flagging** — `isEmergency: true` issues trigger an immediate email alert
- **Auto-escalation** — a `node-cron` job runs every 30 minutes; any emergency issue still `pending` after 2 hours gets flagged `isEscalated: true` and triggers a follow-up alert
- **Cloudinary image upload** — photos handled in-memory via Multer, streamed directly to Cloudinary (avoids the `multer-storage-cloudinary` v1/v2 peer-dependency conflict)
- **Email notifications** — citizens get notified when their issue's status changes

## Folder structure

```
civic-reporter-backend/
├── config/
│   ├── db.js            # MongoDB connection
│   ├── cloudinary.js     # Cloudinary config
│   └── mailer.js          # Nodemailer setup
├── models/
│   ├── User.js
│   └── Issue.js
├── middleware/
│   ├── authMiddleware.js  # protect + adminOnly
│   └── upload.js           # Multer memory storage
├── controllers/
│   ├── authController.js
│   └── issueController.js
├── routes/
│   ├── authRoutes.js
│   └── issueRoutes.js
├── jobs/
│   └── escalationJob.js   # node-cron auto-escalation
├── server.js
├── .env.example
└── package.json
```
