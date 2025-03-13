#!/bin/bash

echo "Building the project..."
npm run build
echo "Build complete!"

echo "Making the scripts exceutable"

chmod +x ./dist/script/backup-mongo.sh
chmod +x ./dist/script/pm2-scaling.sh

echo "Process of making the scripts exceutable is succesful"




echo "The results are"
ls -l ./dist/script/backup-mongo.sh ./dist/script/pm2-scaling.sh

CRON_JOBS="
0 0 1 * * /bin/bash /root/bulkdid-backend/dist/script/backup-mongo.sh
@reboot /bin/bash /root/bulkdid-backend/dist/script/pm2-scaling.sh
"

crontab -l > mycron 2>/dev/null

if ! grep -Fxq "0 0 1 * * /bin/bash /root/bulkdid-backend/dist/script/backup-mongo.sh" mycron; then
    echo "0 0 1 * * /bin/bash /root/bulkdid-backend/dist/script/backup-mongo.sh" >> mycron
fi

if ! grep -Fxq "@reboot /bin/bash /root/bulkdid-backend/dist/script/pm2-scaling.sh" mycron; then
    echo "@reboot /bin/bash /root/bulkdid-backend/dist/script/pm2-scaling.sh" >> mycron
fi

crontab mycron

rm mycron

echo "Cron jobs added successfully!"