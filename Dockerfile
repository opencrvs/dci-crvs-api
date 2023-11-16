FROM node:21.2.0-alpine3.17
WORKDIR /usr/src/app

# Override the base log level (info).
ENV NPM_CONFIG_LOGLEVEL warn

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages packages
RUN npm install --omit=dev

EXPOSE 1660

CMD ["npm", "start"]