#!/bin/bash
# backend/entrypoint.sh

# If SMB configuration is set, attempt to mount the share
if [ -n "$SMB_SERVER" ] && [ -n "$SMB_SHARE" ]; then
    SMB_MOUNT_PATH=${SMB_MOUNT_PATH:-/app/storage}
    if [ ! -d "$SMB_MOUNT_PATH" ]; then
        mkdir -p $SMB_MOUNT_PATH
    fi
    echo "Mounting SMB share $SMB_SERVER/$SMB_SHARE to $SMB_MOUNT_PATH"
    mount -t cifs //${SMB_SERVER}/${SMB_SHARE} ${SMB_MOUNT_PATH} \
        -o username=${SMB_USER},password=${SMB_PASSWORD},uid=node,gid=node,vers=3.0 \
        || { echo "Failed to mount SMB share"; exit 1; }
fi

# Create necessary storage directories
STORAGE_PATH=${STORAGE_PATH:-/app/storage}
mkdir -p $STORAGE_PATH/user-files $STORAGE_PATH/thumbnails $STORAGE_PATH/chunks

# Create logs directory if needed
LOG_PATH=${LOG_PATH:-/app/logs}
mkdir -p $LOG_PATH

# Start the server
exec node src/server.js
```

Make it executable: `chmod +x entrypoint.sh`.

`
