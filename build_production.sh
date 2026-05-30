#!/bin/bash
set -e

echo "=== Building React Panel ==="
cd panel
npm install
npm run build
cd ..

echo "=== Building Lambda: kick_channel ==="
cd serverless/kick_channel
npm install
zip -r ../kick_channel.zip . -x "*.git*"
cd ../..

echo "=== Building Lambda: kick_oauth_callback ==="
cd serverless/kick_oauth_callback
npm install
zip -r ../kick_oauth_callback.zip . -x "*.git*"
cd ../..

echo "=== Building Lambda: kick_send_message ==="
cd serverless/kick_send_message
npm install
zip -r ../kick_send_message.zip . -x "*.git*"
cd ../..

echo "=== Building Lambda: kick_token_cron ==="
cd serverless/kick_token_cron
npm install
zip -r ../kick_token_cron.zip . -x "*.git*"
cd ../..

echo "=== Build Complete! ==="
echo "Artifacts ready:"
echo "- panel/dist/"
echo "- serverless/*.zip"
