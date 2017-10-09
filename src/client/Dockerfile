FROM node:8-alpine
WORKDIR /app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install
COPY . .
EXPOSE 5005
CMD ["yarn", "start"]