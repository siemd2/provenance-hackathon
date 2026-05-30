# Build context is the repo root (see docker-compose.yml) so the image can include
# the official reference_lib + registries that the verifier depends on.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY reference_lib ./reference_lib
COPY registry ./registry
COPY private_keys ./private_keys
COPY worked-example ./worked-example
COPY backend ./backend

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
