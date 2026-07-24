# Linea Master Implementation TODO & Architecture Plan

## Project Overview & Current Status

Linea is a real-time collaborative chat & canvas monorepo built with Turborepo.

> **Note:** Whiteboard collaborative scene/element sync via WebSocket has been **dropped** from scope. The canvas exists as a local drawing tool only; no `draw_element` WS events or `WhiteboardElement` DB persistence via real-time sync is planned.

| Layer                    | Workspace                   | Tech Stack                           | Port / Role    | Status                                                                                          |
| ------------------------ | --------------------------- | ------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------- |
| **Frontend**       | `apps/frontend`           | Next.js + React + Tailwind + Zustand | Port 3002      | Canvas shell (`Canvas.tsx`) + `whiteboardStore.ts` exist. Auth, room pages active.          |
| **HTTP Backend**   | `apps/http-backend`       | Express + JWT + Prisma               | Port 3001      | Auth, Room, Chat controllers & services implemented.                                            |
| **WS Backend**     | `apps/ws-backend`         | `ws` library + Prisma              | Port 8080      | Cookie handshake + join/leave/chat handlers working. Direct DB write on`chat` (no queue yet). |
| **Database**       | `packages/db`             | Prisma + PostgreSQL                  | Schema         | `User`, `Room`, `Chat`, `WhiteboardElement` models exist.                               |
| **Backend Common** | `packages/backend-common` | TypeScript                           | Shared Config  | Exports`JWT_SECRET`, `HTTP_BACKEND_URL`, `WS_BACKEND_URL`.                                |
| **Common**         | `packages/common`         | Zod                                  | Shared Schemas | Auth & Room Zod schemas in`packages/common/src/types.ts`.                                     |

---

## Complete Project Structure Reference

```
Linea/
+-- apps/
�   +-- frontend/                       <- Next.js Web Client (Port 3002)
�   �   +-- middleware.ts               <- Next.js Edge route protection (reads "linea-token" cookie)
�   �   +-- app/
�   �   �   +-- layout.tsx
�   �   �   +-- page.tsx                <- Landing / dashboard
�   �   �   +-- canvas/
�   �   �       +-- [roomId]/
�   �   �           +-- page.tsx        <- Room canvas shell
�   �   +-- components/
�   �   �   +-- ui/
�   �   �   �   +-- button.tsx          <- shadcn button
�   �   �   +-- whiteboard/
�   �   �   �   +-- Canvas.tsx          <- Interactive Canvas Component
�   �   �   +-- chat/                   <- [TODO] ChatFeed.tsx, ChatInput.tsx
�   �   +-- stores/
�   �   �   +-- whiteboardStore.ts      <- Active tool & canvas elements state
�   �   +-- hooks/                      <- [TODO] useSocket.ts, useChats.ts, useRoom.ts
�   �   +-- lib/                        <- [TODO] axios.ts
�   �
�   +-- http-backend/                   <- Express REST API Server (Port 3001)
�   �   +-- src/
�   �       +-- index.ts
�   �       +-- controller/
�   �       �   +-- auth.controller.ts  <- Signup, Login (HttpOnly cookie), Logout
�   �       �   +-- room.controller.ts  <- createRoom, getRoomBySlug
�   �       �   +-- chat.controller.ts  <- getChats (needs user name include)
�   �       +-- middleware/
�   �       �   +-- auth.middleware.ts  <- JWT from req.cookies.token
�   �       +-- routes/
�   �       �   +-- auth.routes.ts
�   �       �   +-- room.routes.ts
�   �       �   +-- chat.routes.ts
�   �       +-- services/
�   �       �   +-- auth.service.ts
�   �       �   +-- room.service.ts
�   �       �   +-- chat.service.ts
�   �       +-- utils/
�   �
�   +-- ws-backend/                     <- Real-Time WebSocket Server (Port 8080)
�       +-- src/
�           +-- index.ts                <- Cookie handshake, join/leave/chat handlers
�           +-- queue/                  <- [TODO] Bull queue & worker
�               +-- chatQueue.ts        <- [TODO] Bull queue init + addChatJob()
�               +-- chatWorker.ts       <- [TODO] Queue processor -> Prisma write
�
+-- packages/
    +-- db/
    �   +-- prisma/
    �       +-- schema.prisma           <- User, Room, Chat, WhiteboardElement models
    +-- backend-common/
    �   +-- src/index.ts                <- JWT_SECRET, HTTP_BACKEND_URL, WS_BACKEND_URL, [TODO] REDIS_URL
    +-- common/
        +-- src/types.ts                <- Zod schemas for signup, login, room, [TODO] WS payloads
```

---

## Core System Architecture

### 1. Authentication Flow (HttpOnly Cookie)

```
                         JWT Token
                             |
                             v
                  HttpOnly Cookie ("linea-token")
                             |
         .-------------------+-------------------.
         v                   v                   v
.------------------. .-----------------. .------------------.
| Next Middleware  | |  Axios Requests | |    WebSocket     |
| (Edge Runtime)   | |(withCredentials)| |  (Handshake)     |
| Route Protection | | Browser auto-   | | Reads cookie from|
|  /canvas/*       | | sends cookie    | | HTTP Upgrade Req |
'------------------' '-----------------' '------------------'
```

### 2. WebSocket Message Queue Architecture (Redis + Bull)

Instead of writing to Postgres synchronously on every chat message (blocking the WS event loop), a **Bull queue** backed by **Redis** decouples DB persistence from real-time broadcasting:

```
Client --> WS Server --> broadcast to room (instant, non-blocking)
                    |
                    v
             Bull Queue (Redis)
             "chat-persist"
                    |
             Queue Worker
             (same ws-backend process)
                    |
            Prisma --> PostgreSQL
```

**Design rationale:**

- **Why not Kafka?** � Kafka is overkill for this scale. Bull + Redis gives ordered, persisted job processing with retry logic at a fraction of the complexity.
- **Queue name:** `chat-persist` � single queue, single worker, processes jobs in-order.
- **Job payload:** `{ roomId, userId, message }`
- **Retry strategy:** 3 attempts, exponential backoff (500ms base).
- **Failure handling:** Failed jobs logged via `queue.on("failed", ...)` event.

---

## Master Implementation TODO Checklist

---

### Phase 1: Shared Packages � Mostly Done ?

- [X] **Prisma Schema (`packages/db/prisma/schema.prisma`)**
  - `User`, `Room`, `Chat`, `WhiteboardElement` models exist
  - `ElementType` enum defined
- [ ] **Decide fate of `WhiteboardElement` model**
  - Option A: Keep for optional HTTP-only canvas snapshot save/load (no real-time sync)
  - Option B: Remove entirely since collaborative canvas is dropped
  - _Action needed: pick one and run `npx prisma migrate dev` if removing_
- [X] **Backend Common** � `JWT_SECRET`, `HTTP_BACKEND_URL`, `WS_BACKEND_URL` exported
- [ ] **Add `REDIS_URL` to `packages/backend-common/src/index.ts`**
  ```ts
  export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
  ```
- [ ] **Extend WS event Zod schemas (`packages/common/src/types.ts`)**
  - `joinRoomSchema` � `{ type: "join_room", roomId: string }`
  - `leaveRoomSchema` � `{ type: "leave_room", roomId: string }`
  - `chatMessageSchema` � `{ type: "chat", roomId: string, message: string }`

---

### Phase 2: HTTP Backend � Mostly Done ?

- [X] Auth Controller � Signup, Login (HttpOnly `linea-token` cookie), Logout
- [X] Room Controller � `createRoom`, `getRoomBySlug` with service layer
- [X] Chat Controller � `getChats` via `chatService.getMessagesByRoomId`
- [X] Auth Middleware � JWT from `req.cookies.token`
- [ ] **Fix chat service to include sender name**
  - In `chat.service.ts` ? `getMessagesByRoomId`, add Prisma include:
    ```ts
    include: { user: { select: { id: true, name: true } } }
    ```
- [ ] **Optional: Whiteboard Snapshot endpoints** _(only if keeping WhiteboardElement model)_
  - `GET /api/whiteboard/:roomId` � fetch saved elements for local canvas load
  - `POST /api/whiteboard/:roomId/snapshot` � bulk upsert elements (user-triggered, not real-time)
  - Add `whiteboard.controller.ts`, `whiteboard.service.ts`, `whiteboard.routes.ts`

---

### Phase 3a: WebSocket Core � Mostly Done ?

- [X] HTTP Upgrade Cookie Handshake � `parse(request.headers.cookie)` ? `linea-token` ? JWT verify
- [X] In-memory `users[]` tracking � `{ ws, rooms[], userId }`
- [X] `join_room` handler � push roomId to `user.rooms`
- [X] `leave_room` handler � filter roomId from `user.rooms`
- [X] `chat` handler � direct DB write + broadcast (to be replaced by queue)
- [ ] **Add `ws.on("close")` handler** � splice disconnected user from `users[]` to prevent memory leak
- [ ] **Fetch `userName` on connect** � after JWT verify, query:

  ```ts
  const dbUser = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });
  ```

  Store `userName` in the `User` interface for broadcast enrichment.
- [ ] **Include `userName` & `userId` in chat broadcast payload**

  ```ts
  { type: "chat", message, userId, userName, roomId }
  ```
- [ ] **Sender filtering** � exclude sender from broadcast (`user.ws !== ws`)

---

### Phase 3b: Redis + Bull Queue System ?? � Not Started ?

> Decouple DB writes from real-time WS broadcast.

#### Setup

- [ ] **Add Redis to dev environment**
  - Option A (Docker): `docker run -d -p 6379:6379 redis:alpine`
  - Option B: Install Redis locally
  - Add `REDIS_URL=redis://localhost:6379` to `apps/ws-backend/.env`
- [ ] **Install Bull packages in `apps/ws-backend`**
  ```bash
  npm install bull ioredis
  npm install -D @types/bull
  ```

#### Queue Module (`apps/ws-backend/src/queue/chatQueue.ts`)

- [ ] Initialize Bull queue connected to Redis:
  ```ts
  import Bull from "bull";
  import { REDIS_URL } from "@repo/backend-common/config";

  export interface ChatJobPayload {
    roomId: number;
    userId: string;
    message: string;
  }

  export const chatQueue = new Bull<ChatJobPayload>("chat-persist", REDIS_URL);

  export const addChatJob = (payload: ChatJobPayload) =>
    chatQueue.add(payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 500 },
    });
  ```

#### Worker Module (`apps/ws-backend/src/queue/chatWorker.ts`)

- [ ] Process jobs and write to Postgres:
  ```ts
  import { chatQueue } from "./chatQueue";
  import { prismaClient } from "@repo/db/client";

  chatQueue.process(async (job) => {
    const { roomId, userId, message } = job.data;
    await prismaClient.chat.create({ data: { roomId, userId, message } });
  });

  chatQueue.on("failed", (job, err) => {
    console.error(`[ChatQueue] Job ${job.id} failed:`, err.message);
  });
  ```
- [ ] Import `chatWorker.ts` in `src/index.ts` so the worker registers on startup

#### Refactor `chat` handler in `src/index.ts`

- [ ] Replace synchronous `await prismaClient.chat.create(...)` with:
  ```ts
  // 1. Enqueue DB write (non-blocking)
  addChatJob({ roomId: Number(parsedData.roomId), userId, message: parsedData.message });

  // 2. Broadcast to room immediately
  users.forEach((user) => {
    if (user.rooms.includes(parsedData.roomId) && user.ws !== ws) {
      user.ws.send(JSON.stringify({
        type: "chat",
        message: parsedData.message,
        userId,
        userName: currentUser.userName,
        roomId: parsedData.roomId,
      }));
    }
  });
  ```

---

### Phase 4: Frontend Infrastructure � In Progress ??

#### 4a. Zustand Stores

- [X] `stores/whiteboardStore.ts` � active tool & elements state
- [ ] **`stores/authStore.ts`**
  ```ts
  // State: { id, name, email } | null
  // persist middleware to localStorage
  ```
- [ ] **`stores/socketStore.ts`**
  ```ts
  // State: { socket: WebSocket | null, status: "idle" | "connecting" | "connected" | "disconnected" }
  ```
- [ ] **`stores/chatStore.ts`**
  ```ts
  // State: { messages: ChatMessage[] }
  // ChatMessage: { id, userId, userName, message, roomId, createdAt }
  // Actions: addMessage, setMessages, clearMessages
  ```

#### 4b. Custom Hooks

- [ ] **`hooks/useSocket.ts`** � WS lifecycle:
  1. Open `new WebSocket(WS_URL)` on mount
  2. Send `{ type: "join_room", roomId }` on open
  3. On `message` ? parse and dispatch to `chatStore.addMessage`
  4. Send `{ type: "leave_room", roomId }` + `socket.close()` on unmount
  5. Update `socketStore` status throughout
- [ ] **`hooks/useChats.ts`** � fetch `GET /api/chat/:roomId` ? seed `chatStore.setMessages`
- [ ] **`hooks/useRoom.ts`** � fetch `GET /api/room/:slug` ? return room metadata

#### 4c. Infrastructure

- [ ] **`lib/axios.ts`** � Axios instance:
  - `baseURL: HTTP_BACKEND_URL`
  - `withCredentials: true`
  - Response interceptor: on 401 ? clear `authStore` ? `router.push("/login")`
- [ ] **`middleware.ts`** � Edge middleware protecting `/canvas/*`:
  ```ts
  if (!request.cookies.get("linea-token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  ```

---

### Phase 5: Chat UI � Not Started ?

- [ ] **`components/chat/ChatFeed.tsx`**
  - Scrolling message list from `chatStore`
  - Display `userName`, message text, relative timestamp
  - Auto-scroll to bottom on new message
  - Distinguish own vs. others (right/left alignment or color)
- [ ] **`components/chat/ChatInput.tsx`**
  - Controlled text input + send button (or Enter to send)
  - On submit: send `{ type: "chat", roomId, message }` via WS socket from `socketStore`
  - Optimistic UI: push to `chatStore` immediately
- [ ] **Integrate Chat into `app/canvas/[roomId]/page.tsx`**
  - Split-pane layout: Canvas (left/main) | Chat (right sidebar)
  - Room name & online user count in header bar
  - Collapsible chat panel

---

### Phase 6: Canvas (Local Only, No Real-Time Sync) � In Progress ??

- [X] `components/whiteboard/Canvas.tsx` � shell exists
- [X] `stores/whiteboardStore.ts` � tool state exists
- [ ] **Complete rendering pipeline**
  - `roughjs` for shapes (Rectangle, Ellipse, Diamond, Line, Arrow)
  - `perfect-freehand` for freedraw paths
  - Pan (Space + drag / middle-click) and zoom (Ctrl + wheel)
- [ ] **Tool implementations**
  - **Pointer / Select** � click to select, drag to move, resize handles on corners
  - **Shapes** � drag to draw Rectangle, Ellipse, Diamond, Line, Arrow
  - **Freedraw** � smooth path via `perfect-freehand`
  - **Text** � click to open inline textarea, commit on blur
  - **Eraser** � click/drag over elements to delete
- [ ] **`components/whiteboard/Toolbar.tsx`**
  - Tool buttons with keyboard shortcuts: `V` Select, `R` Rect, `E` Ellipse, `D` Diamond, `L` Line, `A` Arrow, `F` Freehand, `T` Text, `X` Eraser
  - Stroke color & fill color pickers
- [ ] **`components/whiteboard/PropertyPanel.tsx`**
  - Appears on element selection
  - Edit stroke color, fill, stroke width, roughness, opacity
- [ ] **Optional: Local Canvas Snapshot Save**
  - "Save" button ? `POST /api/whiteboard/:roomId/snapshot`
  - On room load ? `GET /api/whiteboard/:roomId` to restore elements

---

### Phase 7: Auth & Room Management UI � Not Started ?

- [ ] **`app/(auth)/login/page.tsx`** � Login form ? `POST /api/auth/login`
- [ ] **`app/(auth)/signup/page.tsx`** � Signup form ? `POST /api/auth/signup`
- [ ] **`app/page.tsx`** (Dashboard) � List user's rooms + "Create Room" button
- [ ] **Create Room Modal** � room name input ? `POST /api/room/create` ? redirect to `/canvas/[roomId]`
- [ ] **Shareable Invite Links** � copy link with `?slug=<roomSlug>`; auto-redirect to canvas on join

---

### Phase 8: Polish & Production Readiness � Not Started ?

- [ ] Error Boundaries for Canvas and Chat
- [ ] Loading skeletons for chat history, WS connecting state
- [ ] Toast notifications (connection errors, save success, room join failures)
- [ ] Dark mode � consistent theme across all pages
- [ ] Responsive layout � mobile-friendly sidebar, collapsible chat
- [ ] `.env.example` files for all apps
- [ ] `docker-compose.yml` � `postgres`, `redis`, `http-backend`, `ws-backend`
- [ ] `turbo build` passes without type errors

---

## Open Decisions

| # | Decision                                                                                    | Status      |
| - | ------------------------------------------------------------------------------------------- | ----------- |
| 1 | Keep`WhiteboardElement` Prisma model for optional HTTP snapshot save/load, or remove it?  | ? Pending   |
| 2 | Bull vs. BullMQ  BullMQ is the modern Bull successor (Node 18+ only). Worth the switch?     | ? Pending   |
| 3 | Redis: local Docker vs. Upstash (managed) for dev/staging                                   | ? Pending   |
| 4 | Cookie name consistency:`linea-token` (WS) vs. `token` (HTTP middleware) — needs audit | ⚠️ Verify |

---

## Future Updates

> These features are **out of current scope** and are planned as future milestones once the core collaborative canvas and chat system is stable. They require non-trivial architectural changes (CRDT, operation logs, persistent undo stacks).

### Advanced Collaboration

- **Conflict-free Synchronization**

  - Adopt a CRDT (Conflict-free Replicated Data Type) strategy — e.g. Yjs or Automerge — so concurrent edits from multiple users are merged automatically without last-write-wins conflicts.
  - Elements become CRDT documents; each user's changes are mergeable operations rather than raw state snapshots.
- **Offline Editing**

  - Allow users to continue drawing while disconnected from the WS server.
  - Buffer pending `draw_element` operations locally (IndexedDB or in-memory queue).
  - Show a visual "offline" indicator; disable chat send while offline.
- **Merge After Reconnect**

  - On WS reconnect, replay the buffered offline operations against the current server state.
  - Server resolves any conflicts using vector clocks or CRDT merge semantics before broadcasting merged state to all room members.

### History & Undo/Redo

- **Undo Across All Users**

  - Global undo: any user in the room can undo their own last action, and all others see the element revert.
  - Requires a per-room, per-user operation log persisted in DB (or Redis) with ordered action entries.
- **Redo Across Clients**

  - After an undo, users can redo the action — the re-applied operation is broadcast to all room members.
  - Redo stack is invalidated if a conflicting operation is applied by another user in between.
- **Restore Deleted Elements**

  - Soft-delete elements (add `isDeleted: true` flag to `WhiteboardElement` model) instead of hard-deleting.
  - "Restore" action in the UI shows recently deleted elements and allows them to be un-deleted.
  - Elements remain in DB with `isDeleted: true` for a configurable TTL before permanent removal.
