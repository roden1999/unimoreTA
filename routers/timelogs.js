const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const timeLogsModel = require("../models/timelogs");
const employeeModel = require("../models/employees");
const departmentModel = require("../models/department");
const dtrcModel = require("../models/dtrcorrection");
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
                    employeeName: employees.firstName + " " + employees.middleName + " " + employees.lastName,
                    remarks: "",
                    reason: "",
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
        var page = request.body.page !== "" ? request.body.page : 0;
        var perPage = 20;
        if (Object.keys(request.body.selectedLogs).length > 0) {
            var empNo = [];
            var data = request.body.selectedLogs;
            for (const i in data) {
                // console.log(`_id: ${request.body[i].value}`);
                empNo.push({ employeeNo: request.body.selectedLogs[i].value });
            }
            const logs = await timeLogsModel.find({
                '$or': empNo,
            }).skip((page - 1) * perPage).limit(perPage).sort({ dateTime: -1 });

            var data = [];
            for (const i in logs) {
                const emp = await employeeModel.findOne({ employeeNo: logs[i].employeeNo });
                var dataLog = {
                    "_id": logs[i]._id,
                    "employeeNo": logs[i].employeeNo,
                    "employeeName": emp.firstName + " " + emp.middleName + " " + emp.lastName,
                    "timeInOut": logs[i].timeInOut,
                    "dateTime": logs[i].dateTime
                }
                data.push(dataLog);
            }
            // response.status(200).json(data.splice((page - 1) * perPage, page * perPage));
            response.status(200).json(data);
        } else {
            const logs = await timeLogsModel.find().skip((page - 1) * perPage).limit(perPage).sort({ dateTime: -1 });
            var data = [];
            for (const i in logs) {
                const emp = await employeeModel.findOne({ employeeNo: logs[i].employeeNo });
                var dataLog = {
                    "_id": logs[i]._id,
                    "employeeNo": logs[i].employeeNo,
                    "employeeName": emp.firstName + " " + emp.middleName + " " + emp.lastName,
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

// list total logs
router.get("/total-logs", async (request, response) => {
    try {
        // const data = await timeLogsModel.find().sort('employeeName');
        const data = await timeLogsModel.find();

        response.status(200).json(data.length);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

// list raw logs
router.get("/options", async (request, response) => {
    try {
        // const data = await timeLogsModel.find().sort('employeeName');
        const data = await employeeModel.find().sort('employeeName');
        const unique = [];
        data.map(x => unique.filter(a => a._id === x._id).length > 0 ? null : unique.push({
            _id: x.id,
            employeeNo: x.employeeNo,
            employeeName: x.firstName + " " + x.middleName + " " + x.lastName
        }));
        let logs = [...new Set(unique)];

        response.status(200).json(logs);
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

router.post("/detailed-list", async (request, response) => {
    try {
        var page = request.body.page !== "" ? request.body.page : 0;
        var perPage = 5;
        if (Object.keys(request.body.selectedDetailedLogs).length > 0) {
            var params = request.body;
            var fromDate = params.fromDate !== "" ? params.fromDate : moment("01/01/2020", "yyyy-MM-DD");
            var toDate = params.toDate !== "" ? params.toDate : moment().format("yyyy-MM-DD");

            var id = [];
            var data = request.body.selectedDetailedLogs;
            for (const i in data) {
                id.push({ employeeNo: data[i].value });
            }
            const emp = await employeeModel.find({
                '$or': id,
            }).skip((page - 1) * perPage).limit(perPage).sort("firstName");
            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);
                var timePerDay = JSON.parse(dep.timePerDay);
                var depIn = '';
                var depOut = '';

                var totalHrsWork = 0;
                var totalLate = 0;
                var totalUT = 0;
                var totalOT = 0;
                var totalAbsent = 0;

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var day = moment(theDate).format("dddd");

                    for (const j in timePerDay) {
                        if (day === timePerDay[j].day) {
                            depIn = timePerDay[j].timeStart;
                            depOut = timePerDay[j].timeEnd;
                        }
                    }

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: 1 });

                    var timeIn = "";
                    var timeOut = "";

                    if (Object.keys(dtr).length > 0) {
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm").format("h:mm") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm").format("h:mm") : "";
                    } else {
                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm") : "";
                        timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm") : "";
                    }

                    var convertedDate = moment(dateTime, "MM/DD/yyyy").format("MM/DD/yyyy");

                    var convertedDI = moment(depIn, "h:mm").hours() + ":" + moment(depIn, "h:mm").minutes();
                    var convertedDO = moment(depOut, "h:mm").hours() + ":" + moment(depOut, "h:mm").minutes();

                    var convertedTI = moment(convertedDate + " " + timeIn + ":00 AM").format();
                    var convertedTO = moment(convertedDate + " " + timeOut + ":00 PM").format();

                    var convertedDTI = moment(convertedDate + " " + convertedDI + ":00 AM").format();
                    var convertedDTO = moment(convertedDate + " " + convertedDO + ":00 PM").format();

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedDTI).getTime()) {
                        var date1 = new Date(convertedDTI).getTime();

                        var date2 = new Date(convertedTI).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);

                        late = mins / 60;
                    }

                    var ut = 0;
                    if (new Date(convertedTO).getTime() < new Date(convertedTO).getTime()) {
                        var date1 = new Date(convertedTO).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        ut = mins / 60;
                    }

                    var ot = 0;
                    if (moment(timeOut, "h:mm").hours() > moment(depOut).hours())
                        ot = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment(depOut, "h:mm").hours();

                    var hoursWork = 0;
                    if (timeIn && timeOut) {
                        var date1 = new Date(convertedTI).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);
                        // var hrs = Math.floor(mins / 60);

                        // var sync = moment((hrs % 24) + ":" + mins, "h:mm");
                        hoursWork = mins / 60;
                    }

                    var remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : "";
                    if (remarks === "Overtime") {
                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            hoursWork = mins / 60;

                            remarks = "Overtime";
                        }
                    }

                    if (remarks !== "Overtime" && new Date(convertedTO).getTime() > new Date(convertedDTO).getTime()) {
                        ot = 0;
                        remarks = "OT For Approval";
                    }

                    if (remarks === "" && moment(timeIn, "h:mm").hour() + (moment(timeIn, "h:mm").minutes() / 60) > moment(depIn).hours() + (moment(depIn).minutes() / 60)) {
                        remarks = "Late";
                    }

                    if (!timeIn && !timeOut) remarks = "Absent";

                    if (!timeIn && timeOut) {
                        remarks = "Halfday";
                        hoursWork = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment("1:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (timeIn && !timeOut) {
                        remarks = "Halfday";
                        hoursWork = moment(timeIn, "h:mm").hours() + (moment(timeIn, "h:mm").minutes() / 60) - moment("12:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (day === "Sunday") {
                        timeIn = "";
                        timeOut = "";
                        hoursWork = 0;
                        late = 0;
                        ut = 0;
                        ot = 0;
                        remarks = "Rest Day"
                    }

                    totalHrsWork = totalHrsWork + hoursWork;
                    totalLate = totalLate + late;
                    totalUT = totalUT + ut;
                    totalOT = totalOT + ot;
                    totalAbsent = remarks === "Absent" ? totalAbsent + 1 : totalAbsent;

                    var logs = {
                        "timeIn": moment(timeIn, "h:mm").format("h:mm"),
                        "timeOut": moment(timeOut, "h:mm").format("h:mm"),
                        "timeStartEnd": moment(depIn, "h:mm").format("h:mm") + " AM - " + moment(depOut, "h:mm").format("h:mm") + " PM",
                        "dateTime": dateTime,
                        "day": day,
                        "hoursWork": hoursWork.toFixed(2),
                        "late": late.toFixed(2),
                        "UT": ut.toFixed(2),
                        "OT": ot.toFixed(2),
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
                    "totalHoursWork": totalHrsWork.toFixed(2),
                    "totalLate": totalLate.toFixed(2),
                    "totalUT": totalUT.toFixed(2),
                    "totalOT": totalOT.toFixed(2),
                    "totalAbsent": totalAbsent
                }

                data.push(employeeLogs);
            }
            response.status(200).json(data);
        } else {
            var params = request.body;
            var fromDate = params.fromDate !== "" ? params.fromDate : moment("01/01/2020", "yyyy-MM-DD");
            var toDate = params.toDate !== "" ? params.toDate : moment().format("yyyy-MM-DD");

            const emp = await employeeModel.find().skip((page - 1) * perPage).limit(perPage).sort("firstName");
            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);
                var timePerDay = JSON.parse(dep.timePerDay);
                var depIn = '';
                var depOut = '';

                var totalHrsWork = 0;
                var totalLate = 0;
                var totalUT = 0;
                var totalOT = 0;
                var totalAbsent = 0;

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var day = moment(theDate).format("dddd");

                    for (const j in timePerDay) {
                        if (day === timePerDay[j].day) {
                            depIn = timePerDay[j].timeStart;
                            depOut = timePerDay[j].timeEnd;
                        }
                    }

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: 1 });

                    var timeIn = "";
                    var timeOut = "";

                    if (Object.keys(dtr).length > 0) {
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm").format("h:mm") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm").format("h:mm") : "";
                    } else {
                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm") : "";
                        timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm") : "";
                    }

                    var convertedDate = moment(dateTime, "MM/DD/yyyy").format("MM/DD/yyyy");

                    var convertedDI = moment(depIn, "h:mm").hours() + ":" + moment(depIn, "h:mm").minutes();
                    var convertedDO = moment(depOut, "h:mm").hours() + ":" + moment(depOut, "h:mm").minutes();

                    var convertedTI = moment(convertedDate + " " + timeIn + ":00 AM").format();
                    var convertedTO = moment(convertedDate + " " + timeOut + ":00 PM").format();

                    var convertedDTI = moment(convertedDate + " " + convertedDI + ":00 AM").format();
                    var convertedDTO = moment(convertedDate + " " + convertedDO + ":00 PM").format();

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedDTI).getTime()) {
                        var date1 = new Date(convertedDTI).getTime();

                        var date2 = new Date(convertedTI).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);

                        late = mins / 60;
                    }

                    var ut = 0;
                    if (new Date(convertedTO).getTime() < new Date(convertedTO).getTime()) {
                        var date1 = new Date(convertedTO).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        ut = mins / 60;
                    }

                    var ot = 0;
                    if (moment(timeOut, "h:mm").hours() > moment(depOut).hours())
                        ot = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment(depOut, "h:mm").hours();

                    var hoursWork = 0;
                    if (timeIn && timeOut) {
                        var date1 = new Date(convertedTI).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);
                        // var hrs = Math.floor(mins / 60);

                        // var sync = moment((hrs % 24) + ":" + mins, "h:mm");
                        hoursWork = mins / 60;
                    }

                    var remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : "";
                    if (remarks === "Overtime") {
                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            hoursWork = mins / 60;

                            remarks = "Overtime";
                        }
                    }

                    if (remarks !== "Overtime" && new Date(convertedTO).getTime() > new Date(convertedDTO).getTime()) {
                        ot = 0;
                        remarks = "OT For Approval";
                    }

                    if (remarks === "" && moment(timeIn, "h:mm").hour() + (moment(timeIn, "h:mm").minutes() / 60) > moment(depIn).hours() + (moment(depIn).minutes() / 60)) {
                        remarks = "Late";
                    }

                    if (!timeIn && !timeOut) remarks = "Absent";

                    if (!timeIn && timeOut) {
                        remarks = "Halfday";
                        hoursWork = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment("1:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (timeIn && !timeOut) {
                        remarks = "Halfday";
                        hoursWork = moment(timeIn, "h:mm").hours() + (moment(timeIn, "h:mm").minutes() / 60) - moment("12:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (day === "Sunday") {
                        timeIn = "";
                        timeOut = "";
                        hoursWork = 0;
                        late = 0;
                        ut = 0;
                        ot = 0;
                        remarks = "Rest Day"
                    }

                    totalHrsWork = totalHrsWork + hoursWork;
                    totalLate = totalLate + late;
                    totalUT = totalUT + ut;
                    totalOT = totalOT + ot;
                    totalAbsent = remarks === "Absent" ? totalAbsent + 1 : totalAbsent;

                    var logs = {
                        "timeIn": moment(timeIn, "h:mm").format("h:mm"),
                        "timeOut": moment(timeOut, "h:mm").format("h:mm"),
                        "timeStartEnd": moment(depIn, "h:mm").format("h:mm") + " AM - " + moment(depOut, "h:mm").format("h:mm") + " PM",
                        "dateTime": dateTime,
                        "day": day,
                        "hoursWork": hoursWork.toFixed(2),
                        "late": late.toFixed(2),
                        "UT": ut.toFixed(2),
                        "OT": ot.toFixed(2),
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
                    "totalHoursWork": totalHrsWork.toFixed(2),
                    "totalLate": totalLate.toFixed(2),
                    "totalUT": totalUT.toFixed(2),
                    "totalOT": totalOT.toFixed(2),
                    "totalAbsent": totalAbsent
                }

                data.push(employeeLogs);
            }

            response.status(200).json(data);
        }
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
});

//dtr correction logs
router.post("/dtr-correction", async (request, response) => {
    try {
        if (Object.keys(request.body.selectedDtrcLogs).length > 0) {
            var params = request.body;
            var fromDate = params.fromDate !== "" ? params.fromDate : moment("01/01/2020", "yyyy-MM-DD");
            var toDate = params.toDate !== "" ? params.toDate : moment().format("yyyy-MM-DD");

            var id = [];
            var params = request.body.selectedDtrcLogs;
            for (const i in params) {
                id.push({ employeeNo: params[i].value });
            }
            const emp = await employeeModel.find({
                '$or': id,
            }).sort("firstName");

            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var day = moment(theDate).format("dddd");

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: 1 });

                    var timeIn = "";
                    var timeOut = "";
                    var remarks = "";
                    var reason = "";

                    if (Object.keys(dtr).length > 0) {
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm").format("h:mm") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm").format("h:mm") : "";
                        remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : "";
                        reason = Object.keys(dtr).length !== 0 ? dtr[0].reason : "";
                    } else {
                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm") : "";
                        timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm") : "";
                        remarks = "";
                        reason = "";
                    }

                    if (day === "Sunday") {
                        timeIn = "";
                        timeOut = "";
                        remarks = "Rest Day";
                    }


                    var logs = {
                        "empNo": emp[i].employeeNo,
                        "empName": emp[i].firstName + " " + emp[i].middleName + " " + emp[i].lastName,
                        "department": emp[i].department,
                        "day": day,
                        "date": dateTime,
                        "timeIn": timeIn !== "" ? moment(timeIn, "h:mm").format("h:mm") : "",
                        "timeOut": timeOut !== "" ? moment(timeOut, "h:mm").format("h:mm") : "",
                        "remarks": remarks,
                        "reason": reason
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
                }

                data.push(employeeLogs);
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

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var day = moment(theDate).format("dddd");

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: 1 });

                    var timeIn = "";
                    var timeOut = "";
                    var remarks = "";
                    var reason = "";

                    if (Object.keys(dtr).length > 0) {
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm").format("h:mm") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm").format("h:mm") : "";
                        remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : "";
                        reason = Object.keys(dtr).length !== 0 ? dtr[0].reason : "";
                    } else {
                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm") : "";
                        timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm") : "";
                        remarks = "";
                        reason = "";
                    }

                    if (day === "Sunday") {
                        timeIn = "";
                        timeOut = "";
                        remarks = "Rest Day";
                    }


                    var logs = {
                        "empNo": emp[i].employeeNo,
                        "empName": emp[i].firstName + " " + emp[i].middleName + " " + emp[i].lastName,
                        "department": emp[i].department,
                        "day": day,
                        "date": dateTime,
                        "timeIn": timeIn !== "" ? moment(timeIn, "h:mm").format("h:mm") : "",
                        "timeOut": timeOut !== "" ? moment(timeOut, "h:mm").format("h:mm") : "",
                        "remarks": remarks,
                        "reason": reason
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
                }

                data.push(employeeLogs);
            }

            response.status(200).json(data);
        }
    } catch (err) {
        response.status(500).json({ error: err.message });
    }
});

router.post("/approved-dtr-correction", async (request, response) => {
    try {
        var errors = [];
        var data = request.body;
        var date = new Date(data.date);
        var timeIn = data.timeIn;
        var timeOut = data.timeOut;
        var dateApproved = moment();
        var day = moment(date).format("dddd");

        const dept = await departmentModel.findById(data.department);
        var timePerDay = JSON.parse(dept.timePerDay);

        if (data.remarks === "" || typeof data.remarks === "undefined")
            errors.push({ error: "Remarks must have a value." })

        if (data.timeIn === "" && data.remarks !== "Sick Leave" && data.remarks !== "Vacation Leave")
            errors.push({ error: "Time In cannot be empty." });

        if (data.timeOut === "" && data.remarks !== "Sick Leave" && data.remarks !== "Vacation Leave")
            errors.push({ error: "Time Out cannot be empty." });

        if (data.remarks === "Overtime" && moment(data.timeOut, "h:mm").hours() + (moment(data.timeOut, "h:mm").minutes() / 60) <= moment(dept.timeEnd, "h:mm").hours())
            errors.push({ error: "Can't approved OT with timeout is less than or equal to end time." });


        if (data.remarks === "Vacation Leave" || data.remarks === "Sick Leave") {
            for (const i in timePerDay) {
                if (day === timePerDay[i].day) {
                    timeIn = timePerDay[i].timeStart;
                    timeOut = timePerDay[i].timeEnd;
                }
            }
        }

        if (Object.keys(errors).length === 0) {

            const dtrCorrection = new dtrcModel({
                employeeNo: data.employeeNo,
                date: date,
                timeIn: timeIn,
                timeOut: timeOut,
                employeeName: data.employeeName,
                remarks: data.remarks,
                reason: data.reason,
                dateApproved: dateApproved
            });

            const dtrc = await dtrCorrection.save();

            response.status(200).json({ dtrc: dtrc.employeeName + " Time Correction successfully filed." });
        } else {
            response.status(400).json({ error: errors });
        }
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

module.exports = router;