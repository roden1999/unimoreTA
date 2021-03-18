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
	remarks: {
		type: String,
		required: true,
	},
});
module.exports = mongoose.model("holidaySchedule", holidayScheduleSchema);
