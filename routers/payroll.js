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
                        var date1 = new Date(convertedDTI) >= new Date(convertedTI) ? new Date(convertedDTI).getTime() : new Date(convertedTI).getTime();
                        var date2 = new Date(convertedDTO) <= new Date(convertedTO) ? new Date(convertedDTO).getTime() : new Date(convertedTO).getTime();

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

                            hoursWork = (hw + dtr[0].otHours) - 0;
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

                            hoursWork = hw > 5 ? hw - 0 : hw;
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
                            hoursWork = hw - dtr[0].breakTimeHrs;
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

                    // totalSpecialHoliday = remarks === "Special Holiday" ? totalSpecialHoliday + 8 : totalSpecialHoliday;
                    // totalHoliday = remarks === "Regular Holiday" ? totalHoliday + 8 : totalHoliday;
                    // totalHolidayRestday = remarks === "Regular Holiday Rest Day" ? totalHolidayRestday + 8 : totalHolidayRestday;
                    // totalSpecialHolidayRestday = remarks === "Special Holiday Rest Day" ? totalSpecialHolidayRestday + 8 : totalSpecialHolidayRestday;

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

                        totalOT = dtr[0].otHours ? totalOT + ot : totalOT;
                        totalUT = dtr[0].undertime ? totalUT + ut : totalUT;
                    }
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

                var totalMonthlyBaseOnType = params.type === "Full Month" ? totalMonthly : totalMonthly / 2;
                var basic = params.type === "Full Month" ? basicMetalAsia : basicMetalAsia / 2;
                var allowance = params.type === "Full Month" ? allowanceMetalAsia : allowanceMetalAsia / 2;

                var absensesTardiness = (basic + allowance) / monthly * totalAbsent;
                var netOfTardiness = (basic + allowance) - absensesTardiness;
                var tmonthPayMetalAsia = ((basic + allowance - absensesTardiness) / 12);

                // var amountOt = (((373 * monthly) / monthly) / 8 * totalOT * 1.25) + (((totalMonthly - (373 * monthly)) / monthly) / 8 * totalOT); //old formula
                var amountOt = (((373 * monthly) / monthly) / 8 * totalOT * 1.25) + (((totalMonthlyBaseOnType - basic) / monthly) / 8 * totalOT);

                var amountRestday = (totalMonthlyBaseOnType / monthly) / 8 * totalRestday * 1.3;
                var amountRestdayOt = (((373 * monthly) / monthly) / 8 * totalRestdayOt * 1.69) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalRestdayOt);

                var amountHoliday = (totalMonthlyBaseOnType / monthly) / 8 * totalHoliday * 2;
                var amountHolidayOt = (((373 * monthly) / monthly) / 8 * totalHolidayOt * 2.6) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalHolidayOt);

                var amountSH = (totalMonthlyBaseOnType / monthly) / 8 * totalSpecialHoliday * 1.3;
                var amountSHOt = (((373 * monthly) / monthly) / 8 * totalSpecialHolidayOt * 1.69) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalSpecialHolidayOt);

                var amountHolidayRestday = (totalMonthlyBaseOnType / monthly) / 8 * totalHolidayRestday * 3.38;
                var amountHolidayRestdayOt = (((373 * monthly) / monthly) / 8 * totalHolidayRestdayOt * 3.38) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalHolidayRestdayOt);

                var amountSHRestday = (totalMonthlyBaseOnType / monthly) / 8 * totalSpecialHolidayRestday * 1.6;
                var amountSHRestdayOt = (((373 * monthly) / monthly) / 8 * totalSpecialHolidayRestdayOt * 1.95) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalSpecialHolidayRestdayOt);

                var tmonthPay = ((basic + allowance - absensesTardiness) / 12);

                //Deduction
                var sss = !salary || params.type === "1st Half" ? 0 : salary.sss;
                var phic = !salary || params.type === "1st Half" ? 0 : salary.phic;
                var hdmf = !salary || params.type === "1st Half" ? 0 : salary.hdmf;
                var cashAdvance = !salary || params.type === "1st Half" ? 0 : salary.cashAdvance;
                var safetyShoes = !salary || params.type === "1st Half" ? 0 : salary.safetyShoes;
                var sssLoan = !salary || params.type === "2nd Half" ? 0 : salary.sssLoan;
                var pagibigLoan = !salary || params.type === "2nd Half" ? 0 : salary.pagibigLoan;
                var careHealthPlus = !salary || params.type === "2nd Half" ? 0 : salary.careHealthPlus;

                var totalDeduction = sss + phic + hdmf + sssLoan + pagibigLoan + careHealthPlus;
                var totalEarnings = (basic + allowance + amountOt + tmonthPay + amountRestday + amountRestdayOt + amountHoliday + amountHolidayOt + amountSH + amountSHOt) - absensesTardiness;


                var deductions = {
                    "sss": sss.toFixed(2),
                    "phic": phic.toFixed(2),
                    "hdmf": hdmf.toFixed(2),
                    "cashAdvance": cashAdvance.toFixed(2),
                    "safetyShoes": safetyShoes.toFixed(2),
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
                    "totalAbsent": totalAbsent.toFixed(0),

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

                            hoursWork = (hw + dtr[0].otHours) - 0;
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

                            hoursWork = hw > 5 ? hw - 0 : hw;
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
                            hoursWork = hw - dtr[0].breakTimeHrs;
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

                    // totalSpecialHoliday = remarks === "Special Holiday" ? totalSpecialHoliday + 8 : totalSpecialHoliday;
                    // totalHoliday = remarks === "Regular Holiday" ? totalHoliday + 8 : totalHoliday;
                    // totalHolidayRestday = remarks === "Regular Holiday Rest Day" ? totalHolidayRestday + 8 : totalHolidayRestday;
                    // totalSpecialHolidayRestday = remarks === "Special Holiday Rest Day" ? totalSpecialHolidayRestday + 8 : totalSpecialHolidayRestday;

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

                        totalOT = dtr[0].otHours ? totalOT + ot : totalOT;
                        totalUT = dtr[0].undertime ? totalUT + ut : totalUT;
                    }

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

                var totalMonthlyBaseOnType = params.type === "Full Month" ? totalMonthly : totalMonthly / 2;
                var basic = params.type === "Full Month" ? basicMetalAsia : basicMetalAsia / 2;
                var allowance = params.type === "Full Month" ? allowanceMetalAsia : allowanceMetalAsia / 2;

                var absensesTardiness = (basic + allowance) / monthly * totalAbsent;
                var netOfTardiness = (basic + allowance) - absensesTardiness;
                var tmonthPayMetalAsia = ((basic + allowance - absensesTardiness) / 12);

                // var amountOt = (((373 * monthly) / monthly) / 8 * totalOT * 1.25) + (((totalMonthly - (373 * monthly)) / monthly) / 8 * totalOT); old formula
                var amountOt = (((373 * monthly) / monthly) / 8 * totalOT * 1.25) + (((totalMonthlyBaseOnType - basic) / monthly) / 8 * totalOT);

                var amountRestday = (totalMonthlyBaseOnType / monthly) / 8 * totalRestday * 1.3;
                var amountRestdayOt = (((373 * monthly) / monthly) / 8 * totalRestdayOt * 1.69) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalRestdayOt);

                var amountHoliday = (totalMonthlyBaseOnType / monthly) / 8 * totalHoliday * 2;
                var amountHolidayOt = (((373 * monthly) / monthly) / 8 * totalHolidayOt * 2.6) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalHolidayOt);

                var amountSH = (totalMonthlyBaseOnType / monthly) / 8 * totalSpecialHoliday * 1.3;
                var amountSHOt = (((373 * monthly) / monthly) / 8 * totalSpecialHolidayOt * 1.69) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalSpecialHolidayOt);

                var amountHolidayRestday = (totalMonthlyBaseOnType / monthly) / 8 * totalHolidayRestday * 3.38;
                var amountHolidayRestdayOt = (((373 * monthly) / monthly) / 8 * totalHolidayRestdayOt * 3.38) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalHolidayRestdayOt);

                var amountSHRestday = (totalMonthlyBaseOnType / monthly) / 8 * totalSpecialHolidayRestday * 1.6;
                var amountSHRestdayOt = (((373 * monthly) / monthly) / 8 * totalSpecialHolidayRestdayOt * 1.95) + (((totalMonthlyBaseOnType - (373 * monthly)) / monthly) / 8 * totalSpecialHolidayRestdayOt);

                // var amountOt = params.type === "Full Month" ? (basic / 26) / 8 * totalOT * 1.25 : ((basic / 13) / 8 * totalOT * 1.25) + ((allowance / 13) / 8 * totalOT);;
                // var amountRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalRestday * 1.3 : dailyRate / 8 * totalRestday * 1.3;
                // var amountRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalRestdayOt * 1.3 * 1.3 : ((basic / 13) / 8 * totalRestdayOt * 1.3 * 1.3) + ((allowance / 13) / 8 * totalRestdayOt);
                // var amountHoliday = params.type === "Full Month" ? (basic / 26) / 8 * totalHoliday * 1 : (basic / 13) / 8 * totalHoliday * 1;
                // var amountHolidayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayOt * 2 * 1.3 : ((basic / 13) / 8 * totalHolidayOt * 2 * 1.3) + ((allowance / 13) / 8 * totalHolidayOt);
                // var amountSH = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHoliday * 0.3 : (basic / 13) / 8 * totalSpecialHoliday * 0.3;
                // var amountSHOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayOt * 1.3 * 1.3 : ((basic / 13) / 8 * totalSpecialHolidayOt * 1.3 * 1.3) + ((allowance / 13) / 8 * totalSpecialHolidayOt);
                // var amountHolidayRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayRestday * 2 * 1.3 : (basic / 13) / 8 * totalHolidayRestday * 2 * 1.3;
                // var amountHolidayRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalHolidayRestdayOt * 2 * 1.3 * 1.3 : ((basic / 13) / 8 * totalHolidayRestdayOt * 2 * 1.3 * 1.3) + ((allowance / 13) / 8 * totalHolidayRestdayOt);
                // var amountSHRestday = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayRestday * 1.5 : ((basic / 13) / 8 * totalSpecialHolidayRestday * 1.5);
                // var amountSHRestdayOt = params.type === "Full Month" ? (basic / 26) / 8 * totalSpecialHolidayRestdayOt * 1.5 * 1.3 : ((basic / 13) / 8 * totalSpecialHolidayRestdayOt * 1.5 * 1.3) + ((allowance / 13) / 8 * totalSpecialHolidayRestdayOt);

                var tmonthPay = ((basic + allowance - absensesTardiness) / 12);

                //Deduction
                var sss = !salary || params.type === "1st Half" ? 0 : salary.sss;
                var phic = !salary || params.type === "1st Half" ? 0 : salary.phic;
                var hdmf = !salary || params.type === "1st Half" ? 0 : salary.hdmf;
                var cashAdvance = !salary || params.type === "1st Half" ? 0 : salary.cashAdvance;
                var safetyShoes = !salary || params.type === "1st Half" ? 0 : salary.safetyShoes;
                var sssLoan = !salary || params.type === "2nd Half" ? 0 : salary.sssLoan;
                var pagibigLoan = !salary || params.type === "2nd Half" ? 0 : salary.pagibigLoan;
                var careHealthPlus = !salary || params.type === "2nd Half" ? 0 : salary.careHealthPlus;

                var totalDeduction = sss + phic + hdmf + sssLoan + pagibigLoan + careHealthPlus;
                var totalEarnings = (basic + allowance + amountOt + tmonthPay + amountRestday + amountRestdayOt + amountHoliday + amountHolidayOt + amountSH + amountSHOt) - absensesTardiness;


                var deductions = {
                    "sss": sss.toFixed(2),
                    "phic": phic.toFixed(2),
                    "hdmf": hdmf.toFixed(2),
                    "cashAdvance": cashAdvance.toFixed(2),
                    "safetyShoes": safetyShoes.toFixed(2),
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