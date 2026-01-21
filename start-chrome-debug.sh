#!/bin/bash

# Script to start Google Chrome with remote debugging enabled for MCP
# This allows Cursor to connect to Chrome via the Chrome DevTools MCP server

# Default debugging port
PORT=${1:-9222}

# User data directory for debug session
USER_DATA_DIR="/tmp/chrome-debug-${PORT}"

echo "Starting Chrome with remote debugging on port ${PORT}..."
echo "User data directory: ${USER_DATA_DIR}"
echo ""
echo "To connect from Cursor, use the Chrome DevTools MCP tools."
echo "Make sure Cursor is restarted after adding the MCP configuration."
echo ""

# Start Chrome with remote debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=${PORT} \
  --no-first-run \
  --no-default-browser-check \
  --user-data-dir="${USER_DATA_DIR}"
