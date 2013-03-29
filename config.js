module.exports = {
  port: process.env.PORT || process.argv[2],
  mongo: {
    url: process.env.MONGOHQ_URL || 'mongodb://localhost:27017/some-db',
    debug: process.env.MONGOHQ_URL ? false : true
  }
};