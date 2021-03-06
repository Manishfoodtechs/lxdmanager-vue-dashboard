var dotenv = require('dotenv').config({ path: 'static/.env'})
//dotenv({ path: "static/"});

module.exports = {
  NODE_ENV: '"production"',
  API_BASE_URL: `"${dotenv.parsed.API_BASE_URL}/api/v1"`,
  API_BASE_WS_URL: `"${dotenv.parsed.API_BASE_WS_URL}"`
}
