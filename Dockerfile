FROM node:24.8.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 9999

CMD ["node", "src/index.js"]
