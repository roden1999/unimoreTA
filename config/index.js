require("dotenv").config();

module.exports = {
	DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
	PORT: process.env.PORT,
	SECRET_TOKEN: process.env.SECRET_TOKEN,
};
