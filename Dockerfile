FROM node:12

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=5001

EXPOSE 5000

CMD [ "npm", "start" ]