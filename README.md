# QuickFix — Real-time service marketplace

QuickFix connects customers who need help around the home with nearby service professionals. The app includes customer, provider, and administrator workspaces; a persisted service lifecycle; private job chat; and live notifications powered by Socket.IO.

## Features

- Customer and provider sign-up, JWT sign-in, profile editing, and role-protected routes.
- Local service catalogue, provider discovery, and server-side filters for category, area, rating, availability, and rate.
- Customer requests with budget, address, preferred date, description, and optional photos.
- Provider availability, incoming requests, accept/pass actions, assigned jobs, and controlled status changes.
- Status flow: `OPEN → ACCEPTED → PROVIDER_ON_THE_WAY → STARTED → COMPLETED`; customers can cancel while a request is `OPEN` or `ACCEPTED`.
- Request chat with MongoDB message history, Socket.IO delivery, typing indicators, read receipts, and online presence.
- Stored notifications with unread counts, mark-read actions, and live dashboard refreshes.
- Completed-job reviews with provider rating averages.
- Admin views for users, providers, requests, service categories, reviews, and recent activity.
- Image upload for user/pro photos and service requests. Local uploads are size-limited, MIME checked, signature checked, and stored on disk rather than in MongoDB.
- Helmet, CORS allow-list, API and sign-in rate limits, input validation, MongoDB input sanitization, protected uploads, and centralized error responses.

## Stack and structure

- **Client:** React, React Router, Axios, Context API, Socket.IO client, Vite, responsive CSS.
- **Server:** Node.js, Express, Socket.IO, Mongoose, JWT, bcryptjs.
- **Database:** local MongoDB at `127.0.0.1` or `localhost` for development; production can use an accessible MongoDB deployment. The database name remains `quickfix`.

```text
client/src/       React app, pages, layouts, context, API client and styles
server/config/    MongoDB connection
server/controllers/ API handlers and business workflows
server/middleware/ authentication, validation, and errors
server/models/    User, ProviderProfile, ServiceCategory, ServiceRequest,
                  Conversation, Message, Notification, Review
server/routes/    REST route definitions
server/services/  notifications, request workflow, realtime event access
server/sockets/   authenticated Socket.IO event handlers
server/uploads/   local development image files (ignored by Git)
```

## Requirements and install

- Node.js 20 or newer and npm.
- MongoDB Community Server installed and running on this same computer at `mongodb://127.0.0.1:27017`.

From the project root:

```bash
npm install
```

Copy `.env.example` to `.env` and set a private JWT secret. The example `MONGO_URI` selects the local `quickfix` database. Local development accepts only loopback MongoDB; when `NODE_ENV=production`, the server can connect to a remote MongoDB URI as long as its database is named `quickfix`.

PowerShell can create a random secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste that value into `JWT_SECRET`. Do not commit `.env`.

## Start the app

Start both services from the root:

```bash
npm run dev
```

- Client: <http://localhost:5173>
- API and Socket.IO: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

The Vite development server proxies `/api`, `/uploads`, and `/socket.io` to Express. To start only one side, run `npm run dev -w client` or `npm run dev -w server` from the root. For a production client bundle, use `npm run build`; `npm start` starts the API.

At server startup, Mongoose connects using `MONGO_URI` and QuickFix idempotently inserts its built-in service categories. If local MongoDB is unavailable, the server exits with: `MongoDB connection failed. Please start the local MongoDB service.`

## Local development data

Optional demo data is inserted with:

```bash
npm run seed
```

Seed users (all have the same development-only password):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@quickfix.test` | `QuickFix!Demo2026` |
| Customer | `maya@quickfix.test` | `QuickFix!Demo2026` |
| Provider | `arjun@quickfix.test` | `QuickFix!Demo2026` |

The provider profile is online and has two service categories. The seed adds an open sample request, a completed sample job with a review, a persisted conversation/message, and a notification. The seeder is disabled when `NODE_ENV=production`.

## Local MongoDB and collections

Default connection:

```env
MONGO_URI=mongodb://127.0.0.1:27017/quickfix
```

Mongoose uses/creates the `quickfix` database and these collections as records are written: `users`, `providerprofiles`, `servicecategories`, `servicerequests`, `conversations`, `messages`, `notifications`, and `reviews`. MongoDB stores the authoritative records, so browser refreshes do not clear marketplace data. Uploaded image files are local files under `server/uploads/`; MongoDB stores their paths.

If startup reports that MongoDB is unavailable, start the MongoDB service on Windows (the service is commonly named `MongoDB`) or run `mongod` with its configured data directory, then restart QuickFix. Confirm that port `27017` is listening. QuickFix does not try another database when local MongoDB is unavailable.

## API overview

All successful API responses use `{ "success": true, "message": "…", "data": … }`; errors use `{ "success": false, "message": "…" }`. Authenticated routes accept `Authorization: Bearer <token>`.

| Area | Routes |
| --- | --- |
| Auth/profile | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/users/me` |
| Catalogue/providers | `GET /api/services`, `GET /api/providers?category=&location=&rating=&minRate=&maxRate=` |
| Requests | `POST/GET /api/requests`, `GET /api/requests/:id`, provider `POST /accept` and `/reject`, `PATCH /status`, customer `POST /cancel` |
| Chat | `GET /api/conversations`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`, `POST /api/conversations/:id/read` |
| Notifications | `GET /api/notifications`, `GET /api/notifications/count`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` |
| Reviews | customer `POST /api/reviews`; role-filtered `GET /api/reviews` |
| Admin | `/api/admin/overview`, `/users`, `/providers`, `/requests`, `/categories`, `/reviews`, `/activity` |

For filters and pagination, requests return an `items` list and `pagination` object. Only admins can create/archive service categories or disable/enable accounts. Admin creation is deliberately not exposed through public registration; create the development admin with the seed command.

## API smoke examples

Use the included seed credentials to sign in, then copy the returned token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maya@quickfix.test","password":"QuickFix!Demo2026"}'
```

Get the seeded customer’s profile:

```bash
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer YOUR_TOKEN"
```

Create a request after looking up a category ID with `GET /api/services`:

```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"category":"CATEGORY_ID","title":"Kitchen tap is dripping","description":"The kitchen tap has a steady drip from the handle and needs an inspection.","budget":1200,"address":"12 Lakeview Road, apartment 3B","city":"Indiranagar, Bengaluru"}'
```

To exercise accept and status updates, sign in as the demo provider, set the provider online (`PATCH /api/providers/me/status`, body `{"status":"ONLINE"}`), accept the open request, then send each valid status in order: `PROVIDER_ON_THE_WAY`, `STARTED`, `COMPLETED`. A completed request can be reviewed by its customer (`POST /api/reviews`, body `{"request":"REQUEST_ID","rating":5,"comment":"Clear updates and careful work."}`).

## Socket.IO events

Socket authentication uses the same JWT as REST: `io(url, { auth: { token } })`. The server places an authenticated socket in its private `user:<id>` room. A socket must also be an actual conversation participant before it can join `conversation:<id>`; membership is checked for every join, message, typing, and read event.

| Client event | Purpose |
| --- | --- |
| `conversation:join` | Authorize and join one persisted job conversation |
| `message:send` | Validate and save the message, notify the receiver, and broadcast `message:received` |
| `typing:start`, `typing:stop` | Send a private conversation typing indicator |
| `messages:read` | Persist read timestamps and broadcast read receipts |
| `presence:request` | Return the currently connected user IDs in the acknowledgement |

Server events include `presence:list` (initial snapshot), `message:received`, `typing:update`, `messages:read`, `messages:unread`, `notification:new`, `notification:count`, `request:updated`, `provider:presence`, and `user:presence`. Chat history is read from MongoDB after reconnection; it is not held only in React state.

## Deployment notes

The app can be deployed as one Node web service: Express serves both `client/dist` and the `/api` + Socket.IO endpoints. `render.yaml` contains a free Render Blueprint for a public demo. Connect a private GitHub repository to Render, then supply `MONGO_URI` and the web-push environment values in the Render dashboard. Render's assigned URL is used automatically for CORS and Socket.IO; set `CLIENT_URL` explicitly only when using a custom domain or multiple origins. `MONGO_URI` must use the `quickfix` database name. Local development remains restricted to loopback MongoDB; remote MongoDB is accepted only with `NODE_ENV=production`.

For MongoDB Atlas, create a database user and add the Render service's outbound IP ranges from its **Connect → Outbound** panel to Atlas's IP access list. Do not open the database to every IP. Generate local VAPID credentials with `npm run setup:vapid`, then copy their values from the ignored local `.env` into Render's secret environment variables; never commit or share the private key.

The Render Blueprint uses the free web-service plan for a demo. Free services sleep after 15 minutes without traffic and can take about a minute to wake. Their filesystem is temporary, so uploaded images may disappear after a restart or deploy. For always-on use and durable local image uploads, change to a paid web-service plan and attach a persistent disk mounted at `/var/data`, then set `UPLOAD_DIR=/var/data/uploads`. Production registration is open for customers and providers; the development seed accounts are not created in production.

Payment capture, refunds, email delivery, and password-reset flows are not included; job budgets and provider profile rates are informational. No payment amounts are represented as completed payouts.

## Troubleshooting

- **MongoDB connection failed:** start the local MongoDB service and verify port 27017. Check that `MONGO_URI` points to `localhost`/`127.0.0.1` and ends in `/quickfix`.
- **Client cannot reach the API:** keep the default API port at 5000 and client at 5173, or update `CLIENT_URL` and the Vite proxy together.
- **Socket events do not arrive:** sign in again to refresh the JWT and confirm the browser origin is listed in `CLIENT_URL`.
- **Uploads fail:** use a real JPG, PNG, WEBP, or AVIF image smaller than `MAX_UPLOAD_MB` (5 MB by default); keep `server/uploads/` writable.
- **Admin sign-in fails:** rerun `npm run seed` in development and use the documented demo-only account.
