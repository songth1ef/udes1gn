#!/bin/sh
# 在服务器上的部署脚本：拉代码 → 起全栈。首次部署前先把 .env.production 填好。
set -e
cd "$(dirname "$0")/.."

echo "[deploy] git pull…"
git pull --ff-only

if [ ! -f .env.production ]; then
  echo "[deploy] 缺少 .env.production，请先从 .env.production.example 复制并填值。"
  exit 1
fi

echo "[deploy] docker compose up --build…"
docker compose up -d --build

echo "[deploy] 完成。查看日志：docker compose logs -f app caddy"
