ARG BUN_VERSION=1.3.9
ARG NODE_VERSION=24

FROM oven/bun:${BUN_VERSION} AS pack
WORKDIR /src
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts
COPY tsconfig.json README.md LICENSE ./
COPY bin ./bin
COPY src ./src
RUN bun run build \
  && mkdir /out \
  && bun pm pack --destination /out \
  && mv /out/*.tgz /out/trekker.tgz

FROM oven/bun:${BUN_VERSION}-slim AS bun

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
COPY --from=bun /usr/local/bin/bun /opt/bun/bin/bun
ENV PATH=/opt/bun/bin:$PATH \
  npm_config_update_notifier=false \
  npm_config_fund=false \
  npm_config_audit=false

ARG PREVIOUS_TREKKER_VERSIONS
RUN for version in $PREVIOUS_TREKKER_VERSIONS; do \
    npm install --prefix "/opt/trekker/$version" "@obsfx/trekker@$version" || exit 1; \
  done

ARG DASHBOARD_VERSION
RUN npm install -g "@obsfx/trekker-dashboard@$DASHBOARD_VERSION"

COPY --from=pack /out/trekker.tgz /opt/packages/trekker.tgz
RUN npm install -g /opt/packages/trekker.tgz

WORKDIR /work
CMD ["sleep", "infinity"]
