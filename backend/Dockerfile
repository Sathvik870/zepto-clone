FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm test

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

RUN npm prune --production

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
