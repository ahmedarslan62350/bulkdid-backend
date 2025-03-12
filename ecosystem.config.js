module.exports = {
    apps: [
        {
            name: process.env.PM2_APP_NAME,
            script: 'dist/src/server.js',
            instances: '2',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
}
