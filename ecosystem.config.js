module.exports = {
    apps: [
        {
            name: process.env.PM2_APP_NAME || 'my-app1',
            script: 'dist/src/server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
}
