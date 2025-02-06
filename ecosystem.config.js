module.exports = {
    apps: [
      {
        name: "my-app",
        script: "dist/src/server.js",
        instances: "max",
        exec_mode: "cluster",
        env: {
          NODE_ENV: "production",
        },
      },
    ],
  };
  