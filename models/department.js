const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
	department: {
		type: String,
		required: true,
	},
	timePerDay: {
		type: String,
		required: true,
    },
	dayNightShift: {
		type: Boolean,
		required: true,
	},
	IsDeleted: {
		type: Boolean,
		required: true,
		default: false
	}
});
module.exports = mongoose.model("department", departmentSchema);
