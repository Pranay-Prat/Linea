# Linea Collaborative Whiteboard - Implementation TODO

## Project Overview

Build a real-time collaborative whiteboard application (HTML Canvas + rough.js) with room-based collaboration, using the existing Turborepo monorepo infrastructure.

---

## Phase 1: Architecture & Data Models

### 1.1 Extend Prisma Schema (`packages/db/prisma/schema.prisma`)

- [ ] Add `WhiteboardScene` model for room-scene mapping
- [ ] Add `WhiteboardElement` model for canvas elements
- [ ] Add `ElementVersion` tracking for conflict resolution
- [ ] Support element types: rectangle, ellipse, diamond, arrow, line, freedraw, text, image, embed
- [ ] Add tombstone (`isDeleted`) for soft deletes
- [ ] Add version/versionNonce for conflict resolution (last-write-wins)

Notes:

- Use `version` and `versionNonce` for LWW conflict resolution.
- Keep element `isDeleted` as a tombstone to support undo/history.

```prisma
model WhiteboardScene {
  id        String   @id @default(uuid())
  roomId    Int      @unique
  room      Room     @relation(fields: [roomId], references: [id])
  elements  WhiteboardElement[]
  updatedAt DateTime @updatedAt
}

model WhiteboardElement {
  id              String   @id @default(uuid())
  sceneId         String
  scene           WhiteboardScene @relation(fields: [sceneId], references: [id])
  type            ElementType
  version         Int      @default(1)
  versionNonce    Int      @default(0)
  isDeleted       Boolean  @default(false)
  x               Float
  y               Float
  width           Float?
  height          Float?
  angle           Float    @default(0)
  strokeColor     String
  backgroundColor String?
  strokeWidth     Float
  strokeStyle     StrokeStyle
  fillStyle       FillStyle
  roughness       Float
  opacity         Float
  roundness       Float?
  seed            Int?
  points          Float[]? // For freedraw/line/arrow
  text            String?  // For text elements
  fontSize        Float?
  fontFamily      FontFamily?
  textAlign       TextAlign?
  verticalAlign   VerticalAlign?
  fileId          String?  // For images
  groupIds        String[]?
  link            String?  // For link binding
  locked          Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ElementType {
  RECTANGLE
  ELLIPSE
  DIAMOND
  ARROW
  LINE
  FREEDRAW
  TEXT
  IMAGE
  EMBED
}

enum StrokeStyle { SOLID DASHED DOTTED }
enum FillStyle { HACHURE SOLID CROSS_HATCH DOTS DASHED ZIGZAG ZIGZAG_LINE }
enum FontFamily { VIRGIL HELVETICA CASCADIA }
enum TextAlign { LEFT CENTER RIGHT }
enum VerticalAlign { TOP MIDDLE BOTTOM }
```

### 1.2 Shared Types (`packages/common/src/types.ts`)

- [ ] Define Zod schemas for all element types
- [ ] Define WebSocket message types for collaboration
- [ ] Export TypeScript interfaces for frontend/backend sharing

Notes:

- Keep message schemas small and versioned (v1, v2) for forward compatibility.

---

## Phase 2: Backend - HTTP API (`apps/http-backend`)

### 2.1 Whiteboard Controller (`src/controller/whiteboard.controller.ts`)

- [ ] `GET /api/whiteboard/:roomId` - Fetch full scene (elements + metadata)
- [ ] `POST /api/whiteboard/:roomId/sync` - Full scene sync (for initialization)
- [ ] `PATCH /api/whiteboard/:roomId/elements` - Batch element updates (versioned)
- [ ] `DELETE /api/whiteboard/:roomId/elements/:id` - Soft delete element
- [ ] `POST /api/whiteboard/:roomId/snapshot` - Create scene snapshot

Notes:

- `POST /sync` should validate elements with Zod and return server-assigned versions.
- Snapshot endpoint used by workers to persist compacted state.

### 2.2 File Upload (`src/controller/file.controller.ts`)

- Images/files: SKIPPED for MVP. Add later if needed (S3 recommended).

If enabled later:

- `POST /api/files/upload` - Upload images (return fileId + URL)
- `GET /api/files/:fileId` - Serve uploaded files (signed URLs preferred)
- Validate file types, size limits

### 2.3 Routes & Middleware

- [ ] Add whiteboard routes to `src/routes/whiteboard.routes.ts`
- [ ] Add file routes to `src/routes/file.routes.ts` (if enabled)
- [ ] Register in `src/index.ts`

---

## Phase 3: Backend - WebSocket Server (`apps/ws-backend`)

### 3.1 Collaboration Protocol (`src/index.ts`)

- WebSocket auth: require immediate `AUTH` message after open (client sends JWT). Do NOT use token in URL.
- Use native `ws` server. Rely on Redis + BullMQ for multi-instance broadcast and durable writes.
- Extend `User` interface with `userName`, `color`, `cursor`
- Implement message types:
  - `AUTH` - initial auth message (bearer token)
  - `INIT` - Full scene sync on join
  - `UPDATE` - Incremental element updates
  - `DELETE` - Element deletion (tombstone)
  - `CURSOR` - Pointer position (volatile)
  - `SELECTION` - Selected element IDs
  - `VIEWPORT` - User's visible bounds (for follow mode)
  - `IDLE_STATUS` - Active/away/idle state
  - `USER_JOIN` / `USER_LEAVE` - Presence
- Implement reconciliation logic (version-based merge; LWW + `versionNonce` tie-breaker)
- Broadcast throttling: batch updates into 50–200ms windows (configurable)
- Periodic full sync: configurable cadence (default 30s) to prevent drift
- Skip broadcasting back to sender for optimistic updates when update is confirmed by worker

Notes on durability & scaling:

- WS instances should publish received element-change jobs to BullMQ (or Redis stream) instead of writing directly to DB.
- Worker(s) consume jobs, persist batched updates to DB, and publish consolidated broadcasts via Redis pub/sub.

### 3.2 Room Management

- Track users per room with colors/usernames in Redis (not process memory)
- Handle reconnection with scene recovery (request `GET /api/whiteboard/:roomId` on reconnect)
- Clean up empty rooms after timeout (use Redis TTL)
- Soft cap rooms: implement lazy-loading/pagination of elements for very large scenes (soft cap strategy)

---

## Phase 4: Frontend - Core Infrastructure (`apps/frontend`)

### 4.1 Dependencies

- Frontend rendering: HTML Canvas + `roughjs` (for sketchy styles) — do NOT add Excalidraw.
- Add `roughjs` and a small helper layer mapping element models to canvas drawing commands.
- Use native WebSocket client (with `ReconnectingWebSocket` helper) to match `ws` server.
- Add `zustand` for client state
- Add `@tanstack/react-query` for server data
- Add `perfect-freehand` for freedraw smoothing

### 4.2 State Management (`stores/`)

- [ ] `whiteboardStore.ts` - Elements, tool state, selection, history
- [ ] `collabStore.ts` - Collaborators, cursors, presence, connection status
- [ ] `uiStore.ts` - Toolbar, sidebar, zoom, theme, modals

### 4.3 TanStack Query Hooks (`hooks/queries/`)

- [ ] `useWhiteboardScene(roomId)` - Fetch scene data
- [ ] `useWhiteboardMutations()` - Update/delete elements

### 4.4 WebSocket Hook (`hooks/useWhiteboardSocket.ts`)

- [ ] Connect with roomId + AUTH message (send JWT after open)
- [ ] Handle all message types
- [ ] Reconcile remote changes with local state
- [ ] Optimistic updates for local changes
- [ ] Auto-reconnection with exponential backoff

---

## Phase 5: Frontend - Canvas & Tools

### 5.1 Main Canvas Component (`components/whiteboard/WhiteboardCanvas.tsx`)

- [ ] Infinite canvas with zoom/pan (wheel + space+drag)
- [ ] Render elements from store using Canvas + roughjs
- [ ] Handle tool interactions (pointer, selection, drawing)
- [ ] Grid/snap-to-grid overlay
- [ ] Dark mode support

### 5.2 Tool Implementation (`components/whiteboard/tools/`)

- [ ] **Pointer/Select** - Click, drag, multi-select, resize, rotate
- [ ] **Rectangle** - Draw rectangles/rounded rectangles
- [ ] **Ellipse** - Draw circles/ellipses
- [ ] **Diamond** - Draw diamonds/rhombuses
- [ ] **Arrow** - Draw arrows with binding support
- [ ] **Line** - Draw straight lines
- [ ] **Freedraw** - Smooth freehand drawing (`perfect-freehand`)
- [ ] **Text** - Add/edit text elements
- [ ] **Eraser** - Delete elements on click/drag
- [ ] **Image** - SKIPPED for MVP (defer file upload + storage)
- [ ] **Frame** - Optional: frame/section tool

### 5.3 Toolbar (`components/whiteboard/Toolbar.tsx`)

- [ ] Tool buttons with keyboard shortcuts
- [ ] Stroke/fill color pickers
- [ ] Stroke width slider
- [ ] Stroke style (solid/dashed/dotted)
- [ ] Fill style selector
- [ ] Opacity, roughness, roundness sliders
- [ ] Font family/size/align for text
- [ ] Undo/Redo buttons
- [ ] Zoom controls (reset, fit, %, in/out)

### 5.4 Property Panel (`components/whiteboard/PropertyPanel.tsx`)

- [ ] Context-sensitive properties for selected element(s)
- [ ] Multi-element property editing
- [ ] Lock/unlock, duplicate, delete actions

---

## Phase 6: Collaboration Features

### 6.1 Remote Cursors (`components/whiteboard/CollaboratorCursors.tsx`)

- [ ] Render remote user cursors with name labels
- [ ] Cursor color per user
- [ ] Show selection highlights for remote users
- [ ] Idle/away status indicators

### 6.2 User Presence (`components/whiteboard/UserPresence.tsx`)

- [ ] Avatar stack in toolbar
- [ ] User list panel with status
- [ ] "Follow user" mode (viewport sync)
- [ ] Join/leave notifications

### 6.3 Conflict Resolution

- [ ] Version-based merge (last-write-wins with versionNonce tiebreaker)
- [ ] Tombstone handling for deletions
- [ ] Optimistic UI with server reconciliation

---

## Phase 7: Room Management

### 7.1 Room Creation (`components/room/CreateRoomModal.tsx`)

- [ ] Room name input
- [ ] Generate unique slug
- [ ] Optional: password protection
- [ ] Optional: read-only link generation

### 7.2 Room Page (`app/canvas/[roomId]/page.tsx`)

- [ ] Server-side scene fetch for SSR
- [ ] Client-side hydration
- [ ] Loading/error states
- [ ] SEO metadata

### 7.3 Room Settings (`components/room/RoomSettings.tsx`)

- [ ] Rename room
- [ ] Regenerate invite link
- [ ] Toggle read-only link
- [ ] Delete room (admin only)
- [ ] Export scene (.excalidraw, PNG, SVG)

---

## Phase 8: Export & Import

### 8.1 Export (`lib/export.ts`)

- [ ] Export to `.excalidraw` JSON (elements + appState + files)
- [ ] Export to PNG (with/without background)
- [ ] Export to SVG
- [ ] Export to clipboard (image + JSON)
- [ ] Export selected elements only

### 8.2 Import (`lib/import.ts`)

- [ ] Import `.excalidraw` file
- [ ] Paste image from clipboard
- [ ] Drag & drop image files
- [ ] Import SVG as elements

---

## Phase 9: Advanced Features

### 9.1 Arrow Binding

- [ ] Bind arrow start/end to elements
- [ ] Auto-update arrow on element move
- [ ] Label support on arrows

### 9.2 Shape Libraries

- [ ] Built-in shape library
- [ ] Custom shape library support
- [ ] Search/filter shapes

### 9.3 Grid & Snap

- [ ] Toggle grid visibility
- [ ] Snap to grid
- [ ] Snap to elements
- [ ] Smart guides

### 9.4 Keyboard Shortcuts

- [ ] Full shortcut map (V=select, R=rect, E=ellipse, A=arrow, L=line, F=freedraw, T=text, Delete/Backspace=erase, etc.)
- [ ] Customizable shortcuts

### 9.5 Touch/Mobile Support

- [ ] Touch gestures (pinch zoom, pan)
- [ ] Touch tool interactions
- [ ] Virtual keyboard handling

---

## Phase 10: Persistence & Offline

### 10.1 Local Storage

- [ ] Auto-save to localStorage (debounced)
- [ ] Restore on page load
- [ ] Conflict resolution with server on reconnect

- Local snapshots should be merged carefully with server snapshots (use versions)

### 10.2 PWA Support

- [ ] Service worker for offline
- [ ] Manifest for installability
- [ ] Background sync for pending changes

---

## Phase 11: Security & Encryption

### 11.1 End-to-End Encryption (Excalidraw-style)

- DEFERRED for MVP. Implement later as an optional mode.
- If enabled later: use URL-hash room key, client-side encrypt/decrypt payloads, and store only encrypted blobs on server.

### 11.2 Access Control

- [ ] Room owner/admin permissions
- [ ] Read-only vs edit permissions
- [ ] Password-protected rooms

---

## Phase 12: Testing & Polish

### 12.1 Testing

- [ ] Unit tests for reconciliation logic
- [ ] Integration tests for WebSocket flow
- [ ] E2E tests for critical user flows
- [ ] Visual regression tests for canvas

### 12.2 Performance

- [ ] Virtualized rendering for large scenes
- [ ] Canvas layering (static vs dynamic)
- [ ] Web Workers for heavy computation
- [ ] Memory leak prevention

### 12.3 Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Focus management

---

## File Structure Overview

```
apps/frontend/
├── app/
│   ├── canvas/[roomId]/
│   │   ├── page.tsx           # RSC shell
│   │   └── WhiteboardClient.tsx  # Client component
│   ├── (auth)/
│   └── layout.tsx
├── components/
│   ├── whiteboard/
│   │   ├── WhiteboardCanvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── PropertyPanel.tsx
│   │   ├── CollaboratorCursors.tsx
│   │   ├── UserPresence.tsx
│   │   ├── tools/
│   │   │   ├── PointerTool.tsx
│   │   │   ├── RectangleTool.tsx
│   │   │   ├── EllipseTool.tsx
│   │   │   ├── ArrowTool.tsx
│   │   │   ├── LineTool.tsx
│   │   │   ├── FreedrawTool.tsx
│   │   │   ├── TextTool.tsx
│   │   │   ├── EraserTool.tsx
│   │   │   └── ImageTool.tsx
│   │   └── ui/
│   │       ├── ColorPicker.tsx
│   │       ├── Slider.tsx
│   │       └── Button.tsx
│   ├── room/
│   │   ├── CreateRoomModal.tsx
│   │   └── RoomSettings.tsx
│   └── providers/
│       └── QueryProvider.tsx
├── stores/
│   ├── whiteboardStore.ts
│   ├── collabStore.ts
│   └── uiStore.ts
├── hooks/
│   ├── queries/
│   │   ├── useWhiteboardScene.ts
│   │   └── useWhiteboardMutations.ts
│   └── useWhiteboardSocket.ts
├── lib/
│   ├── export.ts
│   ├── import.ts
│   ├── encryption.ts
│   ├── perfect-freehand.ts
│   └── utils.ts
└── types/
    └── whiteboard.ts
```

---

## Priority Order (Suggested)

1. **Foundation** (Phases 1-2): Data models, HTTP API
2. **Real-time** (Phase 3): WebSocket collaboration
3. **Core Canvas** (Phases 4-5): Rendering, tools, toolbar
4. **Collaboration UI** (Phase 6): Cursors, presence
5. **Room UX** (Phase 7): Creation, settings, export
6. **Advanced** (Phases 8-11): Import/export, binding, encryption
7. **Polish** (Phase 12): Testing, performance, a11y

---

## Open Questions

Resolved choices (applied):

1. **Encryption**: DEFERRED for MVP (add later if needed)
2. **Socket library**: Use native `ws` (server) + native WS client on frontend
3. **Canvas library**: Use HTML Canvas + `roughjs` (custom drawing layer)
4. **Database**: Store current state + element version history; keep versions for undo/audit
5. **Mobile**: Desktop-first MVP; add touch support after core features

Additional decisions provided by the user:

- Snapshot cadence: Configurable; default 30s
- Room size limit: Soft cap with lazy-loading/pagination
- History retention: 90 days

These are recorded in session planning and should be used when implementing models, workers, and API behavior.

---

## Notes

- Follow existing patterns in `implementation_plan.md` for auth, stores, queries
- Reuse `@repo/db`, `@repo/common`, `@repo/backend-common` packages
- Maintain consistency with shadcn/ui + Tailwind CSS
- Consider extracting whiteboard logic to `@repo/whiteboard` package for reuse
