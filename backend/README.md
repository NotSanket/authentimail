# AUTHENTIMAIL Analysis API

FastAPI service for deterministic, explainable phishing-risk analysis. Submitted URLs are parsed strictly as strings: the service never visits, fetches, executes, or opens them. Submitted message content is not persisted or written to application logs.

## Risk labels

- `safe`: 0–14
- `low_risk`: 15–39
- `suspicious`: 40–69
- `high_risk`: 70–100

Email and URL detectors are scored separately. When both channels are available, the overall score starts with the stronger detector and adds a capped 15% contribution from the secondary detector. This keeps the result monotonic: providing another observable can maintain or increase risk, but never hide an existing signal. A further small correlation contribution applies only when both channels independently contain meaningful risk signals.

## Local setup

From `backend/` on Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

Run tests:

```powershell
python -m pytest
```

The suite disables pytest's local cache so test runs remain side-effect free outside the virtual environment.

## Environment variables

- `AUTHENTIMAIL_ENV`: runtime label; defaults to `development`.
- `AUTHENTIMAIL_CORS_ORIGINS`: comma-separated trusted frontend origins. Local Vite origins are used by default. Add the exact Vercel origin for production; wildcards are intentionally not enabled.

## Endpoint checks

Health:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Analyze:

```powershell
$body = @{
  email = 'URGENT: Your account has been suspended. Verify your password immediately.'
  url = 'https://example.com/login'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/analyze -ContentType 'application/json' -Body $body
```

Interactive OpenAPI documentation is available at `http://localhost:8000/docs` during development.
