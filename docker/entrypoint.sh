#!/bin/sh
set -e

echo "[entrypoint] 等待数据库就绪…"
# 简单重试，等 postgres 起来
for i in $(seq 1 30); do
  if node -e "require('net').connect(5432,'db').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))" 2>/dev/null; then
    break
  fi
  echo "[entrypoint] db 未就绪，重试 $i/30…"
  sleep 2
done

echo "[entrypoint] 应用数据库迁移 (prisma migrate deploy)…"
./node_modules/.bin/prisma migrate deploy

# RUN_SEED=1 时执行一次种子（幂等 upsert；不重置已存在管理员密码）
if [ "$RUN_SEED" = "1" ]; then
  echo "[entrypoint] 执行 seed…"
  ./node_modules/.bin/prisma db seed || echo "[entrypoint] seed 跳过/失败（非致命）"
fi

echo "[entrypoint] 启动应用…"
exec "$@"
