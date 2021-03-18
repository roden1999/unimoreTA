const mongoose = require("mongoose");

const timeLogsSchema = new mongoose.Schema({
	employeeNo: {
		type: String,
		required: true,
	},
	employeeName: {
		type: String,
    },
    timeInOut: {
        type: String,
    },
	dateTime: {
        type: Date,
        required: true,
	},
});
module.exports = mongoose.model("timeLogs", timeLogsSchema);
