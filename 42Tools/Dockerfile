FROM node:21-bookworm

WORKDIR /back

COPY back/package*.json ./

RUN npm install

COPY back/ .

RUN npm run build
EXPOSE 3000
CMD npm run start:prod