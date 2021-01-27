const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const departmentModel = require("../models/department");
const fs = require('fs');
const { departmentValidation } = require("../utils/validation");

//Insert new department to the database
router.post("/", async (request, response) => {
	//Validate before creating
	const { error } = departmentValidation(request.body);
	if (error) return response.status(400).send(error.details[0].message);

	//Check if department exist
	const deptExist = await departmentModel.findOne({
		department: request.body.department,
	});
	if (deptExist)
		return response.status(400).json({ message: "Department already exist." });

	//Create new user
	const newDept = new departmentModel({
        department: request.body.department,
		timeStart: request.body.timeStart,
		timeEnd: request.body.timeEnd,
	});
	try {
		const department = await newDept.save();
		response.status(200).json({ department: department.department });
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

router.put("/:id", async (request, response) => {
	try {
		const dept = await departmentModel.findById(request.params.id);
		const updates = request.body;
		const options = { new: true };
		const updatedDept = await departmentModel.findByIdAndUpdate(
			dept,
			updates,
			options
		);
		response.status(200).json(updatedDept);
	} catch (error) {
		response.status(500).json({ error: "Error" });
	}
});

//List of Department
router.post("/list", async (request, response) => {
	try {
		if (Object.keys(request.body).length > 0) {
			var id = [];
			var data = request.body;
			for (const i in data) {
				// console.log(`_id: ${request.body[i].value}`);
				id.push({_id: request.body[i].value});				
			}
			const dept = await departmentModel.find({
				'$or': id,
			}).sort('department');
			response.status(200).json(dept);
		} else {
			const dept = await departmentModel.find().sort('department');
			response.status(200).json(dept);
		}
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//For search options
router.get("/options", async (request, response) => {
	try {
		const dept = await departmentModel.find().sort('department');
		response.status(200).json(dept);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//Delete department from the database based on id
router.delete("/:id", async (request, response) => {
	try {
		const dept = await departmentModel.findById(request.params.id);
		const deletedDept = await dept.delete();
		response.status(200).json(deletedDept);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

module.exports = router;    