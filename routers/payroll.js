const router = require("express").Router();
const bcrypt = require("bcryptjs");
const verify = require("../utils/verifyToken");
const salaryModel = require("../models/salary");
const timeLogsModel = require("../models/timelogs");
const employeeModel = require("../models/employees");
const departmentModel = require("../models/department");
const dtrcModel = require("../models/dtrcorrection");
const holidaySchedule = require("../models/holidaySchedule");
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
            var dep = [];
            var data = request.body.selectedEmployee;
            var paramDep = request.body.selectedDepartment;
            for (const i in data) {
                id.push({ _id: data[i].value });
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
                var timePerDay = JSON.parse(dep.timePerDay);
                var depIn = '';
                var depOut = '';

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
                    }).sort({ dateApproved: 1 });

                    var timeIn = "";
                    var timeOut = "";

                    var dt = dateTime;
                    var nxtDay = moment(theDate, "yyyy-MM-DD").add(1, 'd');
                    var nxtDayOT = [];

                    var reason = "";

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
                        } else {
                            timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                            timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                        }

                        reason = Object.keys(dtr).length !== 0 ? dtr[0].reason : "";
                        breaktime = Object.keys(dtr).length !== 0 && dtr[0].breakTime === true ? 0 : 1;
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
                    var convertedDTO = moment(todt + " " + depOut).format();

                    var remarks = "";

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedDTI).getTime() && day !== "Sunday") {
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
                        var date1 = depIn <= timeIn ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                        var date2 = depOut >= timeOut ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);
                        // var hrs = Math.floor(mins / 60);

                        // var sync = moment((hrs % 24) + ":" + mins, "h:mm");
                        var hw = mins / 60;
                        hoursWork = hw > 5 ? hw - 1 : hw;
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
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();
                            var date3 = new Date(convertedDTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            var msecOT = date2 - date3;
                            var otMins = Math.floor(msecOT / 60000);

                            var hw = mins / 60;
                            hoursWork = hw > 5 ? hw - 1 : hw;
                            ot = otMins / 60;

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

                            hoursWork = hw > 5 ? hw - 1 : hw;
                            ot = nsecOt / 36e5;

                        }
                    }

                    if (remarks !== "Overtime" && new Date(convertedTO).getTime() > new Date(convertedDTO).getTime() && Object.keys(dtr).length === 0 && day !== "Sunday" || remarks !== "Overtime" && Object.keys(nxtDayOT).length > 0 && Object.keys(dtr).length === 0 && day !== "Sunday") {
                        ot = 0;
                        remarks = "OT For Approval";
                    }

                    if (remarks === "Working Rest Day" ||
                        remarks === "Working Holiday" ||
                        remarks === "Working Special Holiday" ||
                        remarks === "Working Holiday Rest Day" ||
                        remarks === "Working Special Holiday Rest Day" ||
                        remarks === "Offset") {

                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();

                            var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                            var mins = Math.floor(msec / 60000);

                            var hw = mins / 60;
                            hoursWork = hw - breaktime;
                            var totalHw = hoursWork > 8 ? 8 : hoursWork;
                            var totalHwOt = hoursWork > 8.5 ? hoursWork - 8 : 0;

                            totalRestday = remarks === "Working Restday" ? totalRestday + totalHw : totalRestday;
                            totalRestdayOt = remarks === "Working Restday" ? totalRestdayOt + totalHwOt : totalRestdayOt;

                            totalHoliday = remarks === "Working Holiday" ? totalHoliday + totalHw : totalHoliday;
                            totalHolidayOt = remarks === "Working Holiday" ? totalHolidayOt + totalHwOt : totalHolidayOt;

                            totalSpecialHoliday = remarks === "Working Special Holiday" ? totalSpecialHoliday + totalHw : totalSpecialHoliday;
                            totalSpecialHolidayOt = remarks === "Working Special Holiday" ? totalSpecialHolidayOt + totalHwOt : totalSpecialHolidayOt;

                            totalHolidayRestday = remarks === "Working Holiday Rest Day" ? totalHolidayRestday + totalHw : totalHolidayRestday;
                            totalHolidayRestdayOt = remarks === "Working Holiday Rest Day" ? totalHolidayRestdayOt + totalHwOt : totalHolidayRestdayOt;

                            totalSpecialHolidayRestday = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestday + totalHw : totalSpecialHolidayRestday;
                            totalSpecialHolidayRestdayOt = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestdayOt + totalHwOt : totalSpecialHolidayRestdayOt;

                            ot = totalHwOt;
                            ut = 0;
                            remarks = remarks;
                        }
                    }

                    if (remarks === "SL w/ Pay" || remarks === "VL w/ Pay") hoursWork = 8;

                    if (remarks === "" && moment(timeIn, "h:mm").hour() + (moment(timeIn, "h:mm").minutes() / 60) > moment(depIn).hours() + (moment(depIn).minutes() / 60) && day !== "Sunday") {
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
                        remarks = holiday[0].type;
                        reason = holiday[0].title;
                    }

                    totalHrsWork = totalHrsWork + hoursWork;
                    totalLate = totalLate + late;
                    totalUT = totalUT + ut;
                    totalOT = remarks === "Overtime" ? totalOT + ot : totalOT;
                    totalAbsent = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" ? totalAbsent + 1 : totalAbsent;

                    var logs = {
                        "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
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

                    theDate.setDate(theDate.getDate() + 1);
                }

                const salary = await salaryModel.findOne({
                    employeeId: emp[i]._id,
                });

                var monthly = params.type === "Full Month" ? 26 : 26 / 2;

                var totalMonthly = !salary ? 0 : salary.salary;
                var basicMetalAsia = totalMonthly >= 373 * 26 ? 373 * 26 : totalMonthly;
                var allowanceMetalAsia = totalMonthly > basicMetalAsia ? totalMonthly - basicMetalAsia - 0 : 0;
                var dailyRate = (basicMetalAsia + allowanceMetalAsia) / monthly;

                var basic = params.type === "Full Month" ? basicMetalAsia : basicMetalAsia / 2;
                var allowance = params.type === "Full Month" ? allowanceMetalAsia : allowanceMetalAsia / 2;

                var absensesTardiness = (basic + allowance) / monthly * totalAbsent;
                var netOfTardiness = (basic + allowance) - absensesTardiness;
                var tmonthPayMetalAsia = ((basic + allowance - absensesTardiness) / 12);

                var amountOt = params.type === "Full Month" ? (basic / 26) / 8 * totalOT * 1.25 : ((basic / 13) / 8 * totalOT * 1.25) + ((allowance / 13) / 8 * totalOT);
                var amountRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalRestday * 1.3 : dailyRate / 8 * totalRestday * 1.3;
                var amountRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalRestdayOt * 1.3 * 1.3 : ((basic / 13) / 8 * totalRestdayOt * 1.3 * 1.3) + ((allowance / 13) / 8 * totalRestdayOt);
                var amountHoliday = params.type === "Full Month" ? (basic / 26) / 8 * totalHoliday * 1 : (basic / 13) / 8 * totalHoliday * 1;
                var amountHolidayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayOt * 2 * 1.3 : ((basic / 13) / 8 * totalHolidayOt * 2 * 1.3) + ((allowance / 13) / 8 * totalHolidayOt);
                var amountSH = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHoliday * 0.3 : (basic / 13) / 8 * totalSpecialHoliday * 0.3;
                var amountSHOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayOt * 1.3 * 1.3 : ((basic / 13) / 8 * totalSpecialHolidayOt * 1.3 * 1.3) + ((allowance / 13) / 8 * totalSpecialHolidayOt);
                var amountHolidayRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayRestday * 2 * 1.3 : (basic / 13) / 8 * totalHolidayRestday * 2 * 1.3;
                var amountHolidayRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayRestdayOt * 2 * 1.3 * 1.3 : ((basic / 13) / 8 * totalHolidayRestdayOt * 2 * 1.3 * 1.3) + ((allowance / 13) / 8 * totalHolidayRestdayOt);
                var amountSHRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayRestday * 1.5 : ((basic / 13) / 8 * totalSpecialHolidayRestday * 1.5);
                var amountSHRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayRestdayOt * 1.5 * 1.3 : ((basic / 13) / 8 * totalSpecialHolidayRestdayOt * 1.5 * 1.3) + ((allowance / 13) / 8 * totalSpecialHolidayRestdayOt);

                // Old Formula
                // var amountOt = ((((basicMetalAsia / monthly / 8) * totalOT) * 1.25 / 2) + ((allowanceMetalAsia / monthly / 8) * totalOT / 2));
                // var amountRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalRestday * 1.32 : dailyRate / 8 * totalRestday * 1.3;
                // var amountRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalRestdayOt * 1.32 * 1.32 : dailyRate / 8 * totalRestdayOt * 0.13 * 13;
                // var amountHoliday = params.type === "Full Month" ? (basic / 26) / 8 * totalHoliday * 1 : (basic / 13) / 8 * totalHoliday * 1;
                // var amountHolidayOt = params.type === "Full Month" ? (basic /26) / 8 * totalHolidayOt * 2 * 1.3 : (basic / 13) / 8 * totalHolidayOt * 2 * 1.3;
                // var amountSH = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHoliday * 0.3 : (basic / 13) / 8 * totalSpecialHoliday * 0.3;
                // var amountSHOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayOt * 1.3 * 1.3 : (basic / 13) / 8 * totalSpecialHolidayOt * 1.3 * 1.3;

                var tmonthPay = ((basic + allowance - absensesTardiness) / 12);

                //Deduction
                var sss = !salary || params.type === "1st Half" ? 0 : salary.sss;
                var phic = !salary || params.type === "1st Half" ? 0 : salary.phic;
                var hdmf = !salary || params.type === "1st Half" ? 0 : salary.hdmf;
                var sssLoan = !salary || params.type === "2nd Half" ? 0 : salary.sssLoan;
                var pagibigLoan = !salary || params.type === "2nd Half" ? 0 : salary.pagibigLoan;
                var careHealthPlus = !salary || params.type === "2nd Half" ? 0 : salary.careHealthPlus;

                var totalDeduction = sss + phic + hdmf + sssLoan + pagibigLoan + careHealthPlus;
                var totalEarnings = (basic + allowance + amountOt + tmonthPay + amountRestday + amountRestdayOt + amountHoliday + amountHolidayOt + amountSH + amountSHOt) - absensesTardiness;


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
                    "restday": amountRestday.toFixed(2),
                    "restdayOT": amountRestdayOt.toFixed(2),
                    "holiday": amountHoliday.toFixed(2),
                    "holidayOT": amountHolidayOt.toFixed(2),
                    "holidayRestday": amountHolidayRestday.toFixed(2),
                    "holidayRestdayOT": amountHolidayRestdayOt.toFixed(2),
                    "specialHolidayRestday": amountSHRestday.toFixed(2),
                    "specialHolidayRestdayOT": amountSHRestdayOt.toFixed(2),
                    "sh": amountSH.toFixed(2),
                    "shOt": amountSHOt.toFixed(2),
                    "tMonthPay": tmonthPay > 0 ? tmonthPay.toFixed(2) : (0).toFixed(2),
                }

                var employeeLogs = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                    "department": dep.department,
                    "salary": totalMonthly.toFixed(2),
                    "basicMetalAsia": basicMetalAsia.toFixed(2),
                    "allowanceMetalAsia": allowanceMetalAsia.toFixed(2),
                    "dailyRate": dailyRate.toFixed(2),

                    "timeLogs": timeLogs,

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
                    "totalAbsent": totalAbsent.toFixed,

                    "deductions": [deductions],
                    "earnings": [earnings],
                    "totalHoursWork": totalHrsWork.toFixed(2),
                    "totalEarnings": totalEarnings > 0 ? totalEarnings.toFixed(2) : (0).toFixed(2),
                    "totalDeduction": totalDeduction.toFixed(2),

                    "netOfTardiness": netOfTardiness.toFixed(2),
                    "grossSalary": (netOfTardiness + amountOt).toFixed(2),
                    "totalAbsensesTardiness": totalAbsent,
                    "totalUT": totalUT.toFixed(2),
                    "totalOT": totalOT.toFixed(2),

                    "tMonthPayMetalAsia": tmonthPayMetalAsia > 0 ? tmonthPayMetalAsia.toFixed(2) : (0).toFixed(2),
                    "netPayMetalAsia": (totalEarnings - totalDeduction) > 0 ? (totalEarnings - totalDeduction).toFixed(2) : (0).toFixed(2),
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

            // const emp = await employeeModel.find().skip((page) * perPage).limit(perPage).sort("lastName");

            var data = [];
            for (const i in emp) {
                const dep = await departmentModel.findById(emp[i].department);
                var timePerDay = JSON.parse(dep.timePerDay);
                var depIn = '';
                var depOut = '';

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
                    }).sort({ dateApproved: 1 });

                    var timeIn = "";
                    var timeOut = "";

                    var dt = dateTime;
                    var nxtDay = moment(theDate, "yyyy-MM-DD").add(1, 'd');
                    var nxtDayOT = [];

                    var reason = "";

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
                        } else {
                            timeIn = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeIn, "h:mm A").format("h:mm A") : "";
                            timeOut = Object.keys(dtr).length !== 0 ? moment(dtr[0].timeOut, "h:mm A").format("h:mm A") : "";
                        }

                        reason = Object.keys(dtr).length !== 0 ? dtr[0].reason : "";
                        breaktime = Object.keys(dtr).length !== 0 && dtr[0].breakTime === true ? 0 : 1;
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
                    var convertedDTO = moment(todt + " " + depOut).format();

                    var remarks = "";

                    var late = 0;
                    if (new Date(convertedTI).getTime() > new Date(convertedDTI).getTime() && day !== "Sunday") {
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
                        var date1 = depIn <= timeIn ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                        var date2 = depOut >= timeOut ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();

                        var msec = date2 - date1;
                        var mins = Math.floor(msec / 60000);
                        // var hrs = Math.floor(mins / 60);

                        // var sync = moment((hrs % 24) + ":" + mins, "h:mm");
                        var hw = mins / 60;
                        hoursWork = hw > 5 ? hw - 1 : hw;
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
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();
                            var date3 = new Date(convertedDTO).getTime();

                            var msec = date2 - date1;
                            var mins = Math.floor(msec / 60000);
                            // var hrs = Math.floor(mins / 60);

                            var msecOT = date2 - date3;
                            var otMins = Math.floor(msecOT / 60000);

                            var hw = mins / 60;
                            hoursWork = hw > 5 ? hw - 1 : hw;
                            ot = otMins / 60;

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

                            hoursWork = hw > 5 ? hw - 1 : hw;
                            ot = nsecOt / 36e5;

                        }
                    }

                    if (remarks !== "Overtime" && new Date(convertedTO).getTime() > new Date(convertedDTO).getTime() && Object.keys(dtr).length === 0 && day !== "Sunday" || remarks !== "Overtime" && Object.keys(nxtDayOT).length > 0 && Object.keys(dtr).length === 0 && day !== "Sunday") {
                        ot = 0;
                        remarks = "OT For Approval";
                    }

                    if (remarks === "Working Rest Day" ||
                        remarks === "Working Holiday" ||
                        remarks === "Working Special Holiday" ||
                        remarks === "Working Holiday Rest Day" ||
                        remarks === "Working Special Holiday Rest Day" ||
                        remarks === "Offset") {

                        if (timeIn && timeOut) {
                            var date1 = new Date(convertedTI).getTime();
                            var date2 = new Date(convertedTO).getTime();

                            var msec = date2 > date1 ? date2 - date1 : date1 - date2;
                            var mins = Math.floor(msec / 60000);

                            var hw = mins / 60;
                            hoursWork = hw - breaktime;
                            var totalHw = hoursWork > 8 ? 8 : hoursWork;
                            var totalHwOt = hoursWork > 8.5 ? hoursWork - 8 : 0;

                            totalRestday = remarks === "Working Restday" ? totalRestday + totalHw : totalRestday;
                            totalRestdayOt = remarks === "Working Restday" ? totalRestdayOt + totalHwOt : totalRestdayOt;

                            totalHoliday = remarks === "Working Holiday" ? totalHoliday + totalHw : totalHoliday;
                            totalHolidayOt = remarks === "Working Holiday" ? totalHolidayOt + totalHwOt : totalHolidayOt;

                            totalSpecialHoliday = remarks === "Working Special Holiday" ? totalSpecialHoliday + totalHw : totalSpecialHoliday;
                            totalSpecialHolidayOt = remarks === "Working Special Holiday" ? totalSpecialHolidayOt + totalHwOt : totalSpecialHolidayOt;

                            totalHolidayRestday = remarks === "Working Holiday Rest Day" ? totalHolidayRestday + totalHw : totalHolidayRestday;
                            totalHolidayRestdayOt = remarks === "Working Holiday Rest Day" ? totalHolidayRestdayOt + totalHwOt : totalHolidayRestdayOt;

                            totalSpecialHolidayRestday = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestday + totalHw : totalSpecialHolidayRestday;
                            totalSpecialHolidayRestdayOt = remarks === "Working Special Holiday Rest Day" ? totalSpecialHolidayRestdayOt + totalHwOt : totalSpecialHolidayRestdayOt;

                            ot = totalHwOt;
                            ut = 0;
                            remarks = remarks;
                        }
                    }

                    if (remarks === "SL w/ Pay" || remarks === "VL w/ Pay") hoursWork = 8;

                    if (remarks === "" && moment(timeIn, "h:mm").hour() + (moment(timeIn, "h:mm").minutes() / 60) > moment(depIn).hours() + (moment(depIn).minutes() / 60) && day !== "Sunday") {
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
                        remarks = holiday[0].type;
                        reason = holiday[0].title;
                    }

                    totalHrsWork = totalHrsWork + hoursWork;
                    totalLate = totalLate + late;
                    totalUT = totalUT + ut;
                    totalOT = remarks === "Overtime" ? totalOT + ot : totalOT;
                    totalAbsent = remarks === "Absent" || remarks === "SL w/o Pay" || remarks === "VL w/o Pay" ? totalAbsent + 1 : totalAbsent;

                    var logs = {
                        "timeIn": moment(timeIn, "h:mm A").format("h:mm A"),
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

                    theDate.setDate(theDate.getDate() + 1);
                }

                const salary = await salaryModel.findOne({
                    employeeId: emp[i]._id,
                });

                var monthly = params.type === "Full Month" ? 26 : 26 / 2;

                var totalMonthly = !salary ? 0 : salary.salary;
                var basicMetalAsia = totalMonthly >= 373 * 26 ? 373 * 26 : totalMonthly;
                var allowanceMetalAsia = totalMonthly > basicMetalAsia ? totalMonthly - basicMetalAsia - 0 : 0;
                var dailyRate = (basicMetalAsia + allowanceMetalAsia) / monthly;

                var basic = params.type === "Full Month" ? basicMetalAsia : basicMetalAsia / 2;
                var allowance = params.type === "Full Month" ? allowanceMetalAsia : allowanceMetalAsia / 2;

                var absensesTardiness = (basic + allowance) / monthly * totalAbsent;
                var netOfTardiness = (basic + allowance) - absensesTardiness;
                var tmonthPayMetalAsia = ((basic + allowance - absensesTardiness) / 12);

                var amountOt = params.type === "Full Month" ? (basic / 26) / 8 * totalOT * 1.25 : ((basic / 13) / 8 * totalOT * 1.25) + ((allowance / 13) / 8 * totalOT);;
                var amountRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalRestday * 1.3 : dailyRate / 8 * totalRestday * 1.3;
                var amountRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalRestdayOt * 1.3 * 1.3 : ((basic / 13) / 8 * totalRestdayOt * 1.3 * 1.3) + ((allowance / 13) / 8 * totalRestdayOt);
                var amountHoliday = params.type === "Full Month" ? (basic / 26) / 8 * totalHoliday * 1 : (basic / 13) / 8 * totalHoliday * 1;
                var amountHolidayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayOt * 2 * 1.3 : ((basic / 13) / 8 * totalHolidayOt * 2 * 1.3) + ((allowance / 13) / 8 * totalHolidayOt);
                var amountSH = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHoliday * 0.3 : (basic / 13) / 8 * totalSpecialHoliday * 0.3;
                var amountSHOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayOt * 1.3 * 1.3 : ((basic / 13) / 8 * totalSpecialHolidayOt * 1.3 * 1.3) + ((allowance / 13) / 8 * totalSpecialHolidayOt);
                var amountHolidayRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayRestday * 2 * 1.3 : (basic / 13) / 8 * totalHolidayRestday * 2 * 1.3;
                var amountHolidayRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayRestdayOt * 2 * 1.3 * 1.3 : ((basic / 13) / 8 * totalHolidayRestdayOt * 2 * 1.3 * 1.3) + ((allowance / 13) / 8 * totalHolidayRestdayOt);
                var amountSHRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayRestday * 1.5 : ((basic / 13) / 8 * totalSpecialHolidayRestday * 1.5);
                var amountSHRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayRestdayOt * 1.5 * 1.3 : ((basic / 13) / 8 * totalSpecialHolidayRestdayOt * 1.5 * 1.3) + ((allowance / 13) / 8 * totalSpecialHolidayRestdayOt);

                // Old Formula
                // var amountOt = ((((basicMetalAsia / monthly / 8) * totalOT) * 1.25 / 2) + ((allowanceMetalAsia / monthly / 8) * totalOT / 2));
                // var amountRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalRestday * 1.32 : dailyRate / 8 * totalRestday * 1.3;
                // var amountRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalRestdayOt * 1.32 * 1.32 : dailyRate / 8 * totalRestdayOt * 0.13 * 13;
                // var amountHoliday = params.type === "Full Month" ? (basic / 26) / 8 * totalHoliday * 1 : (basic / 13) / 8 * totalHoliday * 1;
                // var amountHolidayOt = params.type === "Full Month" ? (basic /26) / 8 * totalHolidayOt * 2 * 1.3 : (basic / 13) / 8 * totalHolidayOt * 2 * 1.3;
                // var amountSH = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHoliday * 0.3 : (basic / 13) / 8 * totalSpecialHoliday * 0.3;
                // var amountSHOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayOt * 1.3 * 1.3 : (basic / 13) / 8 * totalSpecialHolidayOt * 1.3 * 1.3;

                var tmonthPay = ((basic + allowance - absensesTardiness) / 12);

                //Deduction
                var sss = !salary || params.type === "1st Half" ? 0 : salary.sss;
                var phic = !salary || params.type === "1st Half" ? 0 : salary.phic;
                var hdmf = !salary || params.type === "1st Half" ? 0 : salary.hdmf;
                var sssLoan = !salary || params.type === "2nd Half" ? 0 : salary.sssLoan;
                var pagibigLoan = !salary || params.type === "2nd Half" ? 0 : salary.pagibigLoan;
                var careHealthPlus = !salary || params.type === "2nd Half" ? 0 : salary.careHealthPlus;

                var totalDeduction = sss + phic + hdmf + sssLoan + pagibigLoan + careHealthPlus;
                var totalEarnings = (basic + allowance + amountOt + tmonthPay + amountRestday + amountRestdayOt + amountHoliday + amountHolidayOt + amountSH + amountSHOt) - absensesTardiness;


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
                    "restday": amountRestday.toFixed(2),
                    "restdayOT": amountRestdayOt.toFixed(2),
                    "holiday": amountHoliday.toFixed(2),
                    "holidayOT": amountHolidayOt.toFixed(2),
                    "holidayRestday": amountHolidayRestday.toFixed(2),
                    "holidayRestdayOT": amountHolidayRestdayOt.toFixed(2),
                    "specialHolidayRestday": amountSHRestday.toFixed(2),
                    "specialHolidayRestdayOT": amountSHRestdayOt.toFixed(2),
                    "sh": amountSH.toFixed(2),
                    "shOt": amountSHOt.toFixed(2),
                    "tMonthPay": tmonthPay > 0 ? tmonthPay.toFixed(2) : (0).toFixed(2),
                }

                var employeeLogs = {
                    "_id": emp[i]._id,
                    "employeeNo": emp[i].employeeNo,
                    "employeeName": emp[i].lastName + ", " + emp[i].firstName + " " + emp[i].middleName + " " + emp[i].suffix,
                    "department": dep.department,
                    "salary": totalMonthly.toFixed(2),
                    "basicMetalAsia": basicMetalAsia.toFixed(2),
                    "allowanceMetalAsia": allowanceMetalAsia.toFixed(2),
                    "dailyRate": dailyRate.toFixed(2),

                    "timeLogs": timeLogs,

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
                    "totalAbsent": totalAbsent,

                    "deductions": [deductions],
                    "earnings": [earnings],
                    "totalHoursWork": totalHrsWork.toFixed(2),
                    "totalEarnings": totalEarnings > 0 ? totalEarnings.toFixed(2) : (0).toFixed(2),
                    "totalDeduction": totalDeduction.toFixed(2),

                    "netOfTardiness": netOfTardiness.toFixed(2),
                    "grossSalary": (netOfTardiness + amountOt).toFixed(2),
                    "totalAbsensesTardiness": totalAbsent,
                    "totalUT": totalUT.toFixed(2),
                    "totalOT": totalOT.toFixed(2),

                    "tMonthPayMetalAsia": tmonthPayMetalAsia > 0 ? tmonthPayMetalAsia.toFixed(2) : (0).toFixed(2),
                    "netPayMetalAsia": (totalEarnings - totalDeduction) > 0 ? (totalEarnings - totalDeduction).toFixed(2) : (0).toFixed(2),
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