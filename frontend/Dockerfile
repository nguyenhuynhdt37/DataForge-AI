FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts

COPY . .

# Stage cho môi trường Dev (Hot reload, không cần build trước)
FROM base AS dev
ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

# Stage cho môi trường Production Build
FROM base AS runner
ENV NODE_ENV=production
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
