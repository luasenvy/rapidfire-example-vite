const path = require('path')

const { RapidFire } = require('@luasenvy/rapidfire')

const rapidFire = new RapidFire({
  host: 'localhost',
  port: 8000,
  paths: {
    middlewares: path.join(__dirname, 'middlewares'),
  },
})

rapidFire.ignition()
