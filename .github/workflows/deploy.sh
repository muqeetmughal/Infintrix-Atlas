#!/bin/bash
set -e  # Stop on first error

# Variables
APP_DIR=~/infintrix-erp/apps/infintrix_atlas
BENCH_DIR=~/infintrix-erp
SITE_NAME=$1  # pass the site name as argument

echo "==> Pulling latest code..."
cd $APP_DIR
git reset --hard
git clean -fd
git pull origin main

echo "==> Installing Python dependencies..."
cd $BENCH_DIR
source env/bin/activate  # adjust if your virtualenv path differs
bench setup requirements --app infintrix_atlas

echo "==> Building assets..."
nvm use 20  # make sure Node 20 is installed
bench build --apps infintrix_atlas --skip-redis

echo "==> Running migrations..."
bench --site $SITE_NAME migrate

echo "==> Clearing cache..."
bench --site $SITE_NAME clear-cache

echo "==> Restarting services..."
sudo supervisorctl restart all

echo "==> Deployment complete!"
