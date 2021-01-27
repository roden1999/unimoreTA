const jwt = require("jsonwebtoken");
const employee = require("../models/employees");
const { SECRET_TOKEN } = require("../config");

//Verify token if valid
module.exports = function (request, response, next) {
	const token = request.header("auth-token");
	if (!token) return response.status(401).json({ message: "Access Denied" });
	try {
		const verified = jwt.verify(token, SECRET_TOKEN);
		request.employee = verified;

		next();
	} catch (error) {
		response.status(400).json({ message: "Invalid Token" });
	}
};
