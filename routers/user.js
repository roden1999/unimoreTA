const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const userModel = require("../models/user");
const { registrationValidation, registrationEditValidation } = require("../utils/validation");

//Insert new user to the database
router.post("/", async (request, response) => {
	//Validate before creating
	const { error } = registrationValidation(request.body);
	if (error) return response.status(400).send(error.details[0].message);

	//Check if username exist
	const userNameExist = await userModel.findOne({
		UserName: request.body.userName,
	});
	if (userNameExist)
		return response.status(400).send("Username already exist");

	if (request.body.password !== request.body.confirmPassword)
		return response.status(400).send("The Confirm Password confirmation does not match.");

	//Hash passwords
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(request.body.password, salt);

	//Create new user
	const newUser = new userModel({
		Name: request.body.name,
		UserName: request.body.userName,
		Role: request.body.role,
		Password: hashedPassword,
	});
	try {
		const user = await newUser.save();
		response.status(200).json({ user: user.UserName });
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//Edit User
router.put("/:id", async (request, response) => {
	try {
		//Validate before creating
		const { error } = registrationEditValidation(request.body);
		if (error) return response.status(400).send(error.details[0].message);

		//Check if username exist
		const userNameExist = await userModel.findOne({
			UserName: request.body.userName,
		});
		if (userNameExist)
			return response.status(400).send("Username already exist");

		const user = await userModel.findById(request.params.id);
		const updates = request.body;
		const options = { new: true };
		const updatedUser = await userModel.findByIdAndUpdate(
			user,
			updates,
			options
		);
		response.status(200).json({ user: updatedUser.Name });
	} catch (error) {
		response.status(500).json({ error: "Error" });
	}
});

//Change Password
router.put("/change-password/:id", async (request, response) => {
	try {
		if (request.body.Password == "")
			return response.status(400).send("Password cannot be empty.");

		if (request.body.Password !== request.body.ConfirmPassword)
			return response.status(400).send("The Confirm Password confirmation does not match.");

		//Hash passwords
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(request.body.Password, salt);

		const user = await userModel.findById(request.params.id);
		const updates = { Password: hashedPassword };
		const options = { new: true };
		const updatedUser = await userModel.findByIdAndUpdate(
			user,
			updates,
			options
		);
		response.status(200).json({ user: updatedUser.Name });
	} catch (error) {
		response.status(500).json({ error: "Error" });
	}
});

//List of Users
router.post("/list", verify, async (request, response) => {
	try {
		if (Object.keys(request.body).length > 0) {
			var id = [];
			var data = request.body;

			for (const i in data) {
				// console.log(`_id: ${request.body[i].value}`);
				id.push({ _id: request.body[i].value });
			}

			const users = await userModel.find({
				'$or': id,
			}).sort('UserName');

			response.status(200).json(users);
		} else {
			const users = await userModel.find();
			response.status(200).json(users);
		}
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//Users Option
router.get("/search-options", verify, async (request, response) => {
	try {
		const users = await userModel.find();
		response.status(200).json(users);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

//Delete user from the database based on id
router.delete("/:id", async (request, response) => {
	try {
		const user = await userModel.findById(request.params.id);
		const deletedUser = await user.delete();
		response.status(200).json(deletedUser);
	} catch (error) {
		response.status(500).json({ error: error.message });
	}
});

module.exports = router;