const router = require("express").Router();
const { loginValidation } = require("../utils/validation");
const userModel = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const { response, request } = require("express");

//Login Validation
router.post("/", async (request, response) => {
	try {
		const { error } = loginValidation(request.body);
		if (error) return response.status(400).send(error.details[0].message);

		//Check if username exist
		const user = await userModel.findOne({ UserName: request.body.userName });
		if (!user)
			return response.status(400).json({ message: "Account does not exist" });
		//Check if password is correct
		const validPassword = await bcrypt.compare(
			request.body.password,
			user.Password
		);
		if (!validPassword)
			return response.status(400).json({ message: "Invalid Password" });

		//Create and assign jwt token
		const token = jwt.sign(
			{ _id: user._id, UserName: user.UserName, Name: user.Name, role: user.role },
			process.env.SECRET_TOKEN
		);
		response.status(200).json({
			token,
			user: {
				Name: user.Name,
				userName: user.UserName,
				role: user.Role,
			},
		});
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

router.post("/tokenIsValid", async (request, response) => {
	try {
		const token = request.header("auth-token");
		if (!token) return response.json(false);

		const verified = jwt.verify(token, process.env.SECRET_TOKEN);
		if (!verified) return response.json(false);

		const user = await userModel.findById(verified._id);
		if (!user) return response.json(false);

		return response.json(true);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

module.exports = router;