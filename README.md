# Football Team Maker ⚽️

A real-time, zero-configuration pickup sports management application designed to handle high-frequency game scheduling, waitlists, and team generation with a completely serverless backend.

## 🌟 Key Features

### 1. Live Multiplayer Synchronization
Powered by **Supabase Realtime**, every client connected to the application stays perfectly in sync. When a player joins the game or an admin adjusts the roster, the changes are broadcast instantly to every phone or laptop viewing the page. No manual refreshing required.

### 2. Intelligent "Lazy" Rollovers
We've eliminated the need for complex, paid Cron-job infrastructure. The application implements an intelligent "Lazy Rollover" system tied directly to Indian Standard Time (IST).
- **Midnight Wipe**: When the clock strikes 12:00 AM on a game day, the Waitlist is automatically purged, and the Confirmed list is locked in and carried forward to the next game day.
- **Weekend Logic**: Recognizes Saturday and Sunday as non-game days. Waitlists established on Friday seamlessly roll across the weekend to open for Monday.

### 3. Registration Time-Locks
To enforce fairness, the application mathematically restricts registration during off-hours. The "Join Game" button locks down between **12:00 AM and 7:00 AM IST** on weekdays, ensuring everyone gets a fair start at 7:00 AM sharp. 

### 4. Waitlist Priority Queue
As players join, the application automatically calculates current capacity (adapting for 5v5, 7v7, or 9v9 setups). Once the maximum threshold is met, overflow players are seamlessly routed to an ordered Waitlist queue.

### 5. Admin Matchup Builder
A password-protected Admin layer (`Password: admin`) allows coordinators to:
- Instantly auto-generate randomized teams based on the confirmed roster.
- Use a fluid **Drag & Drop** interface to swap players between teams and fix balance issues.
- Toggle between team aesthetic colors (e.g., Red vs. Blue, Black vs. White).
- Keep unfinalized matchups hidden from regular players to prevent confusion. Once the Admin finalizes the teams, every connected client is instantly redirected to the Matchup screen.

### 6. Premium UI / UX
Built with React and raw CSS, the interface boasts a state-of-the-art aesthetic:
- Responsive, glassy overlays.
- Dynamic game-day text that automatically calculates the upcoming match date.
- Sleek sports-themed visual elements, including slanted speed-lines and vibrant card gradients.

---

## 🚀 Deployment

This project was built from the ground up for Vercel. 
1. Connect your GitHub repository to Vercel.
2. Select the **Vite** preset.
3. Deploy! No environment variables are necessary since the Supabase publishable keys are safely baked into the source structure.

## 🛠 Tech Stack
- **Frontend**: React.js (Vite)
- **Styling**: Vanilla CSS3
- **Database & Sync**: Supabase (PostgreSQL + PostgREST + Realtime)
- **Drag & Drop**: @dnd-kit/core
- **Icons**: Lucide-React
