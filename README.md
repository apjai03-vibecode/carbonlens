# CarbonLens 🌿

A personal carbon footprint tracker with quick logging, a visual breakdown
of your emissions, AI-powered personalized nudges (via Claude), eco-friendly
alternatives on a map (Google Maps), and a friendly neighborhood comparison.

This project was scaffolded with:

- **Frontend:** React + Vite + Tailwind CSS, with Firebase (Auth + Firestore)
  and the Google Maps Embed API
- **Backend:** FastAPI, with a `/nudge` endpoint that calls the Anthropic
  (Claude) API for personalized suggestions

---

## Project structure

```
carbonlens/
├── frontend/        # React + Vite + Tailwind dashboard
│   ├── src/
│   │   ├── components/   # Dashboard, charts, forms, map, leaderboard
│   │   ├── data/          # Mock emission factors & sample data
│   │   ├── firebase.js     # Firebase Auth + Firestore helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── backend/         # FastAPI server
    ├── routers/
    │   ├── log.py     # POST /log, GET /logs
    │   └── nudge.py   # POST /nudge (calls Claude API)
    ├── firebase_config.py  # optional Firestore setup
    ├── models.py
    ├── main.py
    ├── .env.example
    └── requirements.txt
```

---

## 1. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app will be available at **http://localhost:5173**.

The dashboard works immediately with mock data — you don't need Firebase
or Google Maps keys to explore the UI. Those integrations are optional
"upgrades":

- **Firebase**: lets users sign in and saves their activity logs to
  Firestore instead of only in local state. Fill in the
  `VITE_FIREBASE_*` variables in `.env` with values from
  *Firebase Console > Project Settings > General > Your apps*.
- **Google Maps**: shows nearby EV charging stations, bus stops, etc.
  Enable the **Maps Embed API** in Google Cloud Console, create an API
  key, and set `VITE_GOOGLE_MAPS_API_KEY`.

---

## 2. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

The API will be available at **http://localhost:8000** (interactive docs
at `/docs`).

- Set `ANTHROPIC_API_KEY` in `backend/.env` to enable the **AI nudge**
  feature (`POST /nudge`). Without it, the frontend gracefully falls back
  to a static suggestion.
- Firestore persistence is optional — see `firebase_config.py` for setup
  instructions. By default, logs are kept in memory for the demo.

---

## How the pieces fit together

| Feature | Frontend | Backend |
|---|---|---|
| Log an activity | `LogActivity.jsx` computes CO₂e using local emission factors | `POST /log` saves the entry (Firestore if configured) |
| Weekly chart & breakdown | `WeeklyChart.jsx`, `BreakdownBars.jsx` (Recharts) | — |
| AI nudge | `NudgePanel.jsx` calls `/nudge` | `routers/nudge.py` prompts Claude with your weekly totals |
| Eco alternatives map | `EcoMap.jsx` (Google Maps Embed) | — |
| Neighborhood comparison | `Leaderboard.jsx` (mock data) | — |
| Auth & storage | `firebase.js` (Google sign-in, Firestore) | `firebase_config.py` (Admin SDK, optional) |

---

## Next steps / ideas

- Replace the local `EMISSION_FACTORS` table with a real dataset (Climatiq
  API, or Our World in Data / IPCC tables).
- Wire `LogActivity.jsx` to call `POST /log` (and `saveActivityLog` from
  `firebase.js`) instead of only updating local state.
- Add Firebase Auth UI (sign in with Google) and scope logs/leaderboard
  to the signed-in user.
- Deploy the frontend to **Vercel** and the backend to **Railway** or
  **Google Cloud Run**.
