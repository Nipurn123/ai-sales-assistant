FROM node:20-slim

# Install Python and required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy package files
COPY package.json ./
COPY requirements.txt* ./

# Install dependencies and rebuild native binaries for Linux
RUN npm install --force && npm rebuild

# Increase Node.js heap size
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install Python dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Install common Python packages for LiveKit agents
RUN pip install \
    python-dotenv \
    livekit \
    livekit-agents \
    livekit-plugins-deepgram \
    livekit-plugins-silero \
    livekit-plugins-google \
    livekit-plugins-turn-detector \
    google-generativeai

# Copy application code
COPY . .

# Skip model download to fix timeout issues - models will be downloaded on first run

# Make start.sh executable
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Set environment variables
ENV NODE_ENV=development
ENV PATH="/opt/venv/bin:$PATH"

# Start both services
CMD ["bash", "/app/start.sh"]