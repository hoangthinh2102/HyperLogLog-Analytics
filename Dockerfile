FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "dist/main.js"]