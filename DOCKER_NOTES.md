Docker notes
===========

Quick steps to build and run locally (Windows CMD / PowerShell):

Build image:

  docker build -t my-timesheet-app .

Run with environment variable for JWT secret (recommended):

  docker run -p 3000:3000 -e JWT_SECRET=your_secret_here my-timesheet-app

Or use docker-compose:

  docker-compose up --build

Notes:
- This Dockerfile performs a production build (npm run build) and runs `next start`.
- The app expects JWT_SECRET to be set for secure sessions. If not provided, a default dev-secret is used.
- The in-memory timesheet store is ephemeral and will reset when the container restarts. For persistence, connect a database.
