# Dev Backend

FastAPI backend with GitHub OAuth authentication.

## Setup

1. Install dependencies:
```bash
uv sync
```

2. Copy `.env.example` to `.env` and fill in the required values.

3. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to: `http://localhost:8000/auth/github/callback`
   - Copy the Client ID and Client Secret to your `.env` file

4. Run the server:
```bash
uv run python main.py
```

The server will start on `http://localhost:8000`

