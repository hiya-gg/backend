FROM bitnami/node:18 AS dependencies

# We need to initialize prisma here because it requires
# generated files from the dependencies.
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY ./prisma/ ./prisma/

RUN curl -sL https://unpkg.com/@pnpm/self-installer | node && \
    pnpm install --frozen-lockfile --shamefully-hoist --prod && \
    pnpm run prisma:generate

FROM dependencies AS builder

COPY tsconfig.json ./
COPY ./prisma/ ./prisma/
COPY ./src/ ./src/

RUN pnpm install --frozen-lockfile --shamefully-hoist \
    && pnpm run build

FROM bitnami/node:18

WORKDIR /app
COPY --from=dependencies /app/node_modules/ ./node_modules/
COPY --from=dependencies /app/package.json ./
COPY --from=builder /app/build/ ./build/

CMD ["node", "--es-module-specifier-resolution=node", "build/index"]