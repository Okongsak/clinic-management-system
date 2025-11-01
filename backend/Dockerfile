FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci
#RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate || true

# Push schema to DB (สร้าง table ถ้าไม่มี)
RUN npx prisma db push

# Build TypeScript
RUN npm run build

ENV NODE_ENV=development
# Expose port
EXPOSE 3001

CMD ["npm", "run", "dev"]
