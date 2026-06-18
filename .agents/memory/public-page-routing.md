---
name: Public page routing
description: Which PublicPage file is actually used in the app router
---

The App.tsx router imports `PublicPage` from `@/pages/PublicPage.tsx`.
There is also a `src/components/public/PublicPage.tsx` (presentational component) that is NOT wired to the router.

**Why:** The pages/PublicPage.tsx is the data-fetching container (useEffect + Supabase). 
The components/public/PublicPage.tsx was an earlier iteration meant to accept trips as props.

**How to apply:** Always edit `src/pages/PublicPage.tsx` for the public landing page.
Changes to `src/components/public/PublicPage.tsx` alone will have no visible effect.
