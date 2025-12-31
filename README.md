# 🟠 YCdle

**A daily Wordle-style guessing game for Y Combinator companies.**

Test your knowledge of YC's top startups! Guess the mystery company in 6 tries using clues about batch, industry, status, badges, and region.

![Game Preview](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-blue) ![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7)

---

## 🎮 How to Play

1. **Search** for a YC company by name
2. **Submit** your guess
3. **Analyze** the color-coded feedback:
   - 🟩 **Green** — Exact match
   - 🟨 **Yellow** — Partial match (e.g., industry appears in target's industries list)
   - 🟥 **Red** — No match
   - ⬆️⬇️ **Arrows** — For batch, indicates if target is earlier or later

4. **Narrow down** using the clues and guess again
5. **Win** by guessing correctly within 6 tries!

### Properties Compared

| Property | Description |
|----------|-------------|
| **Batch** | YC batch (e.g., W24 = Winter 2024, S23 = Summer 2023) |
| **Industry** | Primary business sector (B2B, Healthcare, Fintech, etc.) |
| **Status** | Current state (Active, Acquired, Inactive) |
| **Badges** | Special designations (e.g., Top Company) |
| **Regions** | Geographic operating regions |

---

## 🎯 Game Modes

### 📅 Daily Mode (Default)
- Same mystery company for all players each day
- Resets at UTC midnight
- Progress saved locally

### ♾️ Unlimited Mode
- Practice with random companies
- Play as many times as you want
- Great for learning YC companies

Toggle between modes using the button in the header.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4
- **Build:** Vite 7
- **Hosting:** Netlify (with serverless functions)
- **Data:** YC Company API

---

## 📁 Project Structure

```
ycdle/
├── data/                     # Company data (JSON)
│   ├── yc_companies.json     # Full company dataset
│   └── yc_index.json         # Lookup indices
├── scripts/                  # Data management scripts
│   ├── scrape_yc_to_json.py  # Fetch companies from YC API
│   └── build_yc_index.py     # Build search indices
└── web/                      # Frontend application
    ├── src/
    │   ├── components/       # React components
    │   ├── hooks/            # Custom React hooks
    │   ├── lib/              # Core game logic
    │   │   ├── core/         # Config, dates, utilities
    │   │   ├── data/         # Data loading & filtering
    │   │   ├── game/         # Comparison & state logic
    │   │   └── modes/        # Daily/Unlimited mode handling
    │   └── utils/            # Helper functions
    ├── netlify/functions/    # Serverless functions
    │   └── daily/            # Daily company selection endpoint
    └── public/data/          # Static data files
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+ (for data scripts)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ycdle.git
cd ycdle

# Install frontend dependencies
cd web
npm install
```

### Development

```bash
# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

---

## 📊 Data Management

### Refresh Company Data

Fetch the latest companies from YC's API:

```bash
# From project root
python scripts/scrape_yc_to_json.py

# Options
python scripts/scrape_yc_to_json.py --out data/yc_companies.json
python scripts/scrape_yc_to_json.py --max-pages 5  # For testing
```

### Rebuild Search Index

After updating company data, rebuild the index:

```bash
python scripts/build_yc_index.py

# Options
python scripts/build_yc_index.py --in data/yc_companies.json --out-dir data/
```

### Copy Data to Web

After updating data files, copy them to the web app:

```bash
# Copy to public folder (for development)
cp data/*.json web/public/data/

# Copy to src folder (for imports)
cp data/*.json web/src/data/
```

---

## ☁️ Deployment

### Netlify

The app is configured for Netlify deployment with:

- **Static site** built from `web/dist/`
- **Serverless function** at `/.netlify/functions/daily` for daily company selection

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YC_DAILY_SEED` | Secret seed for daily company selection | Yes (production) |

### Daily Function

The `/daily` endpoint returns the day's target company:

```json
{ "yc_id": "12345" }
```

**Caching:**
- Cached until UTC midnight
- `stale-while-revalidate` for smooth transitions
- Debug mode: `/.netlify/functions/daily?debug=1` bypasses cache

**Headers:**
- `X-YCDLE-Day` — UTC day number
- `X-YCDLE-Seed-Hash` — Short hash of seed (for debugging)

---

## 🧪 Testing the Daily Function

```bash
# Normal request (cached)
curl https://your-site.netlify.app/.netlify/functions/daily

# Debug mode (no cache, extra info)
curl "https://your-site.netlify.app/.netlify/functions/daily?debug=1"

# Test future days (debug mode only)
curl "https://your-site.netlify.app/.netlify/functions/daily?debug=1&day_offset=1"
```

---

## 🎨 Customization

### Colors

The game uses YC's signature orange (`#F26625`) as the primary accent. Tailwind is configured with:

```css
--color-yc-orange: #F26625;
```

### Game Constants

Edit `web/src/lib/game/constants.ts`:

```typescript
export const MAX_GUESSES = 6           // Guesses allowed
export const ANIMATION_COMPLETE_DELAY_MS = 3000  // Win/lose animation delay
```

---

## 📜 License

MIT License — feel free to fork and build your own version!

---

## ⚠️ Disclaimer

This project is **not affiliated with Y Combinator**. Company data is sourced from YC's public API.

---

<p align="center">
  Built with 🧡 for the YC community
</p>
