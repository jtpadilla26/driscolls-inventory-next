# Rankins Inventory — App v2 (Next.js 14 + Tailwind)

## Quickstart
1. Node 18+
2. `npm install`
3. `npm run dev` → http://localhost:3000

## Structure
- `app/` App Router (Next 14)
- `app/(public)/login` Public login route
- `app/api/*` Route handlers (API)
- `middleware.ts` Simple auth gate (looks for Supabase cookies)

## Next
- Wire Supabase auth (`@supabase/ssr`)
- Add inventory pages (list + import/export)
- Add Zod validation and dropdown export for category/unit
