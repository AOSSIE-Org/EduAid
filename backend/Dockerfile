# Use Python 3.11 slim image
FROM python:3.11-slim

# Install git (required for git dependencies in requirements.txt)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements.txt first for better layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend/ .

# Expose port 5000
EXPOSE 5000

# Use Gunicorn for production, Flask dev server for development
# The command will be overridden in docker-compose for development
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "server:app"]