const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	UserName: {
		type: String,
		required: true,
	},
	Password: {
		type: String,
		required: true,
    },
    Name: {
        type: String,
        required: true,
    },
    Role: {
        type: String,
        requried: true
    }
});
module.exports = mongoose.model("user", userSchema);