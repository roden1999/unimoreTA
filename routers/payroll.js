const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const salaryModel = require("../models/salary");
const timeLogsModel = require("../models/timelogs");
const employeeModel = require("../models/employees");
const departmentModel = require("../models/department");
const dtrcModel = require("../models/dtrcorrection");
const fs = require('fs');
const { salaryValidation } = require("../utils/validation");
const moment = require('moment');

//List of Payroll
router.post("/payroll-list", async (request, response) => {
    try {
        var page = request.body.page !== "" ? request.body.page : 0;
        var perPage = 5;
        if (Object.keys(request.body.selectedEmployee).length > 0) {
            var params = request.body;
            var fromDate = params.fromDate !== "" ? params.fromDate : moment("01/01/2020", "yyyy-MM-DD");
            var toDate = params.toDate !== "" ? params.toDate : moment().format("yyyy-MM-DD");

            var id = [];
            var data = request.body.selectedEmployee;
            for (const i in data) {
                id.push({ _id: data[i].value });
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
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                    } else {
                        var dt = dateTime;
                        if (dep.dayNightShift === false) {
                            var date = new Date();
                            date.setDate(theDate.getDate() + 1);
                            dt = moment(date, "MM-DD-yyyy");
                        }

                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dt).setHours(00, 00, 00), $lte: new Date(dt).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                        timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                    }

                    var convertedDate = moment(dateTime, "MM/DD/yyyy").format("MM/DD/yyyy");

                    // var convertedDI = moment(depIn, "h:mm").hours() + ":" + moment(depIn, "h:mm").minutes();
                    // var convertedDO = moment(depOut, "h:mm").hours() + ":" + moment(depOut, "h:mm").minutes();

                    // var ts = dep.dayNightShift === true ? "AM" : "PM";
                    // var te = dep.dayNightShift === true ? "PM" : "AM";

                    var todt = moment(dt).format("MM/DD/yyyy")
                    var convertedTI = moment(convertedDate + " " + timeIn).format();
                    var convertedTO = moment(todt + " " + timeOut).format();

                    var convertedDTI = moment(convertedDate + " " + depIn).format();
                    var convertedDTO = moment(todt + " " + depOut).format();

                    var remarks = "";

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedDTI).getTime()) {
                        var date1 = new Date(convertedDTI).getTime();

                        var date2 = new Date(convertedTI).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);

                        late = mins / 60;
                    }

                    var ut = 0;
                    if (new Date(convertedTO).getTime() < new Date(convertedDTO).getTime()) {
                        var date1 = new Date(convertedTO).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        ut = mins / 60;
                        remarks = "Undertime";
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

                    remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : remarks;
                    if (remarks === "Overtime") {
                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();
                            var date3 = new Date(convertedDTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            var msecOT = date2 - date3;
                            var otMins = Math.floor(msecOT / 60000);

                            hoursWork = mins / 60;
                            ot = otMins / 60;

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
                        "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
                        "timeOut": moment(timeOut, "h:mm A").format("h:mm A"),
                        "timeStartEnd": moment(depIn, "h:mm A").format("h:mm A") + " - " + moment(depOut, "h:mm A").format("h:mm A"),
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
                        timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                        timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                    } else {
                        var dt = dateTime;
                        if (dep.dayNightShift === false) {
                            var date = new Date();
                            date.setDate(theDate.getDate() + 1);
                            dt = moment(date, "MM-DD-yyyy");
                        }

                        const dateTimeIn = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dateTime).setHours(00, 00, 00), $lte: new Date(dateTime).setHours(23, 59, 59) },
                            timeInOut: "S"
                        }).sort({ dateTime: 1 });

                        const dateTimeOut = await timeLogsModel.find({
                            employeeNo: emp[i].employeeNo,
                            dateTime: { $gte: new Date(dt).setHours(00, 00, 00), $lte: new Date(dt).setHours(23, 59, 59) },
                            timeInOut: "E"
                        }).sort({ dateTime: -1 });

                        timeIn = Object.keys(dateTimeIn).length !== 0 ? moment(dateTimeIn[0].dateTime).format("h:mm A") : "";
                        timeOut = Object.keys(dateTimeOut).length !== 0 ? moment(dateTimeOut[0].dateTime).format("h:mm A") : "";
                    }

                    var convertedDate = moment(dateTime, "MM/DD/yyyy").format("MM/DD/yyyy");

                    // var convertedDI = moment(depIn, "h:mm").hours() + ":" + moment(depIn, "h:mm").minutes();
                    // var convertedDO = moment(depOut, "h:mm").hours() + ":" + moment(depOut, "h:mm").minutes();

                    // var ts = dep.dayNightShift === true ? "AM" : "PM";
                    // var te = dep.dayNightShift === true ? "PM" : "AM";

                    var todt = moment(dt).format("MM/DD/yyyy")
                    var convertedTI = moment(convertedDate + " " + timeIn).format();
                    var convertedTO = moment(todt + " " + timeOut).format();

                    var convertedDTI = moment(convertedDate + " " + depIn).format();
                    var convertedDTO = moment(todt + " " + depOut).format();

                    var remarks = "";

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedDTI).getTime()) {
                        var date1 = new Date(convertedDTI).getTime();

                        var date2 = new Date(convertedTI).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);

                        late = mins / 60;
                    }

                    var ut = 0;
                    if (new Date(convertedTO).getTime() < new Date(convertedDTO).getTime() && timeOut !== "") {
                        var date1 = new Date(convertedTO).getTime();
                        var date2 = new Date(convertedDTO).getTime();

                        var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                        var mins = Math.floor(msec / 60000);

                        ut = mins / 60;
                        remarks = "Undertime";
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

                    remarks = Object.keys(dtr).length !== 0 ? dtr[0].remarks : remarks;
                    if (remarks === "Overtime") {
                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();
                            var date3 = new Date(convertedDTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            var msecOT = date2 - date3;
                            var otMins = Math.floor(msecOT / 60000);

                            hoursWork = mins / 60;
                            ot = otMins / 60;

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
                        timeIn = !timeIn ? "" : timeIn;
                        timeOut = !timeOut ? "" : timeOut;
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
                        "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
                        "timeOut": moment(timeOut, "h:mm A").format("h:mm A"),
                        "timeStartEnd": moment(depIn, "h:mm A").format("h:mm A") + " - " + moment(depOut, "h:mm A").format("h:mm A"),
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

                const salary = await salaryModel.findOne({
                    employeeId: emp[i]._id,
                });

                var totalMonthly = !salary ? 0 : salary.salary;
                var basicMetalAsia = totalMonthly >= 373 * 26 ? 373 * 26 : totalMonthly;
                var allowanceMetalAsia = totalMonthly > basicMetalAsia ? totalMonthly - basicMetalAsia - 0 : 0;
                var dailyRate = (basicMetalAsia + allowanceMetalAsia) / 26;                

                var basic = params.type === "Full Month" ? basicMetalAsia : basicMetalAsia / 2;
                var allowance = params.type === "Full Month" ? allowanceMetalAsia : allowanceMetalAsia / 2;

                var absensesTardiness = (basic + allowance) / 13 * totalAbsent;
                var netOfTardiness = (basic + allowance) - absensesTardiness;
                var tmonthPayMetalAsia = ((basic + allowance - absensesTardiness) / 12);

                var amountOt = ((((basicMetalAsia / 13 / 8) * totalOT) * 1.25 / 2) + (allowanceMetalAsia / 13 / 8) * totalOT / 2);

                var tmonthPay = ((basic + allowance - absensesTardiness) / 12);

                //Deduction
                var sss = !salary || params.type === "1st Half" ? 0 : salary.sss;
                var phic = !salary || params.type === "1st Half" ? 0 : salary.phic;
                var hdmf = !salary || params.type === "1st Half" ? 0 : salary.hdmf;
                var sssLoan = !salary || params.type === "2nd Half" ? 0 : salary.sssLoan;
                var pagibigLoan = !salary || params.type === "2nd Half" ? 0 : salary.pagibigLoan;
                var careHealthPlus = !salary || params.type === "2nd Half" ? 0 : salary.careHealthPlus;

                var totalDeduction = sss + phic + hdmf + sssLoan + pagibigLoan + careHealthPlus;
                var totalEarnings = (basic + allowance + amountOt + tmonthPay) - absensesTardiness;


                var deductions = {                    
                    "sss": sss.toFixed(2),
                    "phic": phic.toFixed(2),
                    "hdmf": hdmf.toFixed(2),
                    "sssLoan": sssLoan.toFixed(2),
                    "pagibigLoan": pagibigLoan.toFixed(2),
                    "careHealthPlus": careHealthPlus.toFixed(2)
                }

                var earnings = {
                    "basic": basic.toFixed(2),
                    "absensesTardiness": absensesTardiness.toFixed(2),
                    "allowance": allowance.toFixed(2),
                    "overtime": amountOt.toFixed(2),
                    "restday": 0,
                    "restdayOT": 0,
                    "tMonthPay": tmonthPay.toFixed(2),
                }

                var employeeLogs = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].firstName + " " + emp[i].middleName + " " + emp[i].lastName,
                    "department": dep.department,
                    "salary": totalMonthly.toFixed(2),
                    "basicMetalAsia": basicMetalAsia.toFixed(2),
                    "allowanceMetalAsia": allowanceMetalAsia.toFixed(2),
                    "dailyRate": dailyRate.toFixed(2),

                    "deductions": [deductions],
                    "earnings": [earnings],
                    "totalHoursWork": totalHrsWork.toFixed(2),
                    "totalEarnings": totalEarnings.toFixed(2),
                    "totalDeduction": totalDeduction.toFixed(2),

                    "netOfTardiness": netOfTardiness.toFixed(2),
                    "grossSalary": (netOfTardiness + amountOt).toFixed(2),
                    "totalAbsensesTardiness": totalAbsent,
                    "totalUT": totalUT.toFixed(2),
                    "totalOT": totalOT.toFixed(2),

                    "tMonthPayMetalAsia": tmonthPayMetalAsia.toFixed(2),
                    "netPayMetalAsia": (totalEarnings - totalDeduction).toFixed(2),
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