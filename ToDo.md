# Linea Master Implementation TODO & Architecture Plan

## Project Overview & Current Status

Linea is a real-time collaborative whiteboard and chat monorepo built with Turborepo:

| Layer | Workspace | Tech Stack | Port / Role | Status |
| ----- | --------- | ---------- | ------------- | ------ |
| **Frontend** | `apps/frontend` | Next.js 16 + React 19 + Tailwind v4 + Zustand | Port 3002 | Whiteboard canvas (`Canvas.tsx`, `whiteboardStore.ts`, `drawElement.ts`, `initDraw.ts`) active. Axios configured in `lib/axios.ts`. |
| **HTTP Backend** | `apps/http-backend` | Express + JWT + Prisma | Port 3001 | Auth (`auth.controller.ts`), Room (`room.controller.ts`), and Chat (`chat.controller.ts`) endpoints configured. |
| **WS Backend** | `apps/ws-backend` | `ws` library + Prisma | Port 8080 | Real-time WebSocket messaging server (`src/index.ts`). |
| **Database** | `packages/db` | Prisma + PostgreSQL | Database Schema | Models: `User`, `Room`, `Chat`. Client exported from `@repo/db/client`. |
| **Backend Common** | `packages/backend-common` | TypeScript | Shared Config | Exports `JWT_SECRET`, `HTTP_BACKEND_URL`, `WS_BACKEND_URL`. |
| **Common** | `packages/common` | Zod | Shared Schemas | Auth & Room Zod validation schemas (`packages/common/src/types.ts`). |

---

## Complete Project Structure Reference

```
Linea/
├── apps/
│   ├── frontend/                       ← Next.js Web Client (Port 3002)
│   │   ├── middleware.ts               ← Next.js Edge route protection (reads "token" cookie)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   └── canvas/
│   │   │       └── [roomId]/
│   │   │           └── page.tsx        ← Room & Whiteboard canvas shell
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── SignupForm.tsx
│   │   │   ├── whiteboard/
│   │   │   │   ├── Canvas.tsx          ← Interactive Canvas Component
│   │   │   │   ├── Toolbar.tsx         ← Tool selection bar (Pointer, Rect, Circle, Arrow, etc.)
│   │   │   │   └── PropertyPanel.tsx   ← Element style panel (color, stroke width, roughness)
│   │   │   └── chat/
│   │   │       ├── ChatFeed.tsx        ← Live chat message feed
│   │   │       └── ChatInput.tsx       ← Message input component
│   │   ├── stores/
│   │   │   ├── authStore.ts            ← User profile state (persisted to localStorage)
│   │   │   ├── socketStore.ts          ← WS connection & status state
│   │   │   ├── chatStore.ts            ← Chat messages state
│   │   │   └── whiteboardStore.ts      ← Active tool & canvas elements state
│   │   ├── hooks/
│   │   │   ├── useSocket.ts            ← WS lifecycle & cookie handshake hook
│   │   │   ├── useChats.ts             ← Chat history Axios fetcher hook
│   │   │   └── useRoom.ts              ← Room metadata Axios fetcher hook
│   │   ├── lib/
│   │   │   ├── axios.ts                ← Custom Axios instance (withCredentials: true, 401 interceptor)
│   │   │   ├── drawElement.ts          ← Canvas element rendering helpers
│   │   │   └── initDraw.ts             ← Canvas init helpers
│   │   └── config.ts                   ← Environment URL exports
│   │
│   ├── http-backend/                   ← Express REST API Server (Port 3001)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                ← Express app entry point, middleware & route mounting
│   │       ├── controller/
│   │       │   ├── auth.controller.ts  ← Signup, Login (sets HttpOnly cookie), Logout
│   │       │   ├── room.controller.ts  ← Create room, get room by slug
│   │       │   └── chat.controller.ts  ← Fetch chat history with user details
│   │       ├── middleware/
│   │       │   └── auth.middleware.ts  ← JWT verification middleware (reads req.cookies.token)
│   │       └── routes/
│   │           ├── auth.routes.ts      ← Auth router (/api/auth)
│   │           ├── room.routes.ts      ← Room router (/api/room)
│   │           └── chat.routes.ts      ← Chat router (/api/chat)
│   │
│   └── ws-backend/                     ← Real-Time WebSocket Server (Port 8080)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                ← WebSocket server, HTTP upgrade cookie handshake, room broadcast
│           └── controllers/            ← (Optional modularization for handlers)
│               ├── auth.ws.ts          ← Handshake JWT verification
│               └── room.ws.ts          ← Room join, leave & message event dispatchers
│
└── packages/
    ├── db/                             ← Prisma Database Package
    │   ├── package.json
    │   ├── prisma/
    │   │   └── schema.prisma           ← Models: User, Room, Chat, WhiteboardScene, WhiteboardElement
    │   └── src/
    │       └── index.ts                ← Exports prismaClient instance (@repo/db/client)
    ├── backend-common/                 ← Shared Backend Environment & Secrets
    │   ├── package.json
    │   └── src/
    │       └── index.ts                ← Exports JWT_SECRET, HTTP_BACKEND_URL, WS_BACKEND_URL
    └── common/                         ← Shared Validation Schemas & Types
        ├── package.json
        └── src/
            └── types.ts                ← Zod schemas & TypeScript types for signup, login, room, elements
```

---

## Core System Architecture

### 1. Authentication Flow (HttpOnly Cookie)

No JWT tokens are stored in `localStorage` or handled manually by client JavaScript. All authentication is managed via **HttpOnly cookies**:

```
                         JWT Token
                             │
                             ▼
                     HttpOnly Cookie ("token")
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐
│ Next Middleware  ││  Axios Requests  ││    WebSocket     │
│ (Edge Runtime)   ││(withCredentials) ││  (Handshake)     │
│ Reads Cookie     ││Browser auto-sends││Reads cookie from │
│ Route Protection ││cookie with HTTP  ││HTTP Upgrade Header│
└──────────────────┘└──────────────────┘└──────────────────┘
```

### 2. State & Data Fetching (Zustand + Axios)

* **No TanStack Query**: All server communication is handled via **Axios** (with `withCredentials: true`) and standard React `useEffect` / async functions.
* **Zustand Stores**:
  * `authStore.ts`: User profile (`{ id, name, email }`), persisted to `localStorage`.
  * `socketStore.ts`: Active WebSocket connection reference and connection status.
  * `chatStore.ts`: Real-time and historical chat messages.
  * `whiteboardStore.ts`: Active drawing tool, selected elements, stroke color, roughness, elements array.

---

## Master Implementation TODO Checklist

### Phase 1: Database & Shared Packages (`packages/db`, `packages/common`, `packages/backend-common`)

- [ ] **Extend Prisma Schema (`packages/db/prisma/schema.prisma`)**
  - Add `WhiteboardScene` model (linked to `Room`)
  - Add `WhiteboardElement` model with attributes: `type`, `x`, `y`, `width`, `height`, `strokeColor`, `backgroundColor`, `strokeWidth`, `strokeStyle`, `fillStyle`, `roughness`, `opacity`, `points`, `text`, `version`, `versionNonce`, `isDeleted`
  - Run `npx prisma migrate dev` / `npx prisma generate`
- [ ] **Extend Shared Schemas (`packages/common/src/types.ts`)**
  - Add Zod schemas and TypeScript types for `WhiteboardElement` and WebSocket event payloads (`join_room`, `leave_room`, `chat`, `draw_element`, `delete_element`)
- [ ] **Verify Common Backend Environment Config (`packages/backend-common/src/index.ts`)**
  - Verify exports for `JWT_SECRET`, `HTTP_BACKEND_URL`, `WS_BACKEND_URL`

---

### Phase 2: HTTP Backend Server (`apps/http-backend`)

- [ ] **Dependencies & Middleware Configuration (`src/index.ts`)**
  - Add `cookie-parser` and `cors` to `package.json`
  - Update `src/index.ts` to use `cookieParser()` and `cors({ origin: "http://localhost:3002", credentials: true })`
- [ ] **Auth Controller & Cookie Management (`src/controller/auth.controller.ts`)**
  - Update `userSignup` and `userLogin` to attach HttpOnly cookie:
    ```ts
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000
    });
    ```
  - Add `userLogout` endpoint that calls `res.clearCookie("token")`
- [ ] **Auth Middleware (`src/middleware/auth.middleware.ts`)**
  - Update middleware to extract token from `req.cookies?.token` (with fallback to `Authorization` header)
- [ ] **Chat Controller (`src/controller/chat.controller.ts`)**
  - Update `getChats` query to include sender user name via Prisma relation:
    ```ts
    include: { user: { select: { id: true, name: true } } }
    ```
- [ ] **Whiteboard Scene Controller (`src/controller/whiteboard.controller.ts`)**
  - Create `GET /api/whiteboard/:roomId` - Fetch initial canvas elements for scene
  - Create `POST /api/whiteboard/:roomId/sync` - Bulk save/sync canvas elements

---

### Phase 3: WebSocket Server (`apps/ws-backend`)

- [ ] **HTTP Upgrade Cookie Handshake (`src/index.ts`)**
  - Parse `request.headers.cookie` in `wss.on("connection", (ws, request) => ...)` to extract `token` cookie
  - Verify JWT token using `JWT_SECRET` from `@repo/backend-common/config`
- [ ] **User & Room Tracking**
  - Extend in-memory `User` interface to store `ws`, `userId`, `userName`, `rooms` array
  - Fetch user profile (`dbUser.name`) from Prisma upon connection
- [ ] **Message Handlers & Broadcasting**
  - Handle `join_room` and `leave_room` event types
  - Handle `chat` event: persist message to DB via `prismaClient.chat.create` and broadcast `userId`, `userName`, `message`, `roomId`
  - Handle `draw_element` event: persist element changes to `WhiteboardElement` table and broadcast updated elements to all users in the room
- [ ] **Sender Filtering**
  - Exclude sender from broadcast (`user.ws !== ws`) to prevent duplicate optimistic rendering flashes

---

### Phase 4: Frontend Infrastructure & Stores (`apps/frontend`)

- [ ] **Axios Configuration (`lib/axios.ts`)**
  - Set `withCredentials: true` on Axios instance
  - Add response interceptor for 401 Unauthorized errors to clear Zustand state and redirect to `/login`
- [ ] **Next.js Edge Middleware (`middleware.ts`)**
  - Create `apps/frontend/middleware.ts`
  - Protect `/canvas` and `/room` routes by checking `request.cookies.get("token")`
- [ ] **Zustand State Stores**
  - `stores/authStore.ts`: User profile state (`id`, `name`, `email`) with `persist` middleware to `localStorage`
  - `stores/socketStore.ts`: WebSocket connection reference & status (`idle` | `connecting` | `connected` | `disconnected`)
  - `stores/chatStore.ts`: Chat message history & live message feed
  - `stores/whiteboardStore.ts`: Canvas active tool (`select` | `rectangle` | `ellipse` | `diamond` | `line` | `arrow` | `freedraw` | `text` | `eraser`), stroke width, stroke color, roughness, elements array
- [ ] **Custom Hooks**
  - `hooks/useChats.ts`: Fetch historical chats from HTTP API and populate `chatStore`
  - `hooks/useSocket.ts`: Manage WebSocket lifecycle with automatic browser cookie transmission

---

### Phase 5: Collaborative Whiteboard Canvas (`apps/frontend`)

- [ ] **Canvas Rendering Core (`components/whiteboard/Canvas.tsx`)**
  - HTML Canvas + `roughjs` rendering pipeline
  - Infinite canvas pan (space + drag / middle click) and zoom (mouse wheel)
- [ ] **Tool Components & Implementations**
  - **Pointer/Select**: Select, drag, resize, rotate elements
  - **Shapes**: Rectangle, Ellipse, Diamond, Straight Line, Arrow
  - **Freehand**: Smooth drawing using `perfect-freehand`
  - **Text & Eraser**: Inline text editor and element deletion
- [ ] **Toolbar & Property Panel UI (`components/whiteboard/Toolbar.tsx`, `PropertyPanel.tsx`)**
  - Tool selection buttons with keyboard shortcuts (`V`, `R`, `E`, `D`, `L`, `A`, `F`, `T`)
  - Color pickers for stroke & fill colors
  - Stroke width, opacity, and roughness sliders
- [ ] **Real-Time Collaboration Syncing**
  - Dispatch drawn elements via WebSocket `draw_element` event
  - Reconcile incoming remote elements into `whiteboardStore`

---

### Phase 6: Room Management, Exporting & Polish

- [ ] **Room Management UI**
  - Create Room Modal (`CreateRoomModal.tsx`) & Shareable Invite Links
  - Room Canvas route: `app/canvas/[roomId]/page.tsx`
- [ ] **Export & Import Capabilities**
  - Export canvas scene to PNG / SVG / `.excalidraw` JSON format
- [ ] **UI & Theme Polish**
  - Dark mode canvas support & Tailwind styling consistency
