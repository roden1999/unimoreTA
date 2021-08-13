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
    breakTime: {
        type: Boolean,
        required: true,
        default: false
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
