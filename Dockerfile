FROM node:11.15.0
# EXPOSE 9229
ENV NODE_ENV=development
# EXPOSE 8080
WORKDIR /usr/src/app
COPY . .
CMD ["node", "--inspect-brk", "src/worker.js"]
# CMD ["npm", "start"]
