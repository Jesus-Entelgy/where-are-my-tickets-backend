FROM node:22-alpine

ARG PORT=3000

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE ${PORT}

CMD ["node","dist/main"]