# ElectroCode Hub

Search once → find the exact requirement → see the source → understand it → compare codes → use it in your design.

## Run the prototype
No build step. Either open `index.html` in a browser, or serve it:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1      # http://localhost:5173
```
(or `npx serve .` / `python -m http.server` if you have them.)  Click **Sign in → Continue** (prototype sign-in, no password).

## What's in the prototype
Landing page · Dashboard · hybrid Search (keyword + semantic + filters + ranking breakdown) · Source viewer with annotated page, zoom, fullscreen, download · Compare Codes (🟢🟡🔴⚪) · Subject Library · Saved References & folders · Projects & sections · ElectroCode AI (grounded, refuses unsupported questions) · Authority Comment Analyzer · Version comparison (DEWA 2022 vs 2025) · Code Library · 12 engineering tools · Admin panel (documents, simulated upload/indexing pipeline, review queue, users/roles) · Settings & roadmap · responsive/mobile.

## Indexed documents (real content)
The library is built from four PDFs supplied by the site owner (the earlier DEWA 2017 regulations were replaced by the Dubai Building Code) (`js/real/*.js` + page images in `pages/`):

| Authority | Document | Indexed scope |
|---|---|---|
| UAE FLS | UAE Fire & Life Safety Code of Practice, Sept 2018 | Chapters 5 (Exit Signs), 6 (Emergency Lighting), 7 (Emergency Voice Evacuation) only |
| DEWA | Dubai Building Code 2021, Part G: Incoming utilities (DEWA electrical requirements) | G.4 electrical systems, G.5 EV charging, G.6 solar PV, G.7 substations and MV; G.8–G.11 not indexed |
| SEWA | Electric Booklet (Regulations for Electrical Installations), 2020 | Selected clauses of sections 1, 3–10, 12–14; appendices and figures not indexed |
| CIBSE | SLL Code for Lighting (2012) | Schedule of lighting requirements – Chapter 2 tables 2.5–2.57 (indoor) and Chapter 3 outdoor tables; design guidance chapters not indexed |
| ADDC | The Electricity Distribution Code v3.0 (2005) | Selected planning & connection clauses (utility code, not wiring regulations) |

Clauses were transcribed/extracted from the PDFs (the UAE FLS and SEWA PDFs have a scrambled text layer, so those were read from the page images) and page images are rendered from the same files. Verify against the original before design or submission. IEC and NFPA are not indexed yet. Calculators use simplified/indicative tables.

> This platform is an engineering information and reference tool. Always verify the latest official authority document before final design, submission, or construction.

See `ARCHITECTURE.md`, `db/schema.sql`, `backend/`.

## ElectroCode AI (conversational assistant)

`#/ai` is a multi-turn, citation-grounded assistant. Retrieval runs in the browser over the indexed clauses (`js/core.js` `search()`); the orchestration lives in `js/ai.js`.

| Mode | When | What it does |
|---|---|---|
| **Extractive** (default) | no proxy configured | Builds the answer only from quoted clause text and stored metadata (authority, document, edition, section, clause, page). Labelled "Extractive". |
| **LLM** | proxy URL saved in Settings → API & security | Sends the question, short history and the retrieved evidence to your proxy. The model text is accepted only if every `[n]` citation points at retrieved evidence; otherwise the extractive answer is shown with a Retry button. |

If nothing is retrieved the model is **not called** and the answer is "No verified requirement was found in the indexed sources."

### Enable LLM mode
1. `backend/worker/ai-proxy.js` is a Cloudflare Worker. `npx wrangler deploy backend/worker/ai-proxy.js --name electrocode-ai`
2. `npx wrangler secret put LLM_API_KEY` (the key never touches the website). Optionally set `LLM_MODEL` and `ALLOWED_ORIGINS` (see `.env.example`).
3. In the site: **Settings → API & security → ElectroCode AI – LLM proxy**, paste the worker URL, Save.

### Tests
Open `tests/ai.test.html` through any static server (for example `serve.ps1`). It covers matched / unmatched questions, missing clause or page metadata, a missing authority, follow-ups, conflicting values, citation validation, model/provider failures, escaping of retrieved text and a scan for hard-coded keys.

### Remaining infrastructure (not included)
Embedding-based retrieval, OCR ingestion of new PDFs and server-side conversation storage need the optional backend (`backend/ingest.py`, `backend/rag.py`, `db/schema.sql`) and a database. Chat history is currently stored per browser (`localStorage`).