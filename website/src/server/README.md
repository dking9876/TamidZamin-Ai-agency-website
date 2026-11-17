# Lead intake — dedicated Node server only

No delivery takes place by default. Configuration comes from **runtime
`process.env`**, never `import.meta.env`. Nothing in this folder may be imported
into client scripts. All external communications in `test-delivery.mjs` are to
loopback mock processes with synthetic test data; the script does not read `.env`.

The website can also be built as a **Vercel preview**, but this intake service
cannot be enabled there yet. `readLeadConfig` returns
`persistent_storage_required` for a Vercel target before opening SQLite or
sending data. Both UI and API fail closed; the launch gate also rejects this
target. A durable shared store or separately hosted intake backend must be
implemented and tested before enabling delivery on Vercel.

## Astro UI integration

`src/pages/contact.astro` must be server-rendered:

```astro
---
import { getLeadForm } from '../server/leads';
export const prerender = false;
const leadForm = getLeadForm(Astro.request);
Astro.response.headers.set('Cache-Control', 'no-store, private');
Astro.response.headers.set('Vary', 'Cookie');
if (leadForm.cookie) Astro.response.headers.append('Set-Cookie', leadForm.cookie);
---
```

Use `enabled` to display the form **or** the safe unavailable message, never an
enabled submit button while delivery is disabled. The HTML form uses
`method="post" action="/api/lead/"` (default URL-encoded encoding) and
`<input type="hidden" name="token" value={leadForm.token} />`.
The trailing slash is required by this site's `trailingSlash: 'always'` setting.
Do not submit to `/api/lead`: canonical redirects can change a POST into a GET
and discard its body before it reaches the endpoint.

Exact fields:

| Field | Contract |
|---|---|
| `name` | Required, 2–80 Unicode characters |
| `phone` | Required, Israeli local or international with `+`/`00`; server normalizes to E.164 shape |
| `email` | Optional, conventional ASCII email, max 254 |
| `business` | Required, 2–120 characters |
| `service` | `whatsapp`, `phone`, `both`, or `not-sure` |
| `message` | Optional, max 2000 characters; newlines allowed |
| `consent` | Required checkbox with `value="yes"` |
| `website` | Empty honeypot; visually hidden, `tabindex="-1"`, `autocomplete="off"`, excluded from accessibility tree |
| `token` | Signed server token from `getLeadForm` |

Do not add named submit buttons or extra fields: duplicates and unknown fields
are rejected. With JavaScript use `new URLSearchParams(new FormData(form))`
(all fields are strings), header `Accept: application/json` and same-origin
credentials. Do **not** use JSON or multipart encoding. Do not clear fields on
errors or automatically retry network errors, 409, 502 or 503. Keep the same
token when correcting validation errors. Tokens expire after one hour and have
a two-second minimum age.

Responses are `{ ok, message, errors?, reference? }`. Show `message` verbatim
with `textContent` and associate the known `errors` keys with labelled inputs.
Only `ok: true` means the receiver confirmed acceptance. 201 is newly confirmed;
200 is a replay of that same confirmed request. 400/403/408/413/415/429/502/503
are unsuccessful. 409 means pending or changed-payload conflict, **not success**.
The native non-JS response is already accessible Hebrew RTL HTML with the same
truthful status and `/contact/` link; no success page or redirect is needed.

## Receiver contract

The server sends one HTTPS POST with `Authorization: Bearer <token>` and
`Idempotency-Key: <UUID>`. Redirects are refused. The JSON body is:

```json
{
  "version": 1,
  "requestId": "same UUID as Idempotency-Key",
  "submittedAt": "ISO UTC date",
  "source": "tamidzamin-contact",
  "consentVersion": "contact-request-v1",
  "lead": {
    "name": "…",
    "phone": "+972…",
    "business": "…",
    "service": "whatsapp",
    "consent": true
  }
}
```

Optional `email` and `message` are omitted when empty. No IP, session cookie or
form signing secret is forwarded. The receiver must durably accept/enqueue and
deduplicate each UUID for **at least seven days**, then return HTTP 2xx and
`Content-Type: application/json` with `{"accepted":true}`. An optional receiver
`reference` is ignored; the visitor receives the local UUID. A 2xx by itself,
malformed/oversized JSON, `"accepted":"true"`, and timeouts are not success.
`{"accepted":false}` explicitly rejects a request. No automatic retries occur.
Acceptance promises neither human follow-up nor an appointment.

## Persistence, uncertainty and deployment

- One dedicated Node deployment, Node 24.12+, on persistent local storage.
  `DATA_DIR` must be an absolute private writable path **outside the web root**.
  Never put it on a public volume, ephemeral/serverless storage or network share.
- SQLite WAL and immediate transactions coordinate multiple connections to the
  same local file. Reserve a receipt before networking. Concurrent identical
  requests return pending; a different payload under the same UUID conflicts.
- Interrupted/expired pending receipts become unknown, never re-send. If the
  receiver accepts but its response or local receipt write fails, the visitor
  sees an honest ambiguous error and the reference, not false success.
- 12 POST attempts/IP and 200 global per fixed 15-minute window. Only HMAC IP
  keys, HMAC payload fingerprints, random request IDs, statuses and timestamps
  are stored. No lead text/contact details are stored on disk. Receipt hard cap
  is 10,000. Capacity, SQLite and config errors fail closed.
- Rate rows expire each window, receipts after seven days. Bounded opportunistic
  pruning runs on intake; idle storage is not purged until another intake occurs.
  Operator must arrange idle deletion if a strict wall-clock deletion SLA is
  required, and review receiver retention/backups separately.
- Only a direct, valid socket IP from Astro is used by default; forwarded headers
  are ignored. Opt-in trusted-proxy handling requires exact controlled proxy IPs
  and a sanitized forwarding chain. Never use permissive framework middleware
  that substitutes arbitrary forwarded headers for the socket address.
- **Astro 7.4 / Node adapter 11 integration:** leave `security.allowedDomains`
  empty. This adapter substitutes the first `X-Forwarded-For` value for
  `clientAddress` when Host matches `allowedDomains`, defeating access to the
  socket peer needed by our trusted-proxy validation. Its default Origin guard
  also compares against a fallback localhost URL when no domains are configured.
  For this site (whose only write route is this protected endpoint), the parent
  should set `security: { checkOrigin: false }` and keep `allowedDomains` empty:
  **this endpoint still always enforces Origin against runtime `SITE_URL`**, plus
  token/session verification. This also ensures older non-JS browsers without
  Fetch Metadata headers receive the endpoint's HTML/JSON errors, not the
  framework's generic English 403. Reassess CSRF protection if other write routes
  are added. Do not configure broad allowedDomains as a workaround.
- Logs contain only a fixed error code and, where applicable, random reference.
  No raw errors/headers/payloads/secrets are logged. Monitor failures, disk space
  and SQLite permissions/Windows ACLs externally without collecting lead bodies.
- Cookie is session-only, HttpOnly, SameSite=Strict, Secure and `__Host-` in HTTPS.
  Origin is compared with configured `SITE_URL`, not a supplied Host header.
- Only explicit `NODE_ENV=development` plus
  `LEAD_ALLOW_INSECURE_LOCALHOST=true` permits HTTP on loopback mock URLs.
  Production must use HTTPS. No environment file is committed with real secrets.

## Verification and launch blockers

Run `npm test`, then `npm run build`, then `npm run test:delivery`. The latter
spawns the built Astro server and a mock webhook on isolated loopback ports,
creates temporary SQLite directories, and cleans up only its own children/files.

Before launch: approve real domain/HTTPS and hosting, legal operator/public
contact details, consent copy and retention policy; provision private persistent
storage; implement and test durable webhook acceptance/deduplication; set runtime
secrets and receiver; verify proxy configuration; explicitly authorize delivery
and only then set `LEAD_DELIVERY_ENABLED=true`. Business capabilities, real
communications and publishing are not authorized by this implementation.
