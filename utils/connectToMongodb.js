const mongoose = require("mongoose");
const { DB_CONNECTION_STRING, PORT } = require("../config");

const options = {
    autoIndex: false, // Don't build indexes
    reconnectTries: 30, // Retry up to 30 times
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0
  }

module.exports = function () {
	mongoose.connect(DB_CONNECTION_STRING, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	}, options)
	.then(() => console.log('MongoDB Connected'))
	.catch(err => console.log(err));
};
