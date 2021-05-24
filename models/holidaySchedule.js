const mongoose = require("mongoose");

const holidayScheduleSchema = new mongoose.Schema({
	date: {
		type: Date,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: true,
	},
	IsDeleted: {
		type: Boolean,
		required: true,
		default: false
	}
});
module.exports = mongoose.model("holidaySchedule", holidayScheduleSchema);
