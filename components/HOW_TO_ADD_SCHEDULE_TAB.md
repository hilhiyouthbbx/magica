# How to Add the Daily Schedule Tab to Your Existing Camp Hub Admin

## Step 1 — Copy the component file

Put `ScheduleTab.tsx` into your project:

```
Dropbox/magica/components/camp-hub/ScheduleTab.tsx
```

(Create the `camp-hub/` subfolder inside `components/` if it doesn't exist.)

---

## Step 2 — Find your Camp Hub admin page

Your Camp Hub admin file is most likely one of these:
- `app/admin/camp-hub/page.tsx`
- `app/camp-hub/page.tsx`
- `app/(admin)/camp-hub/page.tsx`

Open it in VS Code and look for the **tab list** — it will look something like this:

```tsx
// It might look like this:
const tabs = ["Camper Roster", "Check-In", "Teams & Rosters", "Standings", "Bracket", "Individual Events", "Settings"]

// Or like this:
<button onClick={() => setTab("roster")}>Camper Roster</button>
<button onClick={() => setTab("checkin")}>Check-In</button>
// etc.
```

---

## Step 3 — Add the import at the top of the file

At the top of your Camp Hub page file, add:

```tsx
import { ScheduleTab } from "@/components/camp-hub/ScheduleTab";
```

---

## Step 4 — Add "Schedule" to the tab list

Find where the other tabs are listed and add `"Schedule"` (or `"Daily Schedule"`):

**If tabs are in an array:**
```tsx
const tabs = [
  "Camper Roster",
  "Check-In", 
  "Teams & Rosters",
  "Standings",
  "Bracket",
  "Individual Events",
  "Schedule",      // ← ADD THIS
  "Settings",
];
```

**If tabs are hard-coded buttons:**
```tsx
<button onClick={() => setActiveTab("schedule")}>
  Schedule
</button>
```

---

## Step 5 — Render the ScheduleTab component

Find where the other tab content is rendered (the big `if/else` or `switch` block):

```tsx
{activeTab === "roster"   && <CamperRoster />}
{activeTab === "checkin"  && <CheckIn />}
{activeTab === "teams"    && <TeamsRosters />}
{activeTab === "standings"&& <Standings />}
{activeTab === "bracket"  && <Bracket />}
{activeTab === "events"   && <IndividualEvents />}
{activeTab === "settings" && <Settings />}
{activeTab === "schedule" && <ScheduleTab />}   {/* ← ADD THIS LINE */}
```

---

## Done!

Push to GitHub → Vercel deploys automatically.

The Schedule tab will show:
- All 4 days (Day 1, Day 2, Day 3, Championship)
- Click **Edit Schedule** to edit any row inline
- Changes auto-save to the browser
- Add / delete rows on any day
- Reset to original if needed
