FROM node:24-bookworm-slim AS dev

WORKDIR /workspace

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
COPY biome.json tsconfig.json vitest.config.ts vitest.setup.ts ./

RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
