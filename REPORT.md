# Rebuild Package — What’s Included
- Canonical configs: `.npmrc`, `package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `.gitignore`
- App Router pages: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/dashboard/page.tsx`, `app/(public)/login/page.tsx`
- API stub: `app/api/items/route.ts`
- Auth-gate skeleton: `middleware.ts`

## How to Use
1. Create a branch (e.g., `rewrite/clean-foundation`).
2. Upload **contents** of this ZIP (not the zip) to that branch (replace conflicts).
3. Open PR → Merge.
4. Run `npm install && npm run dev` and verify `/dashboard`, `/login`, `/api/items`.
