## 🦙 LLaMa Leaks

> *“Oops. I left my LLaMA running wide open…”* — Someone, probably.

**LLaMa Leaks** is a passive AI security dashboard that highlights one simple, overlooked fact:

> A surprising number of people have accidentally exposed their Ollama servers to the entire internet — no auth, no firewall, just... vibes.

This project:

* Doesn’t hack
* Doesn’t probe
* Doesn’t even look at you funny 👀
* Just listens to what’s already shouting into the void

It just politely points out that maybe, just maybe, running a multimodal LLM on your servers without authentication is a bad idea.

---

## 🎯 What It Shows

* 🟢 Servers that are online and leaking models
* 🟡 Servers that are online but empty
* 🔴 Servers that were once open, now offline or secured

Each one is masked, sanitized, and ~~rate-limited~~. No servers were harmed in the making of this wall.

---

## 🧠 Why It Exists

This is not a burn board.

It’s a public security awareness project designed to:

* Show the unintended side of AI deployment
* Encourage better defaults in open-source tools
* Spark conversation about where model hosting meets cybersecurity

No scans. No leaks. Just redacted reality.

---

## 🚀 Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for KV storage)

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up Vercel KV storage:**
   - Follow the detailed guide in [KV_SETUP.md](KV_SETUP.md)
   - Update `frontend/.env.local` with your KV credentials

3. **Test your KV setup:**
   ```bash
   npm run test:kv
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local` and fill in your values:

- `KV_REST_API_URL` - Your Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Your Vercel KV REST API Token
- `VITE_MAPBOX_TOKEN` - Mapbox token for map functionality

### Rate Limiting

The application uses Vercel KV for rate limiting anonymous users:
- 3 requests per day per user
- 15 requests per month per user
- User identification via IP + browser fingerprint

---

## 🤝 Want to Help?

* 🛡️ **Run Ollama securely** — auth on, ports closed
* 📣 **Share this project** with AI developers and teams
* 🧑‍💻 **Open an issue or PR** with suggestions or feedback
* 📬 **Or just admire the llamas**

Security starts with awareness — and sometimes that starts with a llama on the internet.

---
