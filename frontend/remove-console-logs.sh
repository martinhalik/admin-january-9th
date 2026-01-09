#!/bin/bash
# Remove console.log statements while preserving code structure
cd /Users/martinhalik/dev/groupon/admin-prototype--content-editing-description
sed -i.bak2 -e '/^[[:space:]]*console\./d' -e '/^[[:space:]]*console\.log.*);$/d' frontend/src/components/ContentEditor/DescriptionEditor.tsx

