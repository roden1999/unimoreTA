const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const holidaySchedModel = require("../models/holidaySchedule");
const fs = require('fs');
const { holidaySchedValidation } = require("../utils/validation");

//Insert new hs to the database
router.post("/", async (request, response) => {
	//Validate before creating
	const { error } = holidaySchedValidation(request.body);
	if (error) return response.status(400).send(error.details[0].message);

	//Check if hs exist
	const hsExist = await holidaySchedModel.findOne({
		department: request.body.department,
	});
	if (hsExist)
		return response.status(400).json({ message: "Department already exist." });

	//Create new hs
	const newHs = new departmentModel({
		date: request.body.date,
		title: request.body.title,
		remarks: request.body.remarks
	});
	try {
		const holidaySchedule = await newHs.save();
		response.status(200).json({ hs: holidaySchedule.date });
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

//List of HS
router.post("/list", async (request, response) => {
	try {
        // var date = request.body.date ?  
		if (Object.keys(request.body).length > 0) {
			var id = [];
			var data = request.body;
			for (const i in data) {
				// console.log(`_id: ${request.body[i].value}`);
				id.push({_id: request.body[i].value});				
			}
			const dept = await departmentModel.find({
				'$or': id,
			}).sort('date');
			response.status(200).json(dept);
		} else {
			const dept = await departmentModel.find().sort('department');
			response.status(200).json(dept);
		}
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