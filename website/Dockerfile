FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=http://localhost:4321
ARG SITE_LAUNCHED=false
ARG PUBLIC_CONTACT_EMAIL
ARG PUBLIC_PHONE
ARG PUBLIC_WHATSAPP
ARG PUBLIC_BOOKING_URL
ARG PUBLIC_LEGAL_NAME
ARG LEGAL_REVIEW_APPROVED=false
ARG CAPABILITIES_APPROVED=false
ARG ASSET_RIGHTS_CONFIRMED=false
ARG LAUNCH_APPROVED=false
ENV ASTRO_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321 DATA_DIR=/app/data
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
