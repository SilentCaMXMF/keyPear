#!/bin/bash
set -e

echo "=== KeyPear SMB Setup ==="

MOUNT_POINT="/home/pedroocalado/keypear_mount"
KEYPEAR_DIR="$MOUNT_POINT/keypear_files"
CREDENTIALS_FILE="/home/pedroocalado/.smbcredentials"

# Check if credentials file exists
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "Creating SMB credentials file..."
    echo "Enter SMB password:"
    read -s SMB_PASSWORD
    
    cat > "$CREDENTIALS_FILE" << EOF
username=pedroocalado
password=$SMB_PASSWORD
domain=
EOF
    chmod 600 "$CREDENTIALS_FILE"
fi

# Create mount point
if [ ! -d "$MOUNT_POINT" ]; then
    sudo mkdir -p "$MOUNT_POINT"
fi

# Create keyPear storage directory
sudo mkdir -p "$KEYPEAR_DIR"

# Mount SMB
echo "Mounting SMB share..."
sudo mount -t cifs //192.168.1.254/public "$MOUNT_POINT" \
    -o credentials="$CREDENTIALS_FILE",vers=3.0,uid=1000,gid=1000,file_mode=0664,dir_mode=0775

# Install systemd service
echo "Installing systemd service..."
sudo cp keypear-smb.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable keypear-smb.service

# Verify mount
echo "Verifying mount..."
df -h | grep keypear || echo "Warning: Mount not found"

echo "=== Setup Complete ==="
echo "Run 'sudo systemctl start keypear-smb' to mount"
echo "Run 'sudo systemctl status keypear-smb' to check status"
