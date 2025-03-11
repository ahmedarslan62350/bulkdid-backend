to make the mongo-backup script excecutable
run:

chmod +x ~/backup-mongo.sh

and then Schedule the Script to Run Every 30 Days

run:
crontab -e

write at last
0 0 1 \* \* /bin/bash ~/backup-mongo.sh
@reboot /bin/bash /path/to/manage_pm2.sh

also install copfiles globly:
npm i copyfiles -g
also install 
npm i --save-dev @types/eslint-config-prettier
