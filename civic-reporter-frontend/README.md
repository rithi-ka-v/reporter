# Civic Reporter — Frontend

Citizen-facing web app for the Civic Issue Reporter project. Citizens report ward
issues (potholes, streetlights, garbage, water, electrical hazards) with a photo
and pinned location, track them on a live map, and follow status through to
resolution. Admins get a queue view to triage and update status.

Built with React + Vite, React Router, Tailwind CSS, and Leaflet for maps.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` (already present, points at `http://localhost:5000/api`
   by default — update it if your backend runs elsewhere):
   ```bash
   cp .env.example .env
   ```

3. Make sure the backend is running first (see the backend README), then:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173`.

## Pages

| Route | Description |
|---|---|
| `/` | Feed — browse and filter all reported issues, upvote |
| `/map` | All issues plotted on a live Leaflet map |
| `/report` | Report a new issue (photo, category, geolocation, emergency flag) — requires login |
| `/issues/:id` | Full issue detail, status history, map pin, admin controls |
| `/login`, `/register` | Auth |
| `/admin` | Admin queue — filter, triage, update status — admin role only |
| `/profile` | View/edit your details, upload a profile photo, change password |
| `/my-reports` | Issues you've reported, and ones you're marked "also affected by" |
| `/verify-email/:token` | Confirms an emailed verification link |

## Map search

The map's search bar uses OpenStreetMap's free Nominatim geocoding API — no API key
needed. It debounces as you type, shows matching places, and flies the map to your
pick. There's also a "Use my location" button that reads GPS directly.

## Design system

The visual language is built around India's civic-infrastructure aesthetic: official
stamps, stenciled signage, and municipal work-order tickets, rather than a generic
SaaS look.

- **Colors** — `paper` (concrete backdrop), `ink` (near-black text), `signal` (resolved
  green), `hazard` (pending amber / emergency), `route` (in-progress blue), `steel`
  (muted labels/meta text). Defined in `tailwind.config.js`.
- **Type** — Big Shoulders (display headlines), IBM Plex Sans (body), IBM Plex Mono
  (ticket IDs, coordinates, timestamps, labels — anything that reads like data).
- **Signature elements** — the perforated "work-order" strip on issue cards
  (`.tag-punch` in `index.css`), and the rotated stamp-style status tags
  (`StatusTag.jsx`).

## Folder structure

```
src/
├── api/axios.js           # Axios instance, attaches JWT automatically
├── context/AuthContext.jsx # Global auth state (login/register/logout)
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── IssueCard.jsx
│   ├── StatusTag.jsx        # signature "stamp" status badge
│   └── ProtectedRoute.jsx
├── pages/
│   ├── Home.jsx             # feed + stats
│   ├── MapView.jsx
│   ├── ReportIssue.jsx
│   ├── IssueDetail.jsx
│   ├── Login.jsx / Register.jsx
│   ├── AdminDashboard.jsx
│   └── NotFound.jsx
├── constants/categories.js  # issue categories + status labels
├── lib/leafletSetup.js      # fixes Leaflet's default marker icons under Vite
├── App.jsx                  # routes
├── main.jsx                 # entry point (Router + AuthProvider)
└── index.css                 # design tokens, base styles, component classes
```

## Build for production

```bash
npm run build
```
Output goes to `dist/` — deploy to Vercel, Netlify, or any static host. Set
`VITE_API_URL` to your deployed backend URL as an environment variable on the host.
