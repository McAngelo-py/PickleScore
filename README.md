# Pickleball Scoreboard

A lightweight web app for tracking pickleball matches in real time. It supports scorekeeping for points, games, serving order, and match progression for singles or doubles play.

## Features

- Track points for Team A and Team B
- Track games and match wins
- Support singles and doubles formats
- Official side-out scoring and simple rally-point mode
- Adjustable point target, win-by margin, and match length
- New match flow with archived session history
- Dark and light theme toggle
- Match history panel with game and match results
- Exportable session log and clear-history actions
- Undo, reset, swap-serve, and face-off controls
- Keyboard shortcuts for quick score updates
- Fullscreen support and sound cues for point events
- Responsive layout for compact/mobile viewing

## Files

- index.html — main app layout and UI
- styles.css — scoreboard styling, themes, and responsive layout
- script.js — scoring logic, match rules, history tracking, and UI behavior
- .gitignore — project ignore rules

## Run locally

Open the app in a browser:
1. Open index.html directly in a browser, or
2. Run a local web server:

```bash
cd "c:/Users/Admin/Desktop/Pickle_ball"
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

## Controls

- Tap a team panel to award a point
- Use the Settings button to change rules
- Use the History button to review the current session log
- Use Undo to reverse the previous score event
- Use Reset game to clear the current game score
- Use Swap serve to rotate the serving team
- Use Face-off to flip the scoreboard orientation

## Keyboard shortcuts

- Left Arrow: point for Team A
- Right Arrow: point for Team B
- Z: undo
- F: fullscreen toggle

## Notes

This project is designed for on-court or table-side match tracking and is meant to be easy to use during live play. The current session log is stored in browser memory for the active session and can be exported as plain text when needed.
