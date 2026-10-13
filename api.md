# ElectroCode Hub – REST API (v1)

Auth: OIDC/OAuth2 (Google, Microsoft Entra) + email login → short-lived JWT access token (15 min) + refresh token (httpOnly cookie).
Roles: `admin`, `editor`, `engineer`, `viewer` – enforced by middleware; every write is recorded in `audit_log`.
All endpoints are `/v1`, JSON, rate-limited per user and API key.

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/auth/login`, `/auth/refresh`, `/auth/logout` | – | Session handling |
| GET | `/search?q=&authority=&discipline=&subject=&page=` | viewer+ | Hybrid search → ranked clauses with `score`, trace, `image_url`, score breakdown |
| GET | `/suggest?q=` | viewer+ | Query autocomplete (recent + subjects + synonyms) |
| GET | `/clauses/{id}` | viewer+ | Clause, trace (authority→document→section→clause→page), page image, bbox |
| GET | `/documents`, `/documents/{id}`, `/documents/{id}/pages/{n}.webp` | viewer+ | Library, versions, page images |
| GET | `/documents/{a}/diff/{b}` | viewer+ | Added / removed / modified clauses between versions |
| GET | `/compare?subject=&authorities=DEWA,SEWA,ADDC,IEC` | viewer+ | Matrix of attribute → authority → clause, with status (same/different/conflict/not specified) |
| POST | `/ask` `{question, authorities?}` | engineer+ | Source-grounded answer or `{grounded:false,message:"No verified requirement was found in the indexed sources."}` |
| POST | `/comments/analyze` `{text, project_id?}` | engineer+ | Authority Comment Analyzer |
| GET/POST/DELETE | `/bookmarks`, `/folders` | engineer+ | Saved references |
| GET/POST/PATCH | `/projects`, `/projects/{id}/sections`, `/projects/{id}/references` | engineer+ | Project workspace |
| POST | `/admin/documents` (multipart) | editor+ | Upload PDF/DOCX/image → ingestion job |
| PATCH | `/admin/documents/{id}` `{status, version, revision, authority_id}` | editor+ | processing → indexed → verified → published → archived |
| POST | `/admin/documents/{id}/revisions` | editor+ | Add a revision (links `supersedes_id`, triggers diff) |
| GET/PATCH | `/admin/review-queue`, `/admin/ai-answers?flagged=true` | editor+ | OCR / clause / AI answer review |
| GET/PATCH | `/admin/users` | admin | Users, roles, permissions |
| GET | `/tools/{name}` (future) | engineer+ | Server-side calculators for BIM plugins |

## Future integration points
`/v1/check` (BIM element payload → compliance findings with clause citations) for the Revit plugin / Dynamo / AutoCAD; `/v1/reports/compliance` (PDF/Excel); webhooks for consultant-comment tracking and approval workflow.

## POST /chat  (ai-proxy.js)
Request: `{ question, topic, authorities[], compare, history[{role,text}], evidence[{n,id,authority,document,edition,section,clause,page,text}] }`
Response: `{ answer: "text with [n] citations", usage }` · Errors: `400` invalid body, `403` origin, `413` too large, `502` provider error, `503` key not configured.
The client discards answers with no valid `[n]` marker and strips markers outside `1..evidence.length`.