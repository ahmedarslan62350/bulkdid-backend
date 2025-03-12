to make the mongo-backup script excecutable
run:

chmod +x ./dist/script/backup-mongo.sh
chmod +x ./dist/script/pm2-scaling.sh

ls -l ./dist/script/backup-mongo.sh ./dist/script/pm2-scaling.sh

and then Schedule the Script to Run Every 30 Days

run:
crontab -e

write at last
0 0 1 \* \* /bin/bash /root/bulkdid-backend/dist/script/backup-mongo.sh
@reboot /bin/bash /root/bulkdid-backend/dist/script/pm2-scaling.sh

also install copfiles globly:
npm i copyfiles -g
npm install dotenv
npm install dotenv-cli --save-dev

mv router/AdminRouter.ts router/adminRouter.ts


also install 
npm i --save-dev @types/eslint-config-prettier


