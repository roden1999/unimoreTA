const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
	department: {
		type: String,
		required: true,
	},
	timeStart: {
		type: String,
		required: true,
    },
	timeEnd: {
        type: String,
        required: true,
    },
});
module.exports = mongoose.model("department", departmentSchema);
