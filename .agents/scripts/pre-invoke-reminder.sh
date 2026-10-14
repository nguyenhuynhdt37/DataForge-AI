#!/usr/bin/env bash
# Đọc hết stdin để tránh vỡ pipe
cat > /dev/null

cat << 'EOF'
{
  "injectSteps": [
    {
      "ephemeralMessage": "⚠️ KỶ LUẬT THÉP: Cấm tuyệt đối code tắt/placeholder // TODO. Bắt buộc kiểm tra edge cases, xử lý lỗi và verify code."
    }
  ]
}
EOF
