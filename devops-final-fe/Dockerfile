FROM oven/bun:1

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Add build argument for API URL to bake it into the client-side JS bundle during next build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN bun run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "start"]
