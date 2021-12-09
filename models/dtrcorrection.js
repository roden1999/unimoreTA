const mongoose = require("mongoose");

const dtrCorrectionSchema = new mongoose.Schema({
	employeeNo: {
		type: String,
		required: true,
	},
	employeeName: {
		type: String,
		required: true,
    },
	date: {
        type: Date,
        required: true,
    },
    timeIn: {
        type: String,
    },
    timeOut: {
        type: String,
    },
    otHours: {
        type: Number,
    },
    breakTime: {
        type: Boolean,
        required: true,
        default: false
    },
	breakTimeHrs: {
		type: Number,
	},
	hourswork: {
		type: Number,
	},
	undertime: {
		type: Number,
	},
	remarks: {
		type: String,
	},
	reason: {
		type: String,
    },
    dateApproved: {
        type: Date,
        required: true,
    }
});
module.exports = mongoose.model("dtrCorrection", dtrCorrectionSchema);
