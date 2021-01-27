const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const employeeModel = require("../models/employees");
const departmentModel = require("../models/department");
const { employeeValidation } = require("../utils/validation");

//Insert new user to the database
router.post("/", async (request, response) => {
	//Validate before creating
	const { error } = employeeValidation(request.body);
	if (error) return response.status(400).send(error.details[0].message);

	//Check if employee number exist
	const employeeNoExist = await employeeModel.findOne({
		employeeNo: request.body.employeeNo,
	});
	if (employeeNoExist)
		return response.status(400).json({ message: "Employee No. is already taken." });

	//Create new user
	const newEmployee = new employeeModel({
		employeeNo: request.body.employeeNo,
		firstName: request.body.firstName,
		middleName: request.body.middleName,
		lastName: request.body.lastName,
		department: request.body.department,
		contactNo: request.body.contactNo,
		gender: request.body.gender,
		address: request.body.address,
	});
	try {
		const employee = await newEmployee.save();
		response.status(200).json({ employee: employee.employeeNo + " " + employee.firstName });
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

router.put("/:id", async (request, response) => {
	try {
		const employee = await employeeModel.findById(request.params.id);
		const updates = request.body;
		const options = { new: true };
		const updatedEmployee = await employeeModel.findByIdAndUpdate(
			employee,
			updates,
			options
		);
		response.status(200).json(updatedEmployee);
	} catch (error) {
		response.status(500).json({ error: "Error" });
	}
});

//List of Users
router.post("/list", async (request, response) => {
	try {
		if (Object.keys(request.body).length > 0) {
			var id = [];
			var data = request.body;
			for (const i in data) {
				// console.log(`_id: ${request.body[i].value}`);
				id.push({ _id: request.body[i].value });
			}
			const employees = await employeeModel.find({
				'$or': id,
			}).sort('firstName');

			var data = [];
			for (const i in employees) {
				const dept = await departmentModel.findById(employees[i].department);
				var emp = {
					"_id": employees[i]._id,
					"employeeNo": employees[i].employeeNo,
					"firstName": employees[i].firstName,
					"middleName": employees[i].middleName,
					"lastName": employees[i].lastName,
					"department": dept.department,
					"contactNo": employees[i].contactNo,
					"gender": employees[i].gender,
					"address": employees[i].address,
				}
				data.push(emp);
			}
			response.status(200).json(data);
		} else {
			const employees = await employeeModel.find().sort('firstName');
			var data = [];
			for (const i in employees) {
				const dept = await departmentModel.findById(employees[i].department);
				var emp = {
					"_id": employees[i]._id,
					"employeeNo": employees[i].employeeNo,
					"firstName": employees[i].firstName,
					"middleName": employees[i].middleName,
					"lastName": employees[i].lastName,
					"department": dept.department,
					"contactNo": employees[i].contactNo,
					"gender": employees[i].gender,
					"address": employees[i].address,
				}
				data.push(emp);
			}

			response.status(200).json(data);
		}
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//For search options
router.get("/options", async (request, response) => {
	try {
		const employees = await employeeModel.find().sort('firstName');
		response.status(200).json(employees);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//Delete user from the database based on id
router.delete("/:id", async (request, response) => {
	try {
		const employee = await employeeModel.findById(request.params.id);
		const deletedEmployee = await employee.delete();
		response.status(200).json(deletedEmployee);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

module.exports = router;
