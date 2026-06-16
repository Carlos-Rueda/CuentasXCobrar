FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Habilitar variable de entorno para Next.js en tiempo de build en Docker
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Optimizar memoria para Render Free Tier (evita OOM exit 128/137)
ENV NODE_OPTIONS="--max-old-space-size=450"

RUN npm run build

EXPOSE 3000

CMD ["node", "start.js"]