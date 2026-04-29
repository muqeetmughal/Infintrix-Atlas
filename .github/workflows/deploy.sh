#!/bin/bash
set -e  # Stop on first error

# Variables
APP_DIR=~/frappe-bench/apps/infintrix_atlas
BENCH_DIR=~/frappe-bench
SITE_NAME=$1  # pass the site name as argument
NODE_VERSION=20
echo "🚀 ==> Pulling latest code..."
cd $APP_DIR
git reset --hard
git clean -fd
git pull

echo "📦 ==> Installing Python dependencies..."
cd $BENCH_DIR
source env/bin/activate

# --- Setup Node.js & Yarn ---
echo "==> Ensuring Node.js & Yarn..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
if ! command -v node &> /dev/null; then
    echo "Node not found. Installing Node $NODE_VERSION..."
    nvm install "$NODE_VERSION"
fi
nvm use "$NODE_VERSION"
export PATH="$HOME/.nvm/versions/node/v$NODE_VERSION/bin:$PATH"


bench setup requirements infintrix_atlas

if ! command -v yarn &> /dev/null; then
    echo "Yarn not found. Installing..."
    npm install -g yarn
fi

echo "🏗️  ==> Building assets..."
bench build --apps infintrix_atlas

echo "🔄 ==> Running migrations..."
bench --site $SITE_NAME migrate

echo "🗑️  ==> Clearing cache..."
bench --site $SITE_NAME clear-cache

echo "♻️  ==> Restarting services..."
sudo supervisorctl restart all

echo "✅ ==> Deployment complete!"
