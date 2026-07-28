# Step 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Step 2: Package the Express Backend & runtime environment
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY config/ ./config
COPY controllers/ ./controllers
COPY models/ ./models
COPY routes/ ./routes
COPY utils/ ./utils
COPY server.js ./

# Copy built frontend assets to runtime placement
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
