const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const timeLogsModel = require("../models/timelogs");
const employeeModel = require("../models/employees");
const departmentModel = require("../models/department");
const dtrcModel = require("../models/dtrcorrection");
const holidaySchedule = require("../models/holidaySchedule");
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
                if (!data[i].EnNo && !data[i].DaiGong) response.status(400).json({ error: `The file you are trying to import can't be read. Are you sure this is the correct file?` });

                const employees = await employeeModel.findOne({ employeeNo: data[i].EnNo });

                // var utc_days = Math.floor(data[i].DaiGong - 25569);
                // var utc_value = utc_days * 86400;
                // var date_info = new Date(utc_value * 1000);

                // var fractional_day = data[i].DaiGong - Math.floor(data[i].DaiGong) + 0.0000001;

                // var total_seconds = Math.floor(86400 * fractional_day);

                // var seconds = total_seconds % 60;

                // total_seconds -= seconds;

                // var hours = Math.floor(total_seconds / (60 * 60));
                // var minutes = Math.floor(total_seconds / 60) % 60;

                // const dateTime = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
                const dateTime = moment(data[i].DaiGong);

                console.log(moment(dateTime).format("MM-DD-yyyy h:mm A"));

                const timelogs = new timeLogsModel({
                    employeeNo: data[i].EnNo,
                    timeInOut: data[i].Mode,
                    dateTime: moment(dateTime).format("MM-DD-yyyy h:mm A"),
                    employeeName: !employees ? "" : employees.firstName + " " + employees.middleName + " " + employees.lastName,
                    remarks: "",
                    reason: "",
                });
                const logs = await timelogs.save();
            }
            response.status(200).json({ logs: "Logs successfully imported." });
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
        var fromDate = request.body.fromDate !== "" ? request.body.fromDate : moment("01/01/2020", "yyyy-MM-DD");
        var toDate = request.body.toDate !== "" ? request.body.toDate : moment().format("yyyy-MM-DD");
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
                dateTime: { $gte: new Date(fromDate).setHours(00, 00, 00), $lte: new Date(toDate).setHours(23, 59, 59) }
            }).sort({ dateTime: -1 });

            var data = [];
            for (const i in logs) {
                const emp = await employeeModel.findOne({ employeeNo: logs[i].employeeNo });
                var dataLog = {
                    "_id": logs[i]._id,
                    "employeeNo": logs[i].employeeNo,
                    "employeeName": !emp ? "" : emp.lastName + ", " + emp.firstName + " " + emp.middleName + " " + emp.suffix,
                    "timeInOut": logs[i].timeInOut,
                    "dateTime": logs[i].dateTime
                }
                data.push(dataLog);
            }
            // response.status(200).json(data.splice((page - 1) * perPage, page * perPage));
            response.status(200).json(data);
        } else {
            const logs = await timeLogsModel.find({
                dateTime: { $gte: new Date(fromDate).setHours(00, 00, 00), $lte: new Date(toDate).setHours(23, 59, 59) }
            }).skip((page) * perPage).limit(perPage).sort({ dateTime: -1 });

            var data = [];
            for (const i in logs) {
                const emp = await employeeModel.findOne({ employeeNo: logs[i].employeeNo });
                var dataLog = {
                    "_id": logs[i]._id,
                    "employeeNo": logs[i].employeeNo,
                    "employeeName": !emp ? "" : emp.lastName + " " + emp.firstName + " " + emp.middleName,
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
router.post("/total-logs", async (request, response) => {
    try {
        var fromDate = request.body.fromDate !== "" ? request.body.fromDate : moment("01/01/2020", "yyyy-MM-DD");
        var toDate = request.body.toDate !== "" ? request.body.toDate : moment().format("yyyy-MM-DD");

        if (Object.keys(request.body.selectedLogs).length > 0) {
            var empNo = [];
            var data = request.body.selectedLogs;

            for (const i in data) {
                empNo.push({ employeeNo: request.body.selectedLogs[i].value });
            }

            const logs = await timeLogsModel.find({
                '$or': empNo,
                dateTime: { $gte: new Date(fromDate).setHours(00, 00, 00), $lte: new Date(toDate).setHours(23, 59, 59) }
            });

            response.status(200).json(logs.length);
        } else {
            const logs = await timeLogsModel.find({
                dateTime: { $gte: new Date(fromDate).setHours(00, 00, 00), $lte: new Date(toDate).setHours(23, 59, 59) }
            });

            response.status(200).json(logs.length);
        }
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
            var dep = [];
            var rmrks = [];
            var data = request.body.selectedDetailedLogs;
            var paramDep = request.body.selectedDepartment;
            var paramRmrks = request.body.selectedRemarks;
            for (const i in data) {
                // console.log(`_id: ${request.body[i].value}`);
                id.push({ employeeNo: request.body.selectedDetailedLogs[i].value });
            }
            for (const i in paramDep) {
                // console.log(`_id: ${request.body[i].value}`);
                dep.push({ department: request.body.selectedDepartment[i].value });
            }
            for (const i in paramRmrks) {
                // console.log(`_id: ${request.body[i].value}`);
                rmrks.push({ remarks: request.body.selectedRemarks.value });
            }

            var emp = [];
            if (Object.keys(dep).length > 0) {
                emp = await employeeModel.find({
                    '$or': id,
                    '$and': [
                        { '$or': dep }
                    ],
                    IsDeleted: false
                }).sort('lastName');
            } else {
                emp = await employeeModel.find({
                    '$or': id,
                    IsDeleted: false
                }).sort('lastName');
            }

            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);
                var timePerDay = JSON.parse(dep.timePerDay);
                var depIn = '';
                var depOut = '';

                var totalDays = 0;
                var totalHrsWork = 0;
                var totalRestday = 0;
                var totalRestdayOt = 0;
                var totalHoliday = 0;
                var totalHolidayOt = 0;
                var totalSpecialHoliday = 0;
                var totalSpecialHolidayOt = 0;
                var totalHolidayRestday = 0;
                var totalHolidayRestdayOt = 0;
                var totalSpecialHolidayRestday = 0;
                var totalSpecialHolidayRestdayOt = 0;
                var totalLate = 0;
                var totalUT = 0;
                var totalOT = 0;
                var totalAbsent = 0;

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var day = moment(theDate).format("dddd");

                    const holiday = await holidaySchedule.find({
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    });

                    for (const j in timePerDay) {
                        if (day === timePerDay[j].day) {
                            depIn = timePerDay[j].timeStart;
                            depOut = timePerDay[j].timeEnd;
                        }
                    }

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: -1 });

                    var timeIn = "";
                    var timeOut = "";
                    var breakOut = "";
                    var breakIn = "";

                    var dt = dateTime;
                    var nxtDay = moment(theDate, "yyyy-MM-DD").add(1, 'd');
                    var nxtDayOT = [];

                    var reason = "";
                    var breakTime = 0;

                    if (Object.keys(dtr).length > 0) {
                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(05, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dt).setHours(00, 00, 00), $lte: new Date(dt).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        var breakTimeOut;
                        var breakTimeIn;
                        if (day !== "Saturday") {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 00, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 01, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: -1 });
                        } else {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 00, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 01, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: -1 });
                        }

                        nxtDayOT = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(nxtDay).setHours(00, 00, 00), $lte: new Date(nxtDay).setHours(04, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: -1 });

                        if (dtr[0].remarks === "Overtime") {
                            timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                            if (Object.keys(nxtDayOT).length === 0) {
                                timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                            } else {
                                timeOut = Object.keys(nxtDayOT).length !== 0 ? moment(nxtDayOT[0].dateTime).format("h:mm A") : "";
                            }
                            breakOut = Object.keys(breakTimeOut).length !== 0 ? moment(breakTimeOut[0].dateTime).format("h:mm A") : "";
                            breakIn = Object.keys(breakTimeIn).length !== 0 ? moment(breakTimeIn[0].dateTime).format("h:mm A") : "";
                        } else {
                            timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                            timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                            breakOut = Object.keys(breakTimeOut).length !== 0 ? moment(breakTimeOut[0].dateTime).format("h:mm A") : "";
                            breakIn = Object.keys(breakTimeIn).length !== 0 ? moment(breakTimeIn[0].dateTime).format("h:mm A") : "";
                        }

                        reason = Object.keys(dtr).length !== 0 ? dtr[0].reason : "";
                        breaktime = Object.keys(dtr).length !== 0 && dtr[0].breakTime === true ? 0 : 0;
                    } else {
                        // var dt = dateTime;
                        if (dep.dayNightShift === false) {
                            var date = new Date();
                            date.setDate(theDate.getDate() + 1);
                            dt = moment(date, "MM-DD-yyyy");
                        }

                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(05, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dt).setHours(00, 00, 00), $lte: new Date(dt).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        var breakTimeOut;
                        var breakTimeIn;
                        if (day !== "Saturday") {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 00, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 01, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: -1 });
                        } else {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 00, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 01, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: -1 });
                        }

                        nxtDayOT = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(nxtDay).setHours(00, 00, 00), $lte: new Date(nxtDay).setHours(04, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                        if (Object.keys(nxtDayOT).length === 0) {
                            timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                        } else {
                            timeOut = Object.keys(nxtDayOT).length !== 0 ? moment(nxtDayOT[0].dateTime).format("h:mm A") : "";
                        }
                        breakOut = Object.keys(breakTimeOut).length !== 0 ? moment(breakTimeOut[0].dateTime).format("h:mm A") : "";
                        breakIn = Object.keys(breakTimeIn).length !== 0 ? moment(breakTimeIn[0].dateTime).format("h:mm A") : "";
                    }

                    var convertedDate = moment(dateTime, "MM/DD/yyyy").format("MM/DD/yyyy");

                    // var convertedDI = moment(depIn, "h:mm").hours() + ":" + moment(depIn, "h:mm").minutes();
                    // var convertedDO = moment(depOut, "h:mm").hours() + ":" + moment(depOut, "h:mm").minutes();

                    // var ts = dep.dayNightShift === true ? "AM" : "PM";
                    // var te = dep.dayNightShift === true ? "PM" : "AM";

                    var todt = moment(dt).format("MM/DD/yyyy");
                    var convertedTI = moment(convertedDate + " " + timeIn).format();
                    var convertedTO = moment(todt + " " + timeOut).format();

                    var convertedDTI = moment(convertedDate + " " + depIn).format();
                    var convertedLateDTI = moment(convertedDate + " " + depIn).add(15, 'minutes').format();
                    var convertedDTO = moment(todt + " " + depOut).format();

                    var remarks = "";

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedLateDTI).getTime() && day !== "Sunday") {
                        var date1 = new Date(convertedDTI).getTime();

                        var date2 = new Date(convertedTI).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);

                        late = mins / 60;
                    }

                    var ut = 0;
                    if (new Date(convertedTO).getTime() < new Date(convertedDTO).getTime() && timeOut !== "" && day !== "Sunday" && Object.keys(nxtDayOT).length === 0) {
                        var date1 = new Date(convertedTO).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        ut = mins / 60;
                        remarks = "Undertime";
                    }

                    var ot = 0;
                    if (moment(timeOut, "h:mm").hours() > moment(depOut).hours() && Object.keys(nxtDayOT).length === 0)
                        ot = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment(depOut, "h:mm").hours();

                    var hoursWork = 0;
                    if (timeIn && timeOut && day !== "Sunday") {
                        var date1 = new Date(convertedLateDTI).getTime() >= new Date(convertedTI).getTime() ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                        var date2 = new Date(convertedDTO).getTime() <= new Date(convertedTO).getTime() ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);
                        // var hrs = Math.floor(mins / 60);

                        // var sync = moment((hrs % 24) + ":" + mins, "h:mm");
                        var hw = Math.floor(mins / 60); //fix for labis na computation Math.floor()
                        hoursWork = hw > 5 ? hw - 0 : hw;
                    }

                    if (timeIn && timeOut && day === "Sunday") {
                        var date1 = new Date(convertedTI).getTime();
                        var date2 = new Date(convertedTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        // hoursWork = mins / 60;
                    }

                    remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : remarks;
                    if (remarks === "Overtime" && day !== "Sunday") {
                        if (timeIn && timeOut && Object.keys(nxtDayOT).length === 0) {
                            var date1 = depIn <= timeIn ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                            var date2 = depOut >= timeOut ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();
                            var date3 = new Date(convertedDTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            var msecOT = date2 - date3;
                            // var otMins = Math.floor(msecOT / 60000);

                            var hw = mins / 60;
                            // hoursWork = hw > 5 ? hw - 1 : hw;
                            // ot = otMins / 60;

                            // hoursWork = (hw + dtr[0].otHours) - 1;
                            hoursWork = (hw + dtr[0].otHours);
                            ot = dtr[0].otHours;

                            remarks = "Overtime";
                        } else {
                            // const dateOne = "6 Apr, 2015 8:18 AM";
                            const dateTwo = moment(nxtDay).format("DD MMM, yyyy") + " " + moment(convertedTO).format("h:mm A");
                            const date1 = new Date(convertedTI).getTime();
                            const date2 = new Date(dateTwo);
                            const date3 = new Date(convertedDTO).getTime();

                            const hrswrk = Math.abs(date2 - date1);
                            const nsecOt = Math.abs(date2 - date3);

                            var hw = hrswrk / 36e5;

                            // hoursWork = hw > 5 ? hw - 1 : hw;
                            hoursWork = hw;
                            ot = nsecOt / 36e5;

                        }
                    }

                    if (remarks !== "Overtime" && new Date(convertedTO).getTime() > new Date(convertedDTO).getTime() && Object.keys(dtr).length === 0 && day !== "Sunday" || remarks !== "Overtime" && Object.keys(nxtDayOT).length > 0 && Object.keys(dtr).length === 0 && day !== "Sunday") {
                        ot = 0;
                        remarks = "OT For Approval";
                    }

                    if (remarks === "Working Rest Day" ||
                        remarks === "Working Regular Holiday" ||
                        remarks === "Working Special Holiday" ||
                        remarks === "Working Regular Holiday Rest Day" ||
                        remarks === "Working Special Holiday Rest Day" ||
                        remarks === "Offset") {

                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();

                            var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                            var mins = Math.floor(msec / 60000);

                            var hw = mins / 60;
                            // hoursWork = hw - breaktime;
                            hoursWork = hw;
                            var totalHw = hoursWork > 8 ? 8 : hoursWork;
                            var totalHwOt = hoursWork > 8.5 ? hoursWork - 8 : 0;

                            totalRestday = remarks === "Working Rest Day" ? totalRestday + totalHw : totalRestday;
                            totalRestdayOt = remarks === "Working Restday" ? totalRestdayOt + totalHwOt : totalRestdayOt;

                            totalHoliday = remarks === "Working Regular Holiday" ? totalHoliday + totalHw : totalHoliday;
                            totalHolidayOt = remarks === "Working Regular Holiday" ? totalHolidayOt + totalHwOt : totalHolidayOt;

                            totalSpecialHoliday = remarks === "Working Special Holiday" ? totalSpecialHoliday + totalHw : totalSpecialHoliday;
                            totalSpecialHolidayOt = remarks === "Working Special Holiday" ? totalSpecialHolidayOt + totalHwOt : totalSpecialHolidayOt;

                            totalHolidayRestday = remarks === "Working Regular Holiday Rest Day" ? totalHolidayRestday + totalHw : totalHolidayRestday;
                            totalHolidayRestdayOt = remarks === "Working Regular Holiday Rest Day" ? totalHolidayRestdayOt + totalHwOt : totalHolidayRestdayOt;

                            totalSpecialHolidayRestday = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestday + totalHw : totalSpecialHolidayRestday;
                            totalSpecialHolidayRestdayOt = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestdayOt + totalHwOt : totalSpecialHolidayRestdayOt;

                            ot = totalHwOt;
                            ut = 0;
                            remarks = remarks;
                        }
                    }

                    if (remarks === "SL w/ Pay" || remarks === "VL w/ Pay" || remarks === "Personal Leave" || remarks === "Emergency Leave") hoursWork = 8;
                    if (remarks === "SL w/o Pay" || remarks === "VL w/o Pay") hoursWork = 0;

                    if (remarks === "" && moment(timeIn, "h:mm").hour() + (moment(timeIn, "h:mm").minutes() / 60) > moment(depIn).hours() + (moment(depIn).add(11, 'minutes').minutes() / 60) && day !== "Sunday") {
                        remarks = "Late";
                    }

                    if (!timeIn && !timeOut) remarks = "Absent";

                    if (!timeIn && timeOut && day !== "Sunday") {
                        remarks = "Absent";
                        // hoursWork = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment("1:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (timeIn && !timeOut && day !== "Sunday") {
                        remarks = "Absent";
                        // hoursWork = moment(timeIn, "h:mm").hours() + (moment(timeIn, "h:mm").minutes() / 60) - moment("12:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (day === "Sunday" && Object.keys(dtr).length === 0) {
                        timeIn = "";
                        timeOut = "";
                        hoursWork = 0;
                        late = 0;
                        ut = 0;
                        ot = 0;
                        remarks = "Rest Day"
                    }

                    if (Object.keys(holiday).length > 0 && Object.keys(dtr).length === 0) {
                        timeIn = "";
                        timeOut = "";
                        hoursWork = 8;
                        late = 0;
                        ut = 0;
                        ot = 0;
                        remarks = holiday[0].type
                        reason = holiday[0].title;
                    }

                    totalSpecialHoliday = remarks === "Special Holiday" ? totalSpecialHoliday + 8 : totalSpecialHoliday;
                    totalHoliday = remarks === "Regular Holiday" ? totalHoliday + 8 : totalHoliday;
                    totalHolidayRestday = remarks === "Regular Holiday Rest Day" ? totalHolidayRestday + 8 : totalHolidayRestday;
                    totalSpecialHolidayRestday = remarks === "Special Holiday Rest Day" ? totalSpecialHolidayRestday + 8 : totalSpecialHolidayRestday;

                    if (timeIn && timeOut && Object.keys(dtr).length > 0 && dtr[0].remarks === "Manual Timelog") {
                        var date1 = depIn <= timeIn ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                        var date2 = depOut >= timeOut ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        // hoursWork = mins / 60;
                        hoursWork = dtr[0].hourswork,
                            ot = dtr[0].otHours,
                            ut = dtr[0].undertime,
                            timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                    }

                    if (Object.keys(rmrks).length > 0 && rmrks[0].remarks === remarks) {

                        totalDays = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" || remarks === "Rest Day" ? totalDays : totalDays + 1;
                        totalHrsWork = totalHrsWork + hoursWork;
                        totalLate = totalLate + late;
                        totalUT = totalUT + ut;
                        totalOT = remarks === "Overtime" ? totalOT + ot : totalOT;
                        totalAbsent = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" ? totalAbsent + 1 : totalAbsent;

                        var logs = {
                            "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
                            "breakOut": moment(breakOut, "h:mm A").format("h:mm A"),
                            "breakIn": breakIn === breakOut ? "" : moment(breakIn, "h:mm A").format("h:mm A"),
                            "timeOut": moment(timeOut, "h:mm A").format("h:mm A"),
                            "timeStartEnd": day !== "Sunday" ? moment(depIn, "h:mm A").format("h:mm A") + " - " + moment(depOut, "h:mm A").format("h:mm A") : "",
                            "dateTime": dateTime,
                            "day": day,
                            "hoursWork": hoursWork.toFixed(2),
                            "late": late.toFixed(2),
                            "UT": ut.toFixed(2),
                            "OT": ot.toFixed(2),
                            "remarks": remarks,
                            "reason": reason
                        }

                        timeLogs.push(logs);
                    }
                    if (Object.keys(rmrks).length === 0) {
                        totalDays = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" || remarks === "Rest Day" ? totalDays : totalDays + 1;
                        totalHrsWork = totalHrsWork + hoursWork;
                        totalLate = totalLate + late;
                        totalUT = totalUT + ut;
                        totalOT = remarks === "Overtime" ? totalOT + ot : totalOT;
                        totalAbsent = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" ? totalAbsent + 1 : totalAbsent;

                        var logs = {
                            "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
                            "breakOut": moment(breakOut, "h:mm A").format("h:mm A"),
                            "breakIn": breakIn === breakOut ? "" : moment(breakIn, "h:mm A").format("h:mm A"),
                            "timeOut": moment(timeOut, "h:mm A").format("h:mm A"),
                            "timeStartEnd": day !== "Sunday" ? moment(depIn, "h:mm A").format("h:mm A") + " - " + moment(depOut, "h:mm A").format("h:mm A") : "",
                            "dateTime": dateTime,
                            "day": day,
                            "hoursWork": hoursWork.toFixed(2),
                            "late": late.toFixed(2),
                            "UT": ut.toFixed(2),
                            "OT": ot.toFixed(2),
                            "remarks": remarks,
                            "reason": reason
                        }

                        timeLogs.push(logs);
                    }

                    theDate.setDate(theDate.getDate() + 1);
                }

                if (Object.keys(rmrks).length > 0 && totalLate > 0 || Object.keys(rmrks).length > 0 && totalOT > 0) {
                    var employeeLogs = {
                        "_id": emp[i]._id,
                        "employeeNo": emp[i].employeeNo,
                        "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                        "department": dep.department,
                        "timeLogs": timeLogs,
                        "totalDays": totalDays.toFixed(0),
                        "totalHoursWork": totalHrsWork.toFixed(2),
                        "totalRestday": totalRestday.toFixed(2),
                        "totalRestdayOt": totalRestdayOt.toFixed(2),
                        "totalHoliday": totalHoliday.toFixed(2),
                        "totalHolidayOt": totalHolidayOt.toFixed(2),
                        "totalSpecialHoliday": totalSpecialHoliday.toFixed(2),
                        "totalSpecialHolidayOt": totalSpecialHolidayOt.toFixed(2),
                        "totalHolidayRestday": totalHolidayRestday.toFixed(2),
                        "totalHolidayRestdayOt": totalHolidayRestdayOt.toFixed(2),
                        "totalSpecialHolidayRestday": totalSpecialHolidayRestday.toFixed(2),
                        "totalSpecialHolidayRestdayOt": totalSpecialHolidayRestdayOt.toFixed(2),
                        "totalLate": totalLate.toFixed(2),
                        "totalUT": totalUT.toFixed(2),
                        "totalOT": totalOT.toFixed(2),
                        "totalAbsent": totalAbsent
                    }

                    data.push(employeeLogs);
                }
                if (Object.keys(rmrks).length === 0) {
                    var employeeLogs = {
                        "_id": emp[i]._id,
                        "employeeNo": emp[i].employeeNo,
                        "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                        "department": dep.department,
                        "timeLogs": timeLogs,
                        "totalDays": totalDays.toFixed(0),
                        "totalHoursWork": totalHrsWork.toFixed(2),
                        "totalRestday": totalRestday.toFixed(2),
                        "totalRestdayOt": totalRestdayOt.toFixed(2),
                        "totalHoliday": totalHoliday.toFixed(2),
                        "totalHolidayOt": totalHolidayOt.toFixed(2),
                        "totalSpecialHoliday": totalSpecialHoliday.toFixed(2),
                        "totalSpecialHolidayOt": totalSpecialHolidayOt.toFixed(2),
                        "totalHolidayRestday": totalHolidayRestday.toFixed(2),
                        "totalHolidayRestdayOt": totalHolidayRestdayOt.toFixed(2),
                        "totalSpecialHolidayRestday": totalSpecialHolidayRestday.toFixed(2),
                        "totalSpecialHolidayRestdayOt": totalSpecialHolidayRestdayOt.toFixed(2),
                        "totalLate": totalLate.toFixed(2),
                        "totalUT": totalUT.toFixed(2),
                        "totalOT": totalOT.toFixed(2),
                        "totalAbsent": totalAbsent
                    }

                    data.push(employeeLogs);
                }
            }
            response.status(200).json(data);
        } else {
            var params = request.body;
            var fromDate = params.fromDate !== "" ? params.fromDate : moment("01/01/2020", "yyyy-MM-DD");
            var toDate = params.toDate !== "" ? params.toDate : moment().format("yyyy-MM-DD");

            //(page -1)
            var id = [];
            var dep = [];
            var rmrks = [];
            var data = request.body.selectedDetailedLogs;
            var paramDep = request.body.selectedDepartment;
            var paramRmrks = request.body.selectedRemarks;
            for (const i in data) {
                // console.log(`_id: ${request.body[i].value}`);
                id.push({ employeeNo: request.body.selectedDetailedLogs[i].value });
            }
            for (const i in paramDep) {
                // console.log(`_id: ${request.body[i].value}`);
                dep.push({ department: request.body.selectedDepartment[i].value });
            }
            for (const i in paramRmrks) {
                // console.log(`_id: ${request.body[i].value}`);
                rmrks.push({ remarks: request.body.selectedRemarks.value });
            }

            var emp = [];
            if (Object.keys(dep).length > 0) {
                emp = await employeeModel.find({
                    '$or': dep,
                    IsDeleted: false
                }).skip((page) * perPage).limit(perPage).sort('lastName');
            } else {
                emp = await employeeModel.find({
                    IsDeleted: false
                }).skip((page) * perPage).limit(perPage).sort('lastName');
            }

            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);
                var timePerDay = JSON.parse(dep.timePerDay);
                var depIn = '';
                var depOut = '';

                var totalDays = 0;
                var totalHrsWork = 0;
                var totalRestday = 0;
                var totalRestdayOt = 0;
                var totalHoliday = 0;
                var totalHolidayOt = 0;
                var totalSpecialHoliday = 0;
                var totalSpecialHolidayOt = 0;
                var totalHolidayRestday = 0;
                var totalHolidayRestdayOt = 0;
                var totalSpecialHolidayRestday = 0;
                var totalSpecialHolidayRestdayOt = 0;
                var totalLate = 0;
                var totalUT = 0;
                var totalOT = 0;
                var totalAbsent = 0;

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var day = moment(theDate).format("dddd");

                    const holiday = await holidaySchedule.find({
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    });

                    for (const j in timePerDay) {
                        if (day === timePerDay[j].day) {
                            depIn = timePerDay[j].timeStart;
                            depOut = timePerDay[j].timeEnd;
                        }
                    }

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: -1 });

                    var timeIn = "";
                    var timeOut = "";
                    var breakOut = "";
                    var breakIn = "";

                    var dt = dateTime;
                    var nxtDay = moment(theDate, "yyyy-MM-DD").add(1, 'd');
                    var nxtDayOT = [];

                    var reason = "";
                    var breakTime = 0;

                    if (Object.keys(dtr).length > 0) {
                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(05, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        var breakTimeOut;
                        var breakTimeIn;
                        if (day !== "Saturday") {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 00, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 01, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: -1 });
                        } else {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 00, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 01, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: -1 });
                        }

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dt).setHours(00, 00, 00), $lte: new Date(dt).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });
                        nxtDayOT = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(nxtDay).setHours(00, 00, 00), $lte: new Date(nxtDay).setHours(04, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: -1 });

                        if (dtr[0].remarks === "Overtime") {
                            timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                            if (Object.keys(nxtDayOT).length === 0) {
                                timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                            } else {
                                timeOut = Object.keys(nxtDayOT).length !== 0 ? moment(nxtDayOT[0].dateTime).format("h:mm A") : "";
                            }
                            breakOut = Object.keys(breakTimeOut).length !== 0 ? moment(breakTimeOut[0].dateTime).format("h:mm A") : "";
                            breakIn = Object.keys(breakTimeIn).length !== 0 ? moment(breakTimeIn[0].dateTime).format("h:mm A") : "";
                        } else {
                            timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                            timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                            breakOut = Object.keys(breakTimeOut).length !== 0 ? moment(breakTimeOut[0].dateTime).format("h:mm A") : "";
                            breakIn = Object.keys(breakTimeIn).length !== 0 ? moment(breakTimeIn[0].dateTime).format("h:mm A") : "";
                        }

                        reason = Object.keys(dtr).length !== 0 ? dtr[0].reason : "";
                        breaktime = Object.keys(dtr).length !== 0 && dtr[0].breakTime === true ? 0 : 0;
                    } else {
                        // var dt = dateTime;
                        if (dep.dayNightShift === false) {
                            var date = new Date();
                            date.setDate(theDate.getDate() + 1);
                            dt = moment(date, "MM-DD-yyyy");
                        }

                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(05, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dt).setHours(00, 00, 00), $lte: new Date(dt).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        var breakTimeOut;
                        var breakTimeIn;
                        if (day !== "Saturday") {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 00, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(12, 01, 00), $lte: new Date(dt).setHours(13, 15, 59) },
                                timeInOut: "E"
                            }).sort({ dateTime: -1 });
                        } else {
                            breakTimeOut = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 00, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: 1 });

                            breakTimeIn = await timeLogsModel.find({
                                employeeNo: emp[i].employeeNo,
                                dateTime: { $gte: new Date(dt).setHours(10, 01, 00), $lte: new Date(dt).setHours(11, 15, 59) },
                                timeInOut: "S"
                            }).sort({ dateTime: -1 });
                        }

                        nxtDayOT = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(nxtDay).setHours(00, 00, 00), $lte: new Date(nxtDay).setHours(04, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                        if (Object.keys(nxtDayOT).length === 0) {
                            timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                        } else {
                            timeOut = Object.keys(nxtDayOT).length !== 0 ? moment(nxtDayOT[0].dateTime).format("h:mm A") : "";
                        }
                        breakOut = Object.keys(breakTimeOut).length !== 0 ? moment(breakTimeOut[0].dateTime).format("h:mm A") : "";
                        breakIn = Object.keys(breakTimeIn).length !== 0 ? moment(breakTimeIn[0].dateTime).format("h:mm A") : "";
                    }

                    var convertedDate = moment(dateTime, "MM/DD/yyyy").format("MM/DD/yyyy");

                    // var convertedDI = moment(depIn, "h:mm").hours() + ":" + moment(depIn, "h:mm").minutes();
                    // var convertedDO = moment(depOut, "h:mm").hours() + ":" + moment(depOut, "h:mm").minutes();

                    // var ts = dep.dayNightShift === true ? "AM" : "PM";
                    // var te = dep.dayNightShift === true ? "PM" : "AM";

                    var todt = moment(dt).format("MM/DD/yyyy");
                    var convertedTI = moment(convertedDate + " " + timeIn).format();
                    var convertedTO = moment(todt + " " + timeOut).format();

                    var convertedDTI = moment(convertedDate + " " + depIn).format();
                    var convertedLateDTI = moment(convertedDate + " " + depIn).add(15, 'minutes').format();
                    var convertedDTO = moment(todt + " " + depOut).format();

                    var remarks = "";

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedLateDTI).getTime() && day !== "Sunday") {
                        var date1 = new Date(convertedDTI).getTime();

                        var date2 = new Date(convertedTI).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);

                        late = mins / 60;
                    }

                    var ut = 0;
                    if (new Date(convertedTO).getTime() < new Date(convertedDTO).getTime() && timeOut !== "" && day !== "Sunday" && Object.keys(nxtDayOT).length === 0) {
                        var date1 = new Date(convertedTO).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        ut = mins / 60;
                        remarks = "Undertime";
                    }

                    var ot = 0;
                    if (moment(timeOut, "h:mm").hours() > moment(depOut).hours() && Object.keys(nxtDayOT).length === 0)
                        ot = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment(depOut, "h:mm").hours();

                    var hoursWork = 0;
                    if (timeIn && timeOut && day !== "Sunday") {
                        var date1 = new Date(convertedLateDTI) >= new Date(convertedTI) ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                        var date2 = new Date(convertedDTO) <= new Date(convertedTO) ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);
                        // var hrs = Math.floor(mins / 60);

                        // var sync = moment((hrs % 24) + ":" + mins, "h:mm");
                        var hw = Math.floor(mins / 60);
                        // hoursWork = hw > 5 ? hw - 1 : hw;
                        hoursWork = hw;
                    }

                    if (timeIn && timeOut && day === "Sunday") {
                        var date1 = new Date(convertedTI).getTime();
                        var date2 = new Date(convertedTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        hoursWork = mins / 60;
                    }

                    remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : remarks;
                    if (remarks === "Overtime" && day !== "Sunday") {
                        if (timeIn && timeOut && Object.keys(nxtDayOT).length === 0) {
                            var date1 = depIn <= timeIn ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                            var date2 = depOut >= timeOut ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();
                            var date3 = new Date(convertedDTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            var msecOT = date2 - date3;
                            // var otMins = Math.floor(msecOT / 60000);

                            var hw = mins / 60;
                            // hoursWork = hw > 5 ? hw - 1 : hw;
                            // ot = otMins / 60;

                            // hoursWork = (hw + dtr[0].otHours) - 1;
                            hoursWork = (hw + dtr[0].otHours);
                            ot = dtr[0].otHours;

                            remarks = "Overtime";
                        } else {
                            // const dateOne = "6 Apr, 2015 8:18 AM";
                            const dateTwo = moment(nxtDay).format("DD MMM, yyyy") + " " + moment(convertedTO).format("h:mm A");
                            const date1 = new Date(convertedTI).getTime();
                            const date2 = new Date(dateTwo);
                            const date3 = new Date(convertedDTO).getTime();

                            const hrswrk = Math.abs(date2 - date1);
                            const nsecOt = Math.abs(date2 - date3);

                            var hw = hrswrk / 36e5;

                            // hoursWork = hw > 5 ? hw - 1 : hw;
                            hoursWork = hw;
                            ot = nsecOt / 36e5;

                        }
                    }

                    if (remarks !== "Overtime" && new Date(convertedTO).getTime() > new Date(convertedDTO).getTime() && Object.keys(dtr).length === 0 && day !== "Sunday" || remarks !== "Overtime" && Object.keys(nxtDayOT).length > 0 && Object.keys(dtr).length === 0 && day !== "Sunday") {
                        ot = 0;
                        remarks = "OT For Approval";
                    }

                    if (remarks === "Working Rest Day" ||
                        remarks === "Working Regular Holiday" ||
                        remarks === "Working Special Holiday" ||
                        remarks === "Working Regular Holiday Rest Day" ||
                        remarks === "Working Special Holiday Rest Day" ||
                        remarks === "Offset") {

                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();

                            var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                            var mins = Math.floor(msec / 60000);

                            var hw = mins / 60;
                            // hoursWork = hw - breaktime;
                            hoursWork = hw;
                            var totalHw = hoursWork > 8 ? 8 : hoursWork;
                            var totalHwOt = hoursWork > 8.5 ? hoursWork - 8 : 0;

                            totalRestday = remarks === "Working Restday" ? totalRestday + totalHw : totalRestday;
                            totalRestdayOt = remarks === "Working Restday" ? totalRestdayOt + totalHwOt : totalRestdayOt;

                            totalHoliday = remarks === "Working Regular Holiday" ? totalHoliday + totalHw : totalHoliday;
                            totalHolidayOt = remarks === "Working Regular Holiday" ? totalHolidayOt + totalHwOt : totalHolidayOt;

                            totalSpecialHoliday = remarks === "Working Special Holiday" ? totalSpecialHoliday + totalHw : totalSpecialHoliday;
                            totalSpecialHolidayOt = remarks === "Working Special Holiday" ? totalSpecialHolidayOt + totalHwOt : totalSpecialHolidayOt;

                            totalHolidayRestday = remarks === "Working Regular Holiday Rest Day" ? totalHolidayRestday + totalHw : totalHolidayRestday;
                            totalHolidayRestdayOt = remarks === "Working Regular Holiday Rest Day" ? totalHolidayRestdayOt + totalHwOt : totalHolidayRestdayOt;

                            totalSpecialHolidayRestday = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestday + totalHw : totalSpecialHolidayRestday;
                            totalSpecialHolidayRestdayOt = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestdayOt + totalHwOt : totalSpecialHolidayRestdayOt;

                            ot = totalHwOt;
                            ut = 0;
                            remarks = remarks;
                        }
                    }

                    if (remarks === "SL w/ Pay" || remarks === "VL w/ Pay" || remarks === "Personal Leave" || remarks === "Emergency Leave") hoursWork = 8;
                    if (remarks === "SL w/o Pay" || remarks === "VL w/o Pay") hoursWork = 0;

                    if (remarks === "" && moment(timeIn, "h:mm").hour() + (moment(timeIn, "h:mm").minutes() / 60) > moment(depIn).hours() + (moment(depIn).add(15, 'minutes').minutes() / 60) && day !== "Sunday") {
                        remarks = "Late";
                    }

                    if (!timeIn && !timeOut) remarks = "Absent";

                    if (!timeIn && timeOut && day !== "Sunday") {
                        remarks = "Absent";
                        // hoursWork = moment(timeOut, "h:mm").hours() + (moment(timeOut, "h:mm").minutes() / 60) - moment("1:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (timeIn && !timeOut && day !== "Sunday") {
                        remarks = "Absent";
                        // hoursWork = moment(timeIn, "h:mm").hours() + (moment(timeIn, "h:mm").minutes() / 60) - moment("12:00", "h:mm").hours() + moment(timeIn, "h:mm").hours();
                    }

                    if (day === "Sunday" && Object.keys(dtr).length === 0) {
                        timeIn = "";
                        timeOut = "";
                        hoursWork = 0;
                        late = 0;
                        ut = 0;
                        ot = 0;
                        remarks = "Rest Day"
                    }

                    if (Object.keys(holiday).length > 0 && Object.keys(dtr).length === 0) {
                        timeIn = "";
                        timeOut = "";
                        hoursWork = 8;
                        late = 0;
                        ut = 0;
                        ot = 0;
                        remarks = holiday[0].type
                        reason = holiday[0].title;
                    }

                    totalSpecialHoliday = remarks === "Special Holiday" ? totalSpecialHoliday + 8 : totalSpecialHoliday;
                    totalHoliday = remarks === "Regular Holiday" ? totalHoliday + 8 : totalHoliday;
                    totalHolidayRestday = remarks === "Regular Holiday Rest Day" ? totalHolidayRestday + 8 : totalHolidayRestday;
                    totalSpecialHolidayRestday = remarks === "Special Holiday Rest Day" ? totalSpecialHolidayRestday + 8 : totalSpecialHolidayRestday;

                    if (timeIn && timeOut && Object.keys(dtr).length > 0 && dtr[0].remarks === "Manual Timelog") {
                        var date1 = depIn <= timeIn ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                        var date2 = depOut >= timeOut ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        // hoursWork = mins / 60;
                        hoursWork = dtr[0].hourswork,
                            ot = dtr[0].otHours,
                            ut = dtr[0].undertime,
                            timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                    }

                    if (Object.keys(rmrks).length > 0 && rmrks[0].remarks === remarks) {

                        totalDays = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" || remarks === "Rest Day" ? totalDays : totalDays + 1;
                        totalHrsWork = totalHrsWork + hoursWork;
                        totalLate = totalLate + late;
                        totalUT = totalUT + ut;
                        totalOT = remarks === "Overtime" ? totalOT + ot : totalOT;
                        totalAbsent = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" ? totalAbsent + 1 : totalAbsent;

                        var logs = {
                            "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
                            "breakOut": moment(breakOut, "h:mm A").format("h:mm A"),
                            "breakIn": breakIn === breakOut ? "" : moment(breakIn, "h:mm A").format("h:mm A"),
                            "timeOut": moment(timeOut, "h:mm A").format("h:mm A"),
                            "timeStartEnd": day !== "Sunday" ? moment(depIn, "h:mm A").format("h:mm A") + " - " + moment(depOut, "h:mm A").format("h:mm A") : "",
                            "dateTime": dateTime,
                            "day": day,
                            "hoursWork": hoursWork.toFixed(2),
                            "late": late.toFixed(2),
                            "UT": ut.toFixed(2),
                            "OT": ot.toFixed(2),
                            "remarks": remarks,
                            "reason": reason
                        }

                        timeLogs.push(logs);
                    }
                    if (Object.keys(rmrks).length === 0) {
                        totalDays = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" || remarks === "Rest Day" ? totalDays : totalDays + 1;
                        totalHrsWork = totalHrsWork + hoursWork;
                        totalLate = totalLate + late;
                        totalUT = totalUT + ut;
                        totalOT = remarks === "Overtime" ? totalOT + ot : totalOT;
                        totalAbsent = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" ? totalAbsent + 1 : totalAbsent;

                        var logs = {
                            "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
                            "breakOut": moment(breakOut, "h:mm A").format("h:mm A"),
                            "breakIn": breakIn === breakOut ? "" : moment(breakIn, "h:mm A").format("h:mm A"),
                            "timeOut": moment(timeOut, "h:mm A").format("h:mm A"),
                            "timeStartEnd": day !== "Sunday" ? moment(depIn, "h:mm A").format("h:mm A") + " - " + moment(depOut, "h:mm A").format("h:mm A") : "",
                            "dateTime": dateTime,
                            "day": day,
                            "hoursWork": hoursWork.toFixed(2),
                            "late": late.toFixed(2),
                            "UT": ut.toFixed(2),
                            "OT": ot.toFixed(2),
                            "remarks": remarks,
                            "reason": reason
                        }

                        timeLogs.push(logs);
                    }

                    theDate.setDate(theDate.getDate() + 1);
                }

                if (Object.keys(rmrks).length > 0 && totalLate > 0 || Object.keys(rmrks).length > 0 && totalOT > 0) {
                    var employeeLogs = {
                        "_id": emp[i]._id,
                        "employeeNo": emp[i].employeeNo,
                        "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                        "department": dep.department,
                        "timeLogs": timeLogs,
                        "totalDays": totalDays.toFixed(0),
                        "totalHoursWork": totalHrsWork.toFixed(2),
                        "totalRestday": totalRestday.toFixed(2),
                        "totalRestdayOt": totalRestdayOt.toFixed(2),
                        "totalHoliday": totalHoliday.toFixed(2),
                        "totalHolidayOt": totalHolidayOt.toFixed(2),
                        "totalSpecialHoliday": totalSpecialHoliday.toFixed(2),
                        "totalSpecialHolidayOt": totalSpecialHolidayOt.toFixed(2),
                        "totalHolidayRestday": totalHolidayRestday.toFixed(2),
                        "totalHolidayRestdayOt": totalHolidayRestdayOt.toFixed(2),
                        "totalSpecialHolidayRestday": totalSpecialHolidayRestday.toFixed(2),
                        "totalSpecialHolidayRestdayOt": totalSpecialHolidayRestdayOt.toFixed(2),
                        "totalLate": totalLate.toFixed(2),
                        "totalUT": totalUT.toFixed(2),
                        "totalOT": totalOT.toFixed(2),
                        "totalAbsent": totalAbsent
                    }

                    data.push(employeeLogs);
                }
                if (Object.keys(rmrks).length === 0) {
                    var employeeLogs = {
                        "_id": emp[i]._id,
                        "employeeNo": emp[i].employeeNo,
                        "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                        "department": dep.department,
                        "timeLogs": timeLogs,
                        "totalDays": totalDays.toFixed(0),
                        "totalHoursWork": totalHrsWork.toFixed(2),
                        "totalRestday": totalRestday.toFixed(2),
                        "totalRestdayOt": totalRestdayOt.toFixed(2),
                        "totalHoliday": totalHoliday.toFixed(2),
                        "totalHolidayOt": totalHolidayOt.toFixed(2),
                        "totalSpecialHoliday": totalSpecialHoliday.toFixed(2),
                        "totalSpecialHolidayOt": totalSpecialHolidayOt.toFixed(2),
                        "totalHolidayRestday": totalHolidayRestday.toFixed(2),
                        "totalHolidayRestdayOt": totalHolidayRestdayOt.toFixed(2),
                        "totalSpecialHolidayRestday": totalSpecialHolidayRestday.toFixed(2),
                        "totalSpecialHolidayRestdayOt": totalSpecialHolidayRestdayOt.toFixed(2),
                        "totalLate": totalLate.toFixed(2),
                        "totalUT": totalUT.toFixed(2),
                        "totalOT": totalOT.toFixed(2),
                        "totalAbsent": totalAbsent
                    }

                    data.push(employeeLogs);
                }
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
        var page = request.body.page !== "" ? request.body.page : 0;
        var perPage = 5;
        if (Object.keys(request.body.selectedDtrcLogs).length > 0) {
            var params = request.body;
            var fromDate = params.fromDate !== "" ? params.fromDate : moment("01/01/2020", "yyyy-MM-DD");
            var toDate = params.toDate !== "" ? params.toDate : moment().format("yyyy-MM-DD");

            var id = [];
            var dep = [];
            var data = request.body.selectedDtrcLogs;
            var paramDep = request.body.selectedDepartment;
            for (const i in data) {
                id.push({ employeeNo: data[i].value });
            }
            for (const i in paramDep) {
                // console.log(`_id: ${request.body[i].value}`);
                dep.push({ department: request.body.selectedDepartment[i].value });
            }
            var emp = [];
            if (Object.keys(dep).length > 0) {
                emp = await employeeModel.find({
                    '$or': id,
                    '$and': [
                        { '$or': dep }
                    ],
                    IsDeleted: false
                }).sort('lastName');
            } else {
                emp = await employeeModel.find({
                    '$or': id,
                    IsDeleted: false
                }).sort('lastName');
            }

            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var nxtDay = moment(theDate, "yyyy-MM-DD").add(1, 'd');
                    var day = moment(theDate).format("dddd");

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: -1 });

                    var timeIn = "";
                    var timeOut = "";
                    var remarks = "";
                    var reason = "";

                    if (Object.keys(dtr).length > 0) {
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "hh:mm A").format("hh:mm A") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "hh:mm A").format("hh:mm A") : "";
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

                        const nxtDayOT = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(nxtDay).setHours(00, 00, 00), $lte: new Date(nxtDay).setHours(04, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                        if (Object.keys(nxtDayOT).length === 0) {
                            timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                        } else {
                            timeOut = Object.keys(nxtDayOT).length !== 0 ? moment(nxtDayOT[0].dateTime).format("h:mm A") : "";
                        }

                        // timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("hh:mm A") : "";
                        // timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("hh:mm A") : "";
                        remarks = "";
                        reason = "";

                        if (day === "Sunday") {
                            remarks = "Rest Day";
                        }
                    }

                    var logs = {
                        "empId": emp[i]._id,
                        "empNo": emp[i].employeeNo,
                        "empName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                        "department": emp[i].department,
                        "day": day,
                        "date": dateTime,
                        "timeIn": timeIn !== "" ? moment(timeIn, "h:mm A").format("h:mm A") : "",
                        "timeOut": timeOut !== "" ? moment(timeOut, "h:mm A").format("h:mm A") : "",
                        "remarks": remarks,
                        "reason": reason
                    }

                    timeLogs.push(logs);

                    theDate.setDate(theDate.getDate() + 1);
                }

                var employeeLogs = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
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

            var id = [];
            var paramDep = request.body.selectedDepartment;
            for (const i in paramDep) {
                id.push({ department: request.body.selectedDepartment[i].value });
            }

            var emp = [];
            if (Object.keys(request.body.selectedDepartment).length > 0) {
                emp = await employeeModel.find({
                    '$or': id,
                    IsDeleted: false
                }).skip((page) * perPage).limit(perPage).sort('lastName');
            } else {
                emp = await employeeModel.find({
                    IsDeleted: false
                }).skip((page) * perPage).limit(perPage).sort('lastName');
            };

            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);

                var timeLogs = [];
                const theDate = new Date(fromDate);
                while (theDate <= new Date(toDate)) {
                    var dateTime = moment(theDate, "yyyy-MM-DD");
                    var nxtDay = moment(theDate, "yyyy-MM-DD").add(1, 'd');
                    var day = moment(theDate).format("dddd");

                    const dtr = await dtrcModel.find({
                        employeeNo: emp[i].employeeNo,
                        date: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) }
                    }).sort({ dateApproved: -1 });

                    var timeIn = "";
                    var timeOut = "";
                    var remarks = "";
                    var reason = "";

                    if (Object.keys(dtr).length > 0) {
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "hh:mm A").format("hh:mm A") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "hh:mm A").format("hh:mm A") : "";
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

                        const nxtDayOT = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(nxtDay).setHours(00, 00, 00), $lte: new Date(nxtDay).setHours(04, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                        if (Object.keys(nxtDayOT).length === 0) {
                            timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                        } else {
                            timeOut = Object.keys(nxtDayOT).length !== 0 ? moment(nxtDayOT[0].dateTime).format("h:mm A") : "";
                        }

                        // timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("hh:mm A") : "";
                        // timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("hh:mm A") : "";
                        remarks = "";
                        reason = "";

                        if (day === "Sunday") {
                            remarks = "Rest Day";
                        }
                    }

                    var logs = {
                        "empId": emp[i]._id,
                        "empNo": emp[i].employeeNo,
                        "empName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                        "department": emp[i].department,
                        "day": day,
                        "date": dateTime,
                        "timeIn": timeIn !== "" ? moment(timeIn, "h:mm A").format("h:mm A") : "",
                        "timeOut": timeOut !== "" ? moment(timeOut, "h:mm A").format("h:mm A") : "",
                        "remarks": remarks,
                        "reason": reason
                    }

                    timeLogs.push(logs);

                    theDate.setDate(theDate.getDate() + 1);
                }

                var employeeLogs = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
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

        if (data.timeIn === "" && data.remarks !== "Sick Leave" && data.remarks !== "Vacation Leave" && data.remarks !== "Offset")
            errors.push({ error: "Time In cannot be empty." });

        if (data.timeOut === "" && data.remarks !== "Sick Leave" && data.remarks !== "Vacation Leave" && data.remarks !== "Offset")
            errors.push({ error: "Time Out cannot be empty." });

        if (data.remarks === "Overtime" && moment(data.timeOut, "h:mm").hours() + (moment(data.timeOut, "h:mm").minutes() / 60) <= moment(dept.timeEnd, "h:mm").hours())
            errors.push({ error: "Can't approved OT with timeout is less than or equal to end time." });

        if (data.remarks === "VL w/ Pay" || data.remarks === "VL w/o Pay" || data.remarks === "SL w/ Pay" || data.remarks === "SL w/o Pay" || data.remarks === "Offset") {
            for (const i in timePerDay) {
                if (day === timePerDay[i].day) {
                    // timeIn = timePerDay[i].timeStart;
                    // timeOut = timePerDay[i].timeEnd;
                    timeIn = "";
                    timeOut = "";
                }
            }
        }

        if (Object.keys(errors).length === 0) {

            const dtrCorrection = new dtrcModel({
                employeeNo: data.employeeNo,
                date: date,
                timeIn: timeIn,
                timeOut: timeOut,
                otHours: data.otHours,
                breakTimeHrs: data.breakTimeHrs,
                hourswork: data.hourswork,
                undertime: data.undertime,
                employeeName: data.employeeName,
                remarks: data.remarks,
                reason: data.reason,
                dateApproved: dateApproved
            });

            const dtrc = await dtrCorrection.save();

            response.status(200).json({ dtrc: dtrc.employeeName + " Record successfully filed." });
        } else {
            response.status(400).json({ error: errors });
        }
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});

module.exports = router;