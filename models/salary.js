const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
	employeeId: {
		type: String,
		required: true,
	},
	// employeeNo: {
	// 	type: String,
	// 	required: true,
	// },
	salary: {
		type: Number,
		required: true,
    },
	sss: {
		type: Number,
    },
	phic: {
        type: Number,
    },
    hdmf: {
        type: Number,
    },
    sssLoan: {
        type: Number,
    },
    pagibigLoan: {
        type: Number,
    },
    careHealthPlus: {
        type: Number,
    },
    cashAdvance: {
        type: Number,
    },
    safetyShoes: {
        type: Number,
    }
});
module.exports = mongoose.model("salary", salarySchema);
