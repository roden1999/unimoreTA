//Validation
const Joi = require("@hapi/joi");
const { allow } = require("@hapi/joi");

//Registration Validation
const departmentValidation = (data) => {
	const schema = Joi.object({
		department: Joi.string().required().messages({
			"string.empty": `Department is required`,
		}),
		// timeStart: Joi.string().required().messages({
		// 	"string.empty": `Time Start is required`,
		// }),
		// timeEnd: Joi.string().required().messages({
		// 	"string.empty": `Time End is required`,
		// }),
		timeStart: Joi.string().allow(''),
		timeEnd: Joi.string().allow(''),
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

module.exports.departmentValidation = departmentValidation;
module.exports.employeeValidation = employeeValidation;
