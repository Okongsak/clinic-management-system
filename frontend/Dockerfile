FROM node:20-alpine

WORKDIR /app

# Copy package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies ทั้งหมด (รวม devDependencies) เพื่อให้ vite ใช้งานได้
RUN npm install

# Copy source code
COPY . .

# เปิด port ของ Vite dev server
EXPOSE 5173

# เรียก dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

