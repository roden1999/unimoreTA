const mongoose = require("mongoose");

const employeesSchema = new mongoose.Schema({
	employeeNo: {
		type: String,
		required: true,
	},
	firstName: {
		type: String,
		required: true,
    },
	middleName: {
		type: String,
    },
	lastName: {
        type: String,
        required: true,
    },
    department: {
        type: String,
    },
    contactNo: {
        type: String,
    },
    gender: {
        type: String,
    },
    address: {
        type: String,
    }
});
module.exports = mongoose.model("employees", employeesSchema);
