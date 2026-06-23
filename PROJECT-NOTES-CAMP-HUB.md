# Hilhi Youth Hoop Camp Website – Project Notes

## Website Stack
- Next.js
- TypeScript
- Vercel
- GitHub Desktop

## Critical Files

### Camp Hub Admin
`app/admin/camp-tab.tsx`

### Public Camp Hub
`app/camp-schedule/page.tsx`

### Camp Data Types
`lib/camp-schedule.ts`

### Camp Schedule API
`app/api/camp-schedule/route.ts`

### Check-In API
`app/api/camp-checkin/route.ts`

---

# Team Roster Rules

Display camper names publicly as:

**First Name + Last Initial**

Examples:
- John Smith → John S.
- Michael Johnson → Michael J.

Do not display full last names publicly.

---

# Pool Play Rules

Current goal:

- Pool play before bracket play
- Standings determined from actual game scores
- Ignore unplayed 0-0 games
- Sort by:
  1. Wins
  2. Point Differential
  3. Points For
  4. Points Against

Data source:

`seedingGames`

Do not calculate standings from the old `team.wins` / `team.losses` fields.

---

# Public Standings

Location:

`app/camp-schedule/page.tsx`

Public page must include:

**📊 Standings tab**

Display:

- Team
- Wins
- Losses
- Games Played
- Points For
- Points Against
- Point Differential

Must match Admin standings.

---

# Public Teams Page

Location:

`app/camp-schedule/page.tsx`

Team headings should show each team's pool-play record, calculated from `seedingGames`.

Example:

`Hilhi Gold    2-1 record`

Do not rely on `team.wins` or `team.losses` because those may be stale.

---

# Pool Play Score Entry

Location:

Admin → Pool Play Scores

Requirements:

- Score boxes large enough to read
- Court field wider so full court name shows
- Scheduled games should not count until score entered

---

# Check-In System

Location:

Admin → Check-In

Rules:

- Only email campers who are absent
- Do not email checked-in campers
- Ignore duplicate contacts
- Use confirmed camp registrations only

File:

`app/api/camp-checkin/route.ts`

---

# Schedule Visibility

Admin controls:

- Hidden
- Public

Day unlock system:

- Day 1
- Day 2
- Day 3
- Championship

Public users should only see unlocked days.

When a user clicks a day tab after being on Teams or Standings, it should switch back to the Schedule view.

---

# Known Vercel Issues

TypeScript strict mode is enabled.

Always null-check:

- `data?.teams`
- `data?.dailySchedule`

before accessing properties.

`CampScheduleData` should support:

`dailySchedule?: DayData[]`

---

# Current Requested Features

- Public standings page
- Pool play score entry
- Team roster first name + last initial
- Team heading shows record online
- Wider court fields
- Wider score fields
- Pool play schedule generator
- Check-in absent email notifications

---

# Future Ideas

- Printable standings
- Championship bracket visualization
- Live scoreboard
- Parent notifications
- Camp awards tracking
- Team photos
- Mobile admin dashboard
