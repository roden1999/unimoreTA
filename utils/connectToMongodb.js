const mongoose = require("mongoose");
const { DB_CONNECTION_STRING, PORT } = require("../config");

module.exports = function () {
	mongoose.connect(DB_CONNECTION_STRING, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	})
	.then(() => console.log('MongoDB Connected'))
	.catch(err => console.log(err));
};
