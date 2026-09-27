# Mike Comeback

A small, mobile-first PWA for a realistic return to fitness.

**3 planned sessions a week = a successful week.** One run, one full-body weights
session, one bike *or* hike. Anything else is a bonus. No streaks, no guilt, no
calorie counting, no social feed.

- **Today** – this week at a glance: what's done, what's left, what's next
- **Plan** – every week of the programme; open any session
- **Progress** – consistency, running, cycling, weights, bodyweight, resting HR
- **Settings** – programme start / jump to a week, backup & restore

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # logic tests (Node's built-in runner)
npm run build      # typecheck + production build in dist/
```

Requires Node 24+ (tests use Node's native TypeScript support).

## Edit the programme

Everything about the plan lives in **[`src/data/programme.ts`](src/data/programme.ts)**:

- Change the weights session everywhere → edit `FULL_BODY_EXERCISES`
- Change a run → edit that week's `items`, using `walk(5)`, `run(4)`, `runKm(5)`
  and `repeat(4, [run(4), walk(1)])`
- Add or remove a week → add or remove an entry in `weeks` (everything else adapts)
- Change bike/hike targets → `BIKE_OR_HIKE(min, max)`
- Change what counts as a full week → `target`

You can also edit any session inside the app (Workout → **Edit workout**). Those
edits are saved on the device as overrides on top of `programme.ts`, for one week
or that week onwards, and **Reset to plan** removes them.

## Data

V1 stores everything in `localStorage` on the device — no account, no server.
Use **Settings → Download backup** now and then; **Restore** loads it back
(e.g. on a new phone).

Adding cloud sync later: implement the `StorageAdapter` interface in
[`src/lib/storage.ts`](src/lib/storage.ts) (e.g. with Supabase) and swap it in
[`src/lib/store.ts`](src/lib/store.ts). Logs and check-ins already carry ids and
`createdAt`/`updatedAt` timestamps for merging.

## Install on your phone

Deploy it (below), open the URL, then:

- **iPhone:** Safari → Share → *Add to Home Screen*
- **Android:** Chrome menu → *Install app*

## Deploy

It's a static site (`dist/`) with hash routing, so it works on any static host
at any path.

**GitHub Pages:** repo *Settings → Pages → Source: GitHub Actions*, then run the
*Deploy to GitHub Pages* workflow. To deploy on every push to `main`, add a
repository variable `PAGES_ENABLED = true`. (Pages sites are public; your
training data never leaves your phone.)

**Netlify / Vercel / Cloudflare Pages:** build command `npm run build`, output
directory `dist`.

## Structure

```
src/
  data/programme.ts     the plan (edit me)
  data/types.ts         data shapes
  lib/week.ts           current week, completion, summaries
  lib/store.ts          app state + actions
  lib/storage.ts        persistence adapter (localStorage)
  lib/dates.ts, format.ts, logs.ts
  screens/              Today, Plan, Workout, EditWorkout, LogWorkout, Progress, Settings
  components/           SessionCard, Sparkline, Field, Icon, Screen
  router.ts             tiny hash router
public/                 manifest, service worker, icons
scripts/make-icons.mjs  regenerates the icons
```

Runtime dependency: Preact. That's it.
