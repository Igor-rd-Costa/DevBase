FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy project files
COPY dev-gateway/pyproject.toml dev-gateway/uv.lock dev-gateway/README.md ./
COPY dev-gateway/devgateway ./devgateway

# Install dependencies using uv
RUN uv sync --frozen --no-dev

# Default environment variables
ENV GATEWAY_PROJECT_ID="default"
ENV GATEWAY_WORKING_DIR="/app"
ENV GATEWAY_COMMAND="[]"

# Run with the gateway agent
CMD ["uv", "run", "python", "-m", "devgateway.gateway.agent"]
