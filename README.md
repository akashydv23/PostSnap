<div align="center">

# 📸 PostSnap

**Pixel-Perfect, Archival-Grade Twitter / X Post to 2x Retina PNG Generator**

[![Live Production](https://img.shields.io/badge/Live%20Site-postxsnap.pages.dev-1d9bf0?style=for-the-badge&logo=cloudflare&logoColor=white)](https://postxsnap.pages.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Deployment-Cloudflare%20Pages%20Functions-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://postxsnap.pages.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ba7c?style=for-the-badge)](LICENSE)
[![Creator: Akash Yadav](https://img.shields.io/badge/Creator-Akash%20Yadav-blue?style=for-the-badge&logo=x&logoColor=white)](https://x.com/akashhYaadav)

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-endpoints">API</a> •
  <a href="#-creator">Creator</a>
</p>

</div>

---

## ⚡ Overview

**PostSnap** transforms any public Twitter / X post into a crisp, authentic, high-resolution 2x Retina PNG image with exact typography, official verified checkmarks, rich media cards, and live engagement metrics.

Eliminates manual screenshot messiness:
- ❌ **No browser chrome, URL bars, or bookmarks clutter**
- ❌ **No truncated long posts with ugly `[Show More]` or scrollbars**
- ❌ **No 72 DPI blurry, pixelated screen grabs**
- ❌ **No sign-in, login credentials, or API keys required**

---

## 🍉 Key Features

- **🎯 2x Retina PNG Export (300 DPI)**: Renders with subpixel antialiasing at `1120px` base width. Ready for keynote decks, research papers, design portfolios, and social sharing.
- **🛡️ Authentic Verification Marks**: Preserves subscriber blue checkmarks, organization gold badges, and the official 𝕏 brand mark.
- **📏 Dynamic Auto-Height**: Extended-length and long-form posts expand the canvas automatically so every word is displayed legibly without truncation.
- **⚡ Global Edge Distribution (Cloudflare V8)**: Powered by Cloudflare Pages serverless edge functions across 310+ worldwide PoPs with ~140ms median response time.
- **🔒 Zero-Taint CORS Proxy**: Dedicated edge proxy for `pbs.twimg.com` images providing strict `Access-Control-Allow-Origin: *` headers to ensure uncorrupted client-side canvas rendering.
- **🎨 Triple Theme Engine**: Instant switching between **Light** (Clean White), **Dim** (Navy Slate), and **Dark** (Lights Out Black).
- **🕹️ Watermelon UI Micro-Interactions**:
  - Interactive Rotary DPI Knob (`1x 72 DPI`, `2x 300 DPI`, `3x 450 DPI`, `4x 600 DPI`)
  - Animated Morphing Action Buttons
  - Dynamic Rotating Words Hero (`creators`, `researchers`, `developers`, `archivists`, `journalists`)
  - Counting number telemetry animations
  - Custom glowing cursor and floating navigation dock
- **🕵️ 100% Privacy-First**: Zero database persistence, zero cookies, zero user tracking. Post screenshots are generated directly in the browser and never stored on a server.

---

## 🌐 Live Demo & Sample Posts

Try the live application right now:  
👉 **[https://postxsnap.pages.dev/](https://postxsnap.pages.dev/)**

Interactive sample posts built into the converter:
- **Jack Dorsey** — First tweet in history (2006): `https://x.com/jack/status/20`
- **Elon Musk** — High-resolution photo attachment: `https://x.com/elonmusk/status/1683920951807971329`
- **Barack Obama** — High engagement record (870k+ RTs): `https://x.com/BarackObama/status/44196397`
- **OpenAI** — Long-form model release announcement: `https://x.com/OpenAI/status/1770000000000000001`

---

## 🏗️ Architecture

```
PostSnap System Architecture
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│   • HTML5 / CSS3 / Vanilla Modern ES6+                      │
│   • Watermelon UI Cyberpunk Design System                   │
│   • html2canvas (2x Retina High-DPI Rendering)              │
│   • Clipboard API (1-Click Copy Image)                      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     GET /api/capture?url=...         GET /api/proxy-image?url=...
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│               Cloudflare Pages Edge Network                 │
│                 (310+ PoPs Global Fleet)                    │
│                                                             │
│   functions/api/capture.js      functions/api/proxy-image.js│
│   • Syndication API Tokenizer   • Twimg Stream Proxy        │
│   • Post Data Normalizer        • CORS Headers Injection    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
        cdn.syndication.twimg.com       pbs.twimg.com
```

---

## 📁 Repository Structure

```bash
Twitter_Post_Retriever/
├── functions/                     # Cloudflare Pages Serverless Edge Functions
│   └── api/
│       ├── capture.js             # Fetches & normalizes X syndication post data
│       ├── proxy-image.js         # Edge image proxy with CORS headers for canvas
│       ├── download.js            # Direct server-rendered image download fallback
│       └── test-posts.js          # Built-in sample post test corpus
├── static/                        # Core Static Web Application
│   ├── index.html                 # Main SPA landing page + converter
│   ├── style.css                  # Watermelon UI design system & responsive styling
│   ├── app.js                     # Interactive client logic & html2canvas capture
│   └── html2canvas.min.js         # Offline Retina canvas renderer (198 KB)
├── public/                        # Synced public assets for Cloudflare Pages
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── 404.html
├── index.html                     # Root entry point
├── style.css                      # Root styles
├── app.js                         # Root application script
├── 404.html                       # SPA routing fallback
├── app.py                         # Local Python FastAPI alternative backend
├── test_postsnap.py               # Comprehensive pytest test suite (10/10 tests)
└── README.md                      # Documentation
```

---

## 🛠️ Local Development

### Option A: Local Python / FastAPI Server

If you want to run the application with the Python backend:

```bash
# 1. Clone the repository
git clone https://github.com/akashydv23/PostSnap.git
cd PostSnap

# 2. Set up virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install fastapi uvicorn requests pillow pytest

# 4. Run tests
pytest -v test_postsnap.py

# 5. Start development server
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

### Option B: Cloudflare Pages Local Development (Wrangler)

```bash
# Run locally with Cloudflare Pages Functions support
npx wrangler pages dev .
```

---

## 📡 API Endpoints

### 1. Capture Post Data
Retrieves normalized tweet metadata from Twitter syndication.
```http
GET /api/capture?url=https://x.com/jack/status/20
```
**Response (`application/json`):**
```json
{
  "success": true,
  "tweet": {
    "id": "20",
    "text": "just setting up my twttr",
    "createdAt": "2006-03-21T20:50:14.000Z",
    "author": {
      "name": "jack",
      "username": "jack",
      "avatarUrl": "https://pbs.twimg.com/...",
      "verified": true
    },
    "metrics": {
      "likes": 194821,
      "retweets": 105432,
      "replies": 9431
    },
    "isLongText": false
  }
}
```

### 2. CORS Image Proxy
Streams image data with permissive CORS headers to prevent browser canvas security tainting.
```http
GET /api/proxy-image?url=https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F...
```

---

## 👨‍💻 Creator & Connect

Engineered with passion by **Akash Yadav**:

- **Twitter / X**: [@akashhYaadav](https://x.com/akashhYaadav)
- **GitHub**: [@akashydv23](https://github.com/akashydv23)
- **Project Repo**: [akashydv23/PostSnap](https://github.com/akashydv23/PostSnap)
- **Live App**: [postxsnap.pages.dev](https://postxsnap.pages.dev/)

---

## 📄 License & Attribution

- Released under the [MIT License](LICENSE).
- UI aesthetic and micro-interactions inspired by [Watermelon UI](https://ui.watermelon.sh/home).
- Twitter and 𝕏 are registered trademarks of X Corp. PostSnap is an independent archival utility.
