FROM node:14.17.1-alpine3.13
WORKDIR /usr/src/app
COPY . ./

ENV PATH /app/node_modules/.bin:$PATH

RUN npm install --silent

CMD ["npm", "start"]