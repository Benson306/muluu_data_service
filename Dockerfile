FROM node:20-alpine

COPY controllers /app/controllers/
COPY models /app/models/
COPY .env /app/
COPY app.js /app/
COPY package.json /app/
COPY README.md /app/

WORKDIR /app

RUN npm install

CMD ["node", "app.js"]