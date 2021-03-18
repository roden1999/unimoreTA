//Validation
const Joi = require("@hapi/joi");
const { allow } = require("@hapi/joi");

//Registration Validation
const departmentValidation = (data) => {
	const schema = Joi.object({
		department: Joi.string().required().messages({
			"string.empty": `Department is required.`,
		}),
		dayNightShift: Joi.boolean().required().messages({
			"string.empty": `Day / Night Shift must be boolean.`
		}),
		timePerDay: Joi.array().required().messages({
			"string.empty": "Time Per Day cannot be null."
		})
		// timeStart: Joi.string().required().messages({
		// 	"string.empty": `Time Start is required`,
		// }),
		// timeEnd: Joi.string().required().messages({
		// 	"string.empty": `Time End is required`,
		// }),
	});
	return schema.validate(data, { abortEarly: false });
};

//Employee Validation
const employeeValidation = (data) => {
	const schema = Joi.object({
		employeeNo: Joi.string().required().messages({
			"string.empty": `Employee No. is required`,
		}),
		firstName: Joi.string().required().messages({
			"string.empty": `First Name is required`,
		}),
		middleName: Joi.string().allow(''),
		lastName: Joi.string().required().messages({
			"string.empty": `Last Name. is required`,
		}),
		department: Joi.string().required().messages({
			"string.empty": `Department. is required`,
		}),
		contactNo: Joi.string().allow(''),
		gender: Joi.string().allow(''),
		address: Joi.string().allow(''),
	});
	return schema.validate(data, { abortEarly: false });
};

//Salary Validation
const salaryValidation = (data) => {
	const schema = Joi.object({
		employeeId: Joi.string().required().messages({
			"string.empty": `Employee is required.`,
		}),
		salary: Joi.number().required().messages({
			"any.required": `Salary must have value.`
		}),
		sss: Joi.number().required().messages({
			"any.required": `SSS must have value.`
		}),
		phic: Joi.number().required().messages({
			"any.required": "PHIC must have value."
		}),
		hdmf: Joi.number().required().messages({
			"any.required": "HDMF must have value."
		}),
		sssLoan: Joi.number().required().messages({
			"any.required": "SSS Loan must have value."
		}),
		pagibigLoan: Joi.number().required().messages({
			"any.required": "PAG-IBIG Loan must have value."
		}),
		careHealthPlus: Joi.number().required().messages({
			"any.required": "Care Health Plus must have value."
		}),
	});
	return schema.validate(data, { abortEarly: false });
};

//HS Validation
const holidaySchedValidation = (data) => {
	const schema = Joi.object({
		date: Joi.string().required().messages({
			"string.empty": `Date is required.`,
		}),
		title: Joi.boolean().required().messages({
			"string.empty": `Title is required.`
		}),
		remarks: Joi.array().required().messages({
			"string.empty": "Remarks is required."
		})
	});
	return schema.validate(data, { abortEarly: false });
};

module.exports.departmentValidation = departmentValidation;
module.exports.employeeValidation = employeeValidation;
module.exports.salaryValidation = salaryValidation;
module.exports.holidaySchedValidation = holidaySchedValidation;
