#!/usr/bin/env bash
# Codespaces 启动脚本：装依赖 → 后台启动演示服务
# 已启动则跳过，避免重复执行时报端口占用
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"

if [ ! -d node_modules ]; then
  npm ci
fi

if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/health"; then
  echo "服务已在运行：http://localhost:${PORT}/demo"
  exit 0
fi

nohup npm run start:demo > /tmp/qr-demo.log 2>&1 &

for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/health"; then
    echo "已启动：http://localhost:${PORT}/demo"
    exit 0
  fi
  sleep 0.5
done

echo "启动超时，查看 /tmp/qr-demo.log" >&2
tail -20 /tmp/qr-demo.log >&2 || true
exit 1
