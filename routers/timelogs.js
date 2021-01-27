const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const timeLogsModel = require("../models/timelogs");
const employeeModel = require("../models/employees");
const departmentModel = require("../models/department");
const fs = require('fs');
const xlsxFile = require('read-excel-file/node');
const moment = require('moment');
// const { registrationValidation } = require("../utils/validation");

//Import attendance to the database
router.post("/import", async (request, response) => {
    try {
        if (Object.keys(request.body.data).length > 0) {
            var id = [];
            var data = request.body.data;
            for (const i in data) {
                if (!data[i].EnNo) response.status(400).json({ error: "The file you are trying to import can't be read. Are you sure this is the correct file?" });

                const employees = await employeeModel.findOne({ employeeNo: data[i].EnNo });

                var utc_days = Math.floor(data[i].DaiGong - 25569);
                var utc_value = utc_days * 86400;
                var date_info = new Date(utc_value * 1000);

                var fractional_day = data[i].DaiGong - Math.floor(data[i].DaiGong) + 0.0000001;

                var total_seconds = Math.floor(86400 * fractional_day);

                var seconds = total_seconds % 60;

                total_seconds -= seconds;

                var hours = Math.floor(total_seconds / (60 * 60));
                var minutes = Math.floor(total_seconds / 60) % 60;

                const dateTime = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);

                const timelogs = new timeLogsModel({
                    employeeNo: data[i].EnNo,
                    timeInOut: data[i].Mode,
                    dateTime: dateTime,
                    employeeName: employees.firstName + " " + employees.middleName + " " + employees.lastName
                });
                const logs = await timelogs.save();
            }
            response.status(200).json('Success');
        }

        if (Object.keys(request.body.data).length === 0) response.status(400).json({ error: 'Please select file before importing!' });
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

// list raw logs
router.post("/raw-list", async (request, response) => {
    try {
        if (Object.keys(request.body).length > 0) {
            var empNo = [];
            var data = request.body;
            for (const i in data) {
                // console.log(`_id: ${request.body[i].value}`);
                empNo.push({ employeeNo: request.body[i].value });
            }
            const logs = await timeLogsModel.find({
                '$or': empNo,
            }).sort({ dateTime: -1 });

            var data = [];
            for (const i in logs) {
                var dataLog = {
                    "_id": logs[i]._id,
                    "employeeNo": logs[i].employeeNo,
                    "employeeName": logs[i].employeeName,
                    "timeInOut": logs[i].timeInOut,
                    "dateTime": logs[i].dateTime
                }
                data.push(dataLog);
            }
            response.status(200).json(data);
        } else {
            const logs = await timeLogsModel.find().sort({ dateTime: -1 });
            var data = [];
            for (const i in logs) {
                var dataLog = {
                    "_id": logs[i]._id,
                    "employeeNo": logs[i].employeeNo,
                    "employeeName": logs[i].employeeName,
                    "timeInOut": logs[i].timeInOut,
                    "dateTime": logs[i].dateTime
                }
                data.push(dataLog);
            }

            response.status(200).json(data);
        }
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

// list raw logs
router.get("/options", async (request, response) => {
    try {
        const data = await timeLogsModel.find().sort('employeeName');
        const unique = [];
        data.map(x => unique.filter(a => a.employeeName === x.employeeName).length > 0 ? null : unique.push({
            _id: x.id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName
        }));
        let logs = [...new Set(unique)];

        response.status(200).json(logs);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

router.post("/detailed-list", async (request, response) => {
    try {
        if (Object.keys(request.body.selectedDetailedLogs).length > 0) {
            var empNo = [];
            var data = request.body;
            for (const i in data) {
                // console.log(`_id: ${request.body[i].value}`);
                empNo.push({ employeeNo: request.body[i].value });
            }
            const logs = await timeLogsModel.find({
                '$or': empNo,
            }).sort({ dateTime: -1 });

            var data = [];
            for (const i in logs) {
                var dataLog = {
                    "_id": logs[i]._id,
                    "employeeNo": logs[i].employeeNo,
                    "employeeName": logs[i].employeeName,
                    "timeInOut": logs[i].timeInOut,
                    "dateTime": logs[i].dateTime
                }
                data.push(dataLog);
            }
            response.status(200).json(data);
        } else {
            var params = request.body;
            var fromDate = params.fromDate !== "" ? params.fromDate : moment("01/01/2020", "yyyy-MM-DD");
            var toDate = params.toDate !== "" ? params.toDate : moment().format("yyyy-MM-DD");

            const emp = await employeeModel.find().sort("firstName");
            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);
                const depIn = moment(dep.timeStart, "h:mm");
                const depOut = moment(dep.timeEnd, "h:mm");

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate < new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");

                    const dateTimeIn = await timeLogsModel.find({
                        employeeNo: emp[i].employeeNo,
                        dateTime: { $gte: new Date(dateTime).setHours(00,00,00), $lte: new Date(dateTime).setHours(23,59,59) },
                        timeInOut: "S"
                    }).sort({ dateTime: 1 });

                    const dateTimeOut = await timeLogsModel.find({
                        employeeNo: emp[i].employeeNo,
                        dateTime: { $gte: new Date(dateTime).setHours(00,00,00), $lte: new Date(dateTime).setHours(23,59,59) },
                        timeInOut: "E"
                    }).sort({ dateTime: -1 });

                    var timeIn = Object.keys(dateTimeIn).length !== 0 ? dateTimeIn[0].dateTime : "";
                    var timeOut = Object.keys(dateTimeOut).length !== 0 ? dateTimeOut[0].dateTime : "";

                    var late = 0;
                    if (moment(timeIn, "h:mm") > depIn) late = moment(timeIn, "h:mm") - depIn;

                    var ut = 0;
                    if (moment(timeOut, "h:mm") < depOut) ut = depOut - moment(timeOut, "h:mm");

                    var ot = 0;
                    if (moment(timeOut, "h:mm") > depOut) ot = moment(timeOut, "h:mm") - depOut;

                    var remarks = "";
                    if (theDate !== timeIn && theDate !== timeOut) remarks = "Absent";

                    if (theDate === timeIn && theDate !== timeOut) remarks = "Halfday";

                    if (theDate !== timeIn && theDate === timeOut) remarks = "Halfday";

                    var logs = {
                        "timeInOut": moment(timeIn).format("h:mm A") + " - " + moment(timeOut).format("h:mm A"),
                        "dateTime": dateTime,
                        "late": late,
                        "UT": ut,
                        "OT": ot,
                        "remarks": remarks
                    }

                    timeLogs.push(logs);

                    theDate.setDate(theDate.getDate() + 1);
                }

                var employeeLogs = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].firstName + " " + emp[i].middleName + " " + emp[i].lastName,
                    "department": dep.department,
                    "timeLogs": timeLogs,
                    "totalLate": 0,
                    "totalUT": 0,
                    "totalOT": 0,
                    "totalAbsent": 0
                }

                data.push(employeeLogs);
            }

            response.status(200).json(data);
        }
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
});

module.exports = router;