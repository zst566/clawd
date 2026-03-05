FROM node:18-alpine

# 安装编译工具
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000 3001

CMD ["npm", "start"]
