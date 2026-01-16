module.exports = {
  apps: [
    {
      name: "calendar-client",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3002",
      cwd: "./",
      instances: 1,
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    }
  ]
};