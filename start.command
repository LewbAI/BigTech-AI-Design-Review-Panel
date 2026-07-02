#!/bin/bash
set -e
cd "$(dirname "$0")"

PORT=3000

# 如果端口已被占用（说明服务在跑），直接打开浏览器
if lsof -ti :$PORT >/dev/null 2>&1; then
    echo "服务已经在运行——直接打开浏览器..."
    open "http://localhost:$PORT"
    sleep 1
    exit 0
fi

# 读取 .env.local 里的 API key
if [ -f .env.local ]; then
    set -a
    # shellcheck disable=SC1091
    source .env.local
    set +a
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "未找到 ANTHROPIC_API_KEY。"
    echo "请确认本目录 .env.local 里有这一行："
    echo "  ANTHROPIC_API_KEY=sk-ant-api03-..."
    echo ""
    echo "按任意键退出..."
    read -n 1 -s -r
    exit 1
fi

# —— 自动检测本地代理（ClashX / Surge / V2Ray 等）——
# Anthropic API 在中国大陆 IP 直连会被 403 拒绝，必须走代理
detect_proxy() {
    local ports=(7890 7891 7897 6152 6153 1087 10809 8118 8888)
    for port in "${ports[@]}"; do
        if nc -z 127.0.0.1 "$port" 2>/dev/null; then
            echo "$port"
            return 0
        fi
    done
    return 1
}

PROXY_PORT=$(detect_proxy || true)
if [ -n "$PROXY_PORT" ]; then
    export HTTPS_PROXY="http://127.0.0.1:$PROXY_PORT"
    export HTTP_PROXY="http://127.0.0.1:$PROXY_PORT"
    export NO_PROXY="localhost,127.0.0.1"
    echo "✓ 检测到本地代理: 127.0.0.1:$PROXY_PORT（API 走代理）"
else
    echo "⚠ 未检测到本地代理 — 如果你在中国大陆，调用 Anthropic API 可能会 403"
    echo "  请打开 ClashX / Surge 等代理软件后重启此脚本"
fi

# 第一次启动需要装依赖
if [ ! -d node_modules ]; then
    echo "第一次启动，安装依赖中（一次即可，约 1 分钟）..."
    npm install
fi

echo "================================"
echo "  大厂AI 设计评审团启动中"
echo "  浏览器会自动打开 http://localhost:$PORT"
echo "  关闭这个窗口 = 停止服务"
echo "================================"
echo ""

# 3 秒后自动打开浏览器
(sleep 3 && open "http://localhost:$PORT") &

# 启动 dev server
exec npm run dev
