#!/usr/bin/env bash
# Đọc hết stdin để tránh vỡ pipe
cat > /dev/null

# PostToolUse yêu cầu output JSON object {}
echo "{}"
