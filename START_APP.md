# How to Run DataUniverse

## Start the app
```bash
npm start
```

## Open in browser
Use the URL shown in the terminal, e.g. **http://localhost:3000**

The frontend automatically uses the same origin as the page, so it works regardless of which port the backend runs on (configured in `backend/.env` as `PORT`).

## Production
- Set `PORT` in `backend/.env` for your server
- Set `FRONTEND_URL` and `CORS_ORIGINS` for your domain (e.g. https://datauniverse.in)
- The built frontend uses `window.location.origin + /api` so it always matches your domain
