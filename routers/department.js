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

	var timePerDay = request.body.timePerDay;
	for (const i in timePerDay) {
		var tS = timePerDay[i].timeStart;
		var tE = timePerDay[i].timeEnd;
		if (tS === "") return response.status(400).json("Time Start must have value.");

		if (tE === "") return response.status(400).json("Time End must have value.");
	}

	/* var timePerDay = [
		{ "day": "Monday", "timeStart": "8:00", "timeEnd": "6:00" },
		{ "day": "Tuesday", "timeStart": "8:00", "timeEnd": "6:00" },
		{ "day": "Wednesday", "timeStart": "8:00", "timeEnd": "6:00" },
		{ "day": "Thursday", "timeStart": "8:00", "timeEnd": "6:00" },
		{ "day": "Friday", "timeStart": "8:00", "timeEnd": "6:00" },
		{ "day": "Saturday", "timeStart": "8:00", "timeEnd": "6:00" }
	]; */

	var convert2string = JSON.stringify(request.body.timePerDay);

	//Create new user
	const newDept = new departmentModel({
		department: request.body.department,
		timePerDay: convert2string,
		dayNightShift: request.body.dayNightShift
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
		if (Object.keys(request.body.selectedDepartment).length > 0) {
			var id = [];
			var data = request.body.selectedDepartment;
			for (const i in data) {
				// console.log(`_id: ${request.body[i].value}`);
				id.push({ _id: request.body.selectedDepartment[i].value });
			}
			const dept = await departmentModel.find({
				'$or': id,
				IsDeleted: false
			}).sort('department');
			response.status(200).json(dept);
		} else {
			const dept = await departmentModel.find({ IsDeleted: false }).sort('department');
			response.status(200).json(dept);
		}
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//For search options
router.get("/options", async (request, response) => {
	try {
		const dept = await departmentModel.find({ IsDeleted: false }).sort('department');
		response.status(200).json(dept);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//Delete department from the database based on id
router.delete("/:id", async (request, response) => {
	try {
		const dept = await departmentModel.findById(request.params.id);
		// const deletedDept = await dept.delete();
		const updates = { IsDeleted: true };
		const options = { new: true };
		const deletedDept = await departmentModel.findByIdAndUpdate(
			dept,
			updates,
			options
		);
		response.status(200).json(deletedDept);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

module.exports = router;