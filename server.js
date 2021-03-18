const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectToMongodb = require("./utils/connectToMongodb");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const { PORT } = require("./config");

connectToMongodb();

app.use(express.json());
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//Images / Files middleware
app.use(express.static(path.join(__dirname, "/app_data")));

app.use(express.static("client/build"));

//Route to employees
const employeesRouter = require("./routers/employees");
app.use("/employees", employeesRouter);

//Route to salary
const salaryRouter = require("./routers/salary");
app.use("/salary", salaryRouter);

//Route to payroll
const payrollRouter = require("./routers/payroll");
app.use("/payroll", payrollRouter);

//Route to holiday sched
const hsRouter = require("./routers/holidaySchedule");
app.use("/holiday-schedule", hsRouter);

//Route to department
const departmentRouter = require("./routers/department");
app.use("/department", departmentRouter);

//Route to timelogs
const timeLogsRouter = require("./routers/timelogs");
app.use("/timelogs", timeLogsRouter);

app.listen(PORT, () => {
	console.log("Server Started");
});