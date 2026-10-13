# AUTOMAN STAR Real Estate — Next.js Luxury UI

Premium motion-driven **design prototype** for a Dubai/UAE real estate website, built with Next.js App Router, TypeScript, Framer Motion, and plain responsive CSS.

## Step 1 — prerequisites
- Node.js 20.9+ (recommended Node 22)
- npm

## Step 2 — install
```bash
npm install
```

## Step 3 — development
```bash
npm run dev
```
Open http://localhost:3000

## Step 4 — inspect screens
- `/` — cinematic homepage with motion and working search bar
- `/properties` — filter, sort, browse, and save demo listings
- `/properties/skyline-penthouse-downtown` — example detailed property page and enquiry form
- `/about` — brand-story layout
- `/contact` — enquiry UI
- `/dashboard` — **unsecured demo only** of internal property inventory and enquiries saved in browser

## Step 5 — production build
```bash
npm run build
npm run start
```

## Step 6 — change sample content
Edit `lib/data.ts`. The 6 listings are **fabricated demonstration data**, and photo assets are illustrative Unsplash images. Do not publish these as actual property advertisements.

## Included
- Cinematic background, concentric rotating 3D-style orbital elements, parallax-like motion, reveals, tasteful hover transforms
- Responsive homepage + search + listing + detail + contact + about
- URL-based searchable query parameters and frontend filtering/sorting
- Saved properties in browser localStorage
- Local-browser demo enquiry flow
- Dubai/AED property formatting and neighborhood browsing
- Accessibility basics and reduced-motion support

## Not included (before production)
- Authentication, roles/RBAC and production admin APIs
- Persistent database/Postgres and actual listing CRUD
- Secure storage for title deeds/owner documents
- Genuine WhatsApp, email sending, CRM delivery, appointment booking
- Official logo, final branding, verified listings, property permits and contact info
- Google Maps API-backed synchronized map/list search
- Payments, AI tools, Arabic localization
- Actual 3D architectural mesh/model; present visual depth uses CSS/Framer Motion

`/dashboard` is deliberately an unauthenticated **mock interface**, not a production CRM. `/contact` submissions are saved only in the local browser for the demo. **Do not store real customer records in it.**

The attached proposal references a React + Laravel + MySQL stack, while a milestone mentions WordPress. This code is an explicitly requested alternative Next.js **UI/UX prototype**, not a literal implementation of every PDF feature.

## Suggested next engineering phases
1. Approve brand, Figma/wireframes and mobile screens; obtain RERA/trade license details and property content.
2. Add PostgreSQL + secure FastAPI/Next.js APIs, login, RBAC, uploads, property CRUD, schema validation and audit events.
3. Add real enquiry delivery, CRM workflows, map integration, PDF brochures, consent/privacy controls, analytics and UAT.
4. Security hardening, uptime/backup monitoring, performance budget, CI/CD and production deployment.

## Milestone 01 — Premium homepage and 3D motion

- CSS-3D architectural hero composition with mouse-controlled perspective on desktop, warm architectural lighting, art-direction label, and ambient rings. **Concept visualization only; not a real UAE building, property listing, or downloadable 3D asset.**
- Motion entrances via existing Framer Motion dependency; respects `prefers-reduced-motion`.
- Sticky glass-blur navigation, accessible mobile toggle and Escape-to-close behavior.
- Improved depth and hover transitions on property cards and community tiles.
- Optimized responsive hero fallback: architectural decoration fades back on mobile so text and search remain usable.

No WebGL, large model downloads, API keys, or new npm dependencies are required for this milestone. For real interactive GLB buildings, 360 tours or a 3D map, a later R3F/Three.js milestone with optimized assets is needed.

## Milestone 01b: Real-time Three.js architecture

The homepage architectural study now renders actual WebGL geometry via `three` and `@react-three/fiber` in `components/ThreeArchitecture.tsx`. It includes three procedural skyscrapers, instanced illuminated windows, physically inspired materials, multiple lights, a platform and damped cursor-reactive camera/object movement. No external GLB model or paid asset is necessary.

- `components/ArchitecturalScene.tsx` lazy-loads the scene client-side; devices lacking WebGL get a CSS fallback.
- Users with **prefers-reduced-motion** receive the lightweight static illustration.
- Touch/mobile disables cursor interaction; device pixel ratio is capped for performance.
- The building is a **conceptual architectural illustration**, not a real Dubai development or property listing.
- Run `npm install` after upgrading to install `three`, `@react-three/fiber`, and `@types/three`.

## Milestone 01c — GLB + cinematic scrolling
- `public/models/automan-architectural-concept.glb` is a custom-generated architectural **concept** model, not a real property.
- The hero loads this `.glb` with Three.js `GLTFLoader` and applies a PMREM room environment for approximate reflections. This is *not* physically accurate on-site lighting or a photographic twin.
- Below the hero, the `ArchitecturalStory` section uses a second 3D scene and scroll progress to guide camera placement and orientation across three chapters. It lazy-mounts the scene near the viewport.
- Reduced-motion visitors see a static CSS architectural fallback. WebGL failure still requires environment-dependent verification.
- Animated building and extra render canvas cost GPU resources. Test low-end/mobile devices and optimize before shipping publicly.

## Milestone 01D — interactive residence experience

- New `/experience` page, accessible from navigation and the homepage.
- Procedural Three.js demo residence with living area, kitchen/dining area, bedroom suite, conceptual balcony and skyline.
- Interactive floor concepts (L12 / L24 / L32), room navigation, light/dark material palette, reset, and eased camera animation.
- Responsive presentation, keyboard-accessible buttons, reduced-motion support and WebGL availability fallback.
- All geometry and views are **illustrative**. This is **not a scanned, architect-approved, or listed apartment**. Do not present it as a specific available UAE property.
- No photographs, floor-plan measurements, downloadable brochures or true immersive interior GLB files are included. These require authorized project data/assets.


## Milestone 01E — Guided residence tour

`/experience` now includes accessible room hotspot buttons, an eight-second guided tour with pause, an interactive conceptual floor plan with numbered navigation points, guided progress, and a reset action. The plan is *illustrative and not to scale*. The visualizations do not correspond to an existing property.

Use `npm install`, `npm run dev`, then visit `/experience`. Run `npm run build` before production deployment.


## Phase 1 — End-to-end UI prototype (October 2026)
Added local demo admin subpages: `/dashboard`, `/dashboard/properties`, `/dashboard/leads`, `/dashboard/visits`, `/dashboard/documents`, `/dashboard/settings`. Property detail pages now feature a mock viewing request form. Public enquiries also appear in local demo lead pipeline. `/saved` and `/compare` surfaces have been created for browser-local collections (card integrations depend on existing card controls). **All demo data is fictional or browser-local; no auth, secure storage or actual API integrations are implemented.**
