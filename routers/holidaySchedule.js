const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const holidaySchedModel = require("../models/holidaySchedule");
const fs = require('fs');
const { holidaySchedValidation } = require("../utils/validation");
const moment = require('moment');

//Insert new hs to the database
router.post("/", async (request, response) => {
	//Validate before creating
	const { error } = holidaySchedValidation(request.body);
	if (error) return response.status(400).send(error.details[0].message);

	var dt = request.body.date;

	//Check if hs exist
	const hsExist = await holidaySchedModel.findOne({
		date: { $gte: new Date(dt).setHours(00, 00, 00), $lte: new Date(dt).setHours(23, 59, 59) },
		IsDeleted: false
	});
	if (hsExist)
		return response.status(400).json({ message: "Holiday already assigned on this date." });

	//Create new hs
	const newHs = new holidaySchedModel({
		date: request.body.date,
		title: request.body.title,
		type: request.body.type
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
		const holiday = await holidaySchedModel.findById(request.params.id);
		const updates = request.body;
		const options = { new: true };
		const updatedHoliday = await holidaySchedModel.findByIdAndUpdate(
			holiday,
			updates,
			options
		);
		response.status(200).json(updatedHoliday);
	} catch (error) {
		response.status(500).json({ error: "Error" });
	}
});

//List of HS
router.get("/list", async (request, response) => {
	try {
		const holiday = await holidaySchedModel.find({ IsDeleted: false }).sort('department');
		var data = [];

		for (const i in holiday) {
			var date = moment(holiday[i].date).format("MM/DD/yyyy");
			var holidayData = {
				id: holiday[i]._id,
				title: holiday[i].title,
				type: holiday[i].type,
				start: new Date(date),
				end: new Date(date)
			}

			data.push(holidayData);
		}
		response.status(200).json(data);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//Delete sched from the database based on id
router.delete("/:id", async (request, response) => {
	try {
		const sched = await holidaySchedModel.findById(request.params.id);
		const updates = { IsDeleted: true };
        const options = { new: true };
		const deletedSched = await holidaySchedModel.findByIdAndUpdate(
			sched,
			updates,
			options
		);
		response.status(200).json(deletedSched);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

module.exports = router;