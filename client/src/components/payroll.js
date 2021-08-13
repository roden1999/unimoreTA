import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardActionArea from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import CircularProgress from '@material-ui/core/CircularProgress';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Input from '@material-ui/core/Input';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import DateFnsUtils from '@date-io/date-fns';
import {
    MuiPickersUtilsProvider,
    KeyboardTimePicker,
    KeyboardDatePicker,
} from '@material-ui/pickers';
import { Save, Edit, Delete, Add, PictureAsPdf, Print } from '@material-ui/icons/';
import { useSpring, animated } from 'react-spring/web.cjs';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { TextField } from '@material-ui/core';
import { DropzoneDialog } from 'material-ui-dropzone'
import XLSX from "xlsx";

//import pdfmake
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        height: '100%',
        minHeight: '80vh',
        maxHeight: '80vh',
        overflow: 'hidden'
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalPaper: {
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
    tbcontainer: {
        maxHeight: 375,
    },
}));

const Fade = React.forwardRef(function Fade(props, ref) {
    const { in: open, children, onEnter, onExited, ...other } = props;
    const style = useSpring({
        from: { opacity: 0 },
        to: { opacity: open ? 1 : 0 },
        onStart: () => {
            if (open && onEnter) {
                onEnter();
            }
        },
        onRest: () => {
            if (!open && onExited) {
                onExited();
            }
        },
    });

    return (
        <animated.div ref={ref} style={style} {...other}>
            {children}
        </animated.div>
    );
});

const customSelectStyle = {
    control: base => ({
        ...base,
        height: 40,
        minHeight: 40,
        borderRadiusTopRight: 0,
        borderRadiusBottomRight: 0,
        // backgroundColor: '#383f48',
    }),
    option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'white' : 'black',
        padding: 20,
        zIndex: 1000
    }),
    singleValue: base => ({
        ...base,
        // color: "#fff"
    }),
    input: base => ({
        ...base,
        // color: "#fff"
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
};

const StyledTableCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
    root: {
        '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}))(TableRow);


const Payroll = () => {
    const classes = useStyles();
    const [loader, setLoader] = useState(false);
    const [logData, setLogData] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState([]);
    const [selectedType, setSelectedType] = useState({ label: "Full Month", value: "Full Month" });
    const [fromDate, setFromDate] = useState(moment().startOf('month').format('MM/DD/yyyy'));
    const [toDate, setToDate] = useState(moment().format('MM/DD/yyyy'));
    const [totalEmployee, setTotalEmployee] = useState(0);
    const [page, setPage] = useState(0);

    useEffect(() => {
        var data = {
            selectedEmployee: !selectedEmployee ? [] : selectedEmployee,
            type: !selectedType ? "" : selectedType.value,
            fromDate: fromDate,
            toDate: toDate,
            page: page
        };
        var route = "payroll/payroll-list";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        // const user = JSON.parse(sessionStorage.getItem('user'));

        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setLogData(response.data);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setLogData(obj);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [selectedEmployee, selectedType, page, loader, toDate, fromDate]);

    const logList = logData
        ? logData.map((x) => ({
            id: x._id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName,
            department: x.department,

            timeLogs: x.timeLogs,

            totalHoursWork: x.totalHoursWork,
            totalRestday: x.totalRestday,
            totalRestdayOt: x.totalRestdayOt,
            totalHoliday: x.totalHoliday,
            totalHolidayOt: x.totalHolidayOt,
            totalSpecialHoliday: x.totalSpecialHoliday,
            totalSpecialHolidayOt: x.totalSpecialHolidayOt,
            totalHolidayRestday: x.totalHolidayRestday,
            totalHolidayRestdayOt: x.totalHolidayRestdayOt,
            totalSpecialHolidayRestday: x.totalSpecialHolidayRestday,
            totalSpecialHolidayRestdayOt: x.totalSpecialHolidayRestdayOt,
            totalLate: x.totalLate,
            totalUT: x.totalUT,
            totalOT: x.totalOT,
            totalAbsent: x.totalAbsent,

            deductions: x.deductions,
            earnings: x.earnings,

            totalHoursWork: x.totalHoursWork,
            totalEarnings: x.totalEarnings,
            totalDeduction: x.totalDeduction,

            netOfTardiness: x.netOfTardiness,
            grossSalary: x.grossSalary,
            totalAbsensesTardiness: x.totalAbsensesTardiness,

            tMonthPayMetalAsia: x.tMonthPayMetalAsia,
            netPayMetalAsia: x.netPayMetalAsia
        }))
        : [];

    useEffect(() => {
        var route = "employees/options";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        axios
            .get(url, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setEmployeeOptions(response.data);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setEmployeeOptions(obj);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [loader]);

    const employeeOptionsList = employeeOptions
        ? employeeOptions.map((x) => ({
            id: x._id,
            name: x.firstName + " " + x.middleName + " " + x.lastName + " - (" + x.employeeNo + ")",
            employeeNo: x.employeeNo
        }))
        : [];

    function EmployeeOption(item) {
        var list = [];
        if (item !== undefined || item !== null) {
            item.map((x) => {
                return list.push({
                    label: x.name,
                    value: x.id,
                });
            });
        }
        return list;
    }

    useEffect(() => {
        var route = "employees/total-employees";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");
        axios
            .get(url)
            .then(function (response) {
                // handle success
                var total = response.data !== "" ? response.data : 0;
                setTotalEmployee(total);
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [employeeOptions, selectedEmployee, loader]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const exportToPDF = (e) => {
        var payrollFrequency = selectedType.value;
        var earnings = e.earnings;
        var deductions = e.deductions;
        const document = {
            content: [
                { image: 'unimore', width: 180, height: 50 },
                {
                    columns: [
                        [
                            { text: e.employeeName, fontSize: 10, bold: true, lineHeight: 1 },
                            { text: e.department, fontSize: 10, bold: true, lineHeight: 1, },
                        ],
                        [
                            { text: "Period Covered: " + moment(fromDate).format("MMM DD") + " - " + moment(toDate).format("DD, yyyy"), fontSize: 10, bold: true, lineHeight: 1, },
                            { text: "Payroll Frequency: " + payrollFrequency.toString(), fontSize: 10, bold: true, lineHeight: 1, },
                        ]
                    ]
                },
                {
                    margin: [0, 5],
                    columns: [
                        [
                            { text: "Earnings", bold: true, fontSize: 9, alignment: 'center', margin: [0, 5] },
                            {
                                columns: [
                                    [
                                        { text: 'Basic: ', fontSize: 8, },
                                        { text: 'Absenses/Tardiness: ', fontSize: 8, },
                                        { text: 'Allowance: ', fontSize: 8, },
                                        { text: 'Overtime: ', fontSize: 8, },
                                        { text: 'Restday: ', fontSize: 8, },
                                        { text: 'Restday OT: ', fontSize: 8, },
                                        { text: 'Regular Holiday: ', fontSize: 8, },
                                        { text: 'Regular Holiday OT: ', fontSize: 8, },
                                        { text: 'Special Holiday: ', fontSize: 8, },
                                        { text: 'Special Holiday OT: ', fontSize: 8, },
                                        { text: 'Regular Holiday Rest Day: ', fontSize: 8, },
                                        { text: 'Regular Holiday Rest Day OT: ', fontSize: 8, },
                                        { text: 'Special Holiday Rest Day: ', fontSize: 8, },
                                        { text: 'Special Holiday Rest Day OT: ', fontSize: 8, },
                                        { text: '13th Month: ', fontSize: 8, },
                                        { text: "Total Earnings: ", bold: true, fontSize: 9, alignment: 'left', margin: [0, 5] },
                                    ],
                                    [
                                        { text: earnings[0].basic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].absensesTardiness.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].allowance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].overtime.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].restday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].restdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holiday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holidayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].sh.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].shOt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holidayRestday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holidayRestdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].specialHolidayRestday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].specialHolidayRestdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].tMonthPay.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: e.totalEarnings.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), bold: true, fontSize: 9, alignment: 'left', margin: [0, 5] },
                                    ]
                                ]
                            },
                        ],
                        [
                            { text: "Deductions", bold: true, fontSize: 9, alignment: 'center', margin: [0, 5] },
                            {
                                columns: [
                                    [
                                        { text: "SSS: ", fontSize: 8, },
                                        { text: "PHIC: ", fontSize: 8, },
                                        { text: "HDMF: ", fontSize: 8, },
                                    ],
                                    [
                                        { text: deductions[0].sss.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].phic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].hdmf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                    ]
                                ]
                            },
                            { text: "Other Deductions", bold: true, fontSize: 9, alignment: 'center', margin: [0, 5] },
                            {
                                columns: [
                                    [
                                        { text: 'SSS Loan: ', fontSize: 8, },
                                        { text: 'PAG-IBIG Loan: ', fontSize: 8, },
                                        { text: 'Care Health Plus: ', fontSize: 8, },

                                        { text: "Total Deductions: ", bold: true, fontSize: 9, margin: [0, 5] },

                                        { text: "Net Pay: ", bold: true, fontSize: 9, margin: [0, 5] },
                                    ],
                                    [
                                        { text: deductions[0].sssLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].pagibigLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].careHealthPlus.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },

                                        { text: e.totalDeduction.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), bold: true, fontSize: 9, margin: [0, 5] },

                                        { text: e.netPayMetalAsia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), bold: true, fontSize: 9, margin: [0, 5] },
                                    ]
                                ]
                            },

                            { text: "I Acknowledge to have been received the amount stated here within no further claim for services rendered.", bold: false, fontSize: 9, margin: [0, 5] },

                            { text: "______________________________________________", bold: true, alignment: 'left', margin: [0, 5] },

                            { text: e.employeeName, bold: true, fontSize: 9, alignment: 'center', },
                        ]
                    ],
                },
                { text: "*This copy is for your personal reference only and should not be use for any personal transactions nor shown to other parties. Keep it confidential.", fontSize: 8, italics: true, alignment: 'center', margin: [0, 0, 0, 20] },

                { image: 'unimore', width: 180, height: 50, },
                {
                    columns: [
                        [
                            { text: e.employeeName, fontSize: 10, bold: true, lineHeight: 1 },
                            { text: e.department, fontSize: 10, bold: true, lineHeight: 1, },
                        ],
                        [
                            { text: "Period Covered: " + moment(fromDate).format("MMM DD") + " - " + moment(toDate).format("DD, yyyy"), fontSize: 10, bold: true, lineHeight: 1, },
                            { text: "Payroll Frequency: " + payrollFrequency.toString(), fontSize: 10, bold: true, lineHeight: 1, },
                        ]
                    ]
                },
                {
                    margin: [0, 5],
                    columns: [
                        [
                            { text: "Earnings", bold: true, fontSize: 9, alignment: 'center', margin: [0, 5] },
                            {
                                columns: [
                                    [
                                        { text: 'Basic: ', fontSize: 8, },
                                        { text: 'Absenses/Tardiness: ', fontSize: 8, },
                                        { text: 'Allowance: ', fontSize: 8, },
                                        { text: 'Overtime: ', fontSize: 8, },
                                        { text: 'Restday: ', fontSize: 8, },
                                        { text: 'Restday OT: ', fontSize: 8, },
                                        { text: 'Regular Holiday: ', fontSize: 8, },
                                        { text: 'Regular Holiday OT: ', fontSize: 8, },
                                        { text: 'Special Holiday: ', fontSize: 8, },
                                        { text: 'Special Holiday OT: ', fontSize: 8, },
                                        { text: 'Regular Holiday Rest Day: ', fontSize: 8, },
                                        { text: 'Regular Holiday Rest Day OT: ', fontSize: 8, },
                                        { text: 'Special Holiday Rest Day: ', fontSize: 8, },
                                        { text: 'Special Holiday Rest Day OT: ', fontSize: 8, },
                                        { text: '13th Month: ', fontSize: 8, },
                                        { text: "Total Earnings: ", bold: true, fontSize: 9, alignment: 'left', margin: [0, 5] },
                                    ],
                                    [
                                        { text: earnings[0].basic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].absensesTardiness.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].allowance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].overtime.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].restday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].restdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holiday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holidayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].sh.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].shOt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holidayRestday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].holidayRestdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].specialHolidayRestday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].specialHolidayRestdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: earnings[0].tMonthPay.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: e.totalEarnings.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), bold: true, fontSize: 9, alignment: 'left', margin: [0, 5] },
                                    ]
                                ]
                            },
                        ],
                        [
                            { text: "Deductions", bold: true, fontSize: 9, alignment: 'center', margin: [0, 5] },
                            {
                                columns: [
                                    [
                                        { text: "SSS: ", fontSize: 8, },
                                        { text: "PHIC: ", fontSize: 8, },
                                        { text: "HDMF: ", fontSize: 8, },
                                    ],
                                    [
                                        { text: deductions[0].sss.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].phic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].hdmf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                    ]
                                ]
                            },
                            { text: "Other Deductions", bold: true, fontSize: 9, alignment: 'center', margin: [0, 5] },
                            {
                                columns: [
                                    [
                                        { text: 'SSS Loan: ', fontSize: 8, },
                                        { text: 'PAG-IBIG Loan: ', fontSize: 8, },
                                        { text: 'Care Health Plus: ', fontSize: 8, },

                                        { text: "Total Deductions: ", bold: true, fontSize: 9, margin: [0, 5] },

                                        { text: "Net Pay: ", bold: true, fontSize: 9, margin: [0, 5] },
                                    ],
                                    [
                                        { text: deductions[0].sssLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].pagibigLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },
                                        { text: deductions[0].careHealthPlus.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 8, },

                                        { text: e.totalDeduction.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), bold: true, fontSize: 9, margin: [0, 5] },

                                        { text: e.netPayMetalAsia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), bold: true, fontSize: 9, margin: [0, 5] },
                                    ]
                                ]
                            },

                            { text: "I Acknowledge to have been received the amount stated here within no further claim for services rendered.", bold: false, fontSize: 9, margin: [0, 5] },

                            { text: "______________________________________________", bold: true, alignment: 'left', margin: [0, 5] },

                            { text: e.employeeName, bold: true, fontSize: 9, alignment: 'center', },
                        ]
                    ],
                },
                { text: "*This copy is for your personal reference only and should not be use for any personal transactions nor shown to other parties. Keep it confidential.", fontSize: 8, italics: true, alignment: 'center', pageBreak: "after" },

                { image: 'unimore', width: 180, height: 50 },
                {
                    columns: [
                        [
                            { text: e.employeeName, fontSize: 10, bold: true, lineHeight: 1 },
                            { text: e.department, fontSize: 10, bold: true, lineHeight: 1, },
                        ],
                        [
                            { text: "Period Covered: " + moment(fromDate).format("MMM DD") + " - " + moment(toDate).format("DD, yyyy"), fontSize: 10, bold: true, lineHeight: 1, },
                            { text: "Payroll Frequency: " + payrollFrequency.toString(), fontSize: 10, bold: true, lineHeight: 1, },
                        ]
                    ]
                },
            ],
            images: {
                unimore: 'https://i.ibb.co/mTwt2jt/unimore-logo-back-black.png'
            }
        }
        document.content.push({
            // layout: 'lightHorizontalLines',
            table: {
                headerRows: 1,
                widths: [37, 50, 65, 30, 30, 30, 25, 22, 22, 55, 70],
                body: [
                    //Data
                    //Header
                    [
                        { text: 'Day', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Date', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Schedule', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'In', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Out', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Hours Work', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Late', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'UT', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'OT', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Remarks', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' },
                        { text: 'Reason', bold: true, fontSize: 9, alignment: "center", fillColor: '#C8C9CA' }
                    ],
                ]
            },
        });

        e.timeLogs.forEach(y => {
            document.content.push({
                // layout: 'lightHorizontalLines',
                table: {
                    headerRows: 1,
                    widths: [37, 50, 65, 30, 30, 30, 25, 22, 22, 55, 70],
                    body: [
                        //Data
                        [
                            { text: y.day.toString(), fontSize: 7, alignment: "center", color: y.day === "Sunday" ? "red" : "black" },
                            { text: moment(y.dateTime).format("MM/DD/yyyy").toString(), fontSize: 7, alignment: "center" },
                            { text: y.timeStartEnd.toString(), fontSize: 7, alignment: "center" },
                            { text: y.timeIn !== "Invalid date" ? y.timeIn.toString() : "", fontSize: 7, alignment: "center" },
                            { text: y.timeOut !== "Invalid date" ? y.timeOut.toString() : "", fontSize: 7, alignment: "center" },
                            { text: y.hoursWork.toString(), fontSize: 7, alignment: "right" },
                            { text: y.late.toString(), fontSize: 7, alignment: "right" },
                            { text: y.UT.toString(), fontSize: 7, alignment: "right" },
                            { text: y.OT.toString(), fontSize: 7, alignment: "right" },
                            { text: y.remarks !== "OT For Approval" ? y.remarks.toString() : "", fontSize: 7, alignment: "center" },
                            { text: y.reason.toString(), fontSize: 7, alignment: "left" }
                        ],
                    ],
                    lineHeight: 2
                },
            });
        });

        document.content.push({
            margin: [0, 5],
            widths: [10, 10, 'auto', 'auto'],
            columns: [
                [
                    { text: "Hours Work: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Late: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Undertime: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Overtime: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Restday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Restday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Regular Holiday: ", fontSize: 9, bold: true, lineHeight: 1, },
                ],
                [

                    { text: e.totalHoursWork.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalLate.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalUT.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalOT.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalRestday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalRestdayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHoliday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                ],
                [
                    { text: "Regular Holiday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Regular Holiday Restday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Regular Holiday Restday OT: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday Restday: ", fontSize: 9, bold: true, lineHeight: 1, },
                    { text: "Special Holiday Restday OT:", fontSize: 9, bold: true, lineHeight: 1, },
                ],
                [
                    { text: e.totalHolidayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHoliday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHolidayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHolidayRestday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalHolidayRestdayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHolidayRestday.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                    { text: e.totalSpecialHolidayRestdayOt.toString(), fontSize: 9, bold: true, lineHeight: 1, },
                ],
            ],
            columnGap: 10
        });

        pdfMake.tableLayouts = {
            exampleLayout: {
                hLineWidth: function (i, node) {
                    if (i === 0 || i === node.table.body.length) {
                        return 0;
                    }
                    return (i === node.table.headerRows) ? 2 : 1;
                },
                vLineWidth: function (i) {
                    return 0;
                },
                hLineColor: function (i) {
                    return i === 1 ? 'black' : '#aaa';
                },
                paddingLeft: function (i) {
                    return i === 0 ? 0 : 8;
                },
                paddingRight: function (i, node) {
                    return (i === node.table.widths.length - 1) ? 0 : 8;
                }
            }
        };

        // pdfMake.createPdf(document).download();
        pdfMake.createPdf(document).print({}, window.frames['printPdf']);
    }

    function TypeOption() {
        var list = [
            { label: "Full Month", value: "Full Month" },
            { label: "1st Half", value: "1st Half" },
            { label: "2nd Half", value: "2nd Half" },
        ];

        return list;
    }

    return (
        <div className={classes.root}>

            <ToastContainer />
            {/* <Button
                size="large"
                style={{ float: 'left' }}
                variant="contained"
                color="default"
                startIcon={<Add />}
                onClick={() => setAddModal(true)}>Import Logs</Button> */}

            <div style={{
                float: 'right', width: '30%', zIndex: 100,
            }}>
                <Select
                    defaultValue={selectedEmployee}
                    options={EmployeeOption(employeeOptionsList)}
                    onChange={e => setSelectedEmployee(e)}
                    placeholder='Search...'
                    isClearable
                    isMulti
                    theme={(theme) => ({
                        ...theme,
                        // borderRadius: 0,
                        colors: {
                            ...theme.colors,
                            text: 'black',
                            primary25: '#66c0f4',
                            primary: '#B9B9B9',
                        },
                    })}
                    styles={customSelectStyle}
                />
            </div>

            <TextField
                id="date"
                label="To Date"
                type="date"
                variant="outlined"
                size="small"
                defaultValue={moment().format("DD/MM/yyyy")}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className={classes.textField}
                InputLabelProps={{
                    shrink: true,
                }}
                style={{ float: 'right', marginRight: 10 }}
            />
            <TextField
                id="date"
                label="From Date"
                type="date"
                variant="outlined"
                size="small"
                defaultValue={moment().startOf('month').format("DD/MM/yyyy")}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className={classes.textField}
                InputLabelProps={{
                    shrink: true,
                }}
                style={{ float: 'right', marginRight: 10 }}
            />
            <div style={{
                float: 'right', width: '15%', zIndex: 100, marginRight: 10
            }}>
                <Select
                    defaultValue={selectedType}
                    options={TypeOption()}
                    onChange={e => setSelectedType(e)}
                    placeholder='Type'
                    theme={(theme) => ({
                        ...theme,
                        // borderRadius: 0,
                        colors: {
                            ...theme.colors,
                            text: 'black',
                            primary25: '#66c0f4',
                            primary: '#B9B9B9',
                        },
                    })}
                    styles={customSelectStyle}
                />
            </div>

            <div style={{ padding: 10, backgroundColor: '#F4F4F4', marginTop: 60, height: '100', minHeight: '65vh', maxHeight: '65vh', overflowY: 'scroll' }}>
                <Grid container spacing={3}>
                    {logList.length !== 0 && loader !== true && logList.map(x =>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Button
                                        size="small"
                                        style={{ float: 'right' }}
                                        variant="contained"
                                        color="default"
                                        startIcon={<Print />}
                                        onClick={() => exportToPDF(x)}>Print Payslip</Button>

                                    <Typography style={{ fontSize: 14 }} color="textSecondary" gutterBottom>
                                        {x.employeeNo}
                                    </Typography>
                                    <Typography variant="h5" component="h2">
                                        {x.employeeName}
                                    </Typography>
                                    <Typography variant="h5" component="h2" style={{ float: 'right' }}>
                                        {"Period Covered: " + moment(fromDate).format("MMM DD, yyyy") + " - " + moment(toDate).format("MMM DD, yyyy")}
                                    </Typography>
                                    <Typography color="textSecondary">
                                        {x.department}
                                    </Typography>

                                    <div style={{ padding: 10, backgroundColor: '#F4F4F4', marginTop: 10, height: '100%', minHeight: '43vh', maxHeight: '43vh', overFlowY: 'auto' }}>
                                        <Grid container spacing={3}>
                                            {x.earnings.map(i =>
                                                <Grid item xs={6}>
                                                    <Chip
                                                        label={<Typography style={{ fontSize: 21, textAlign: 'center' }}><b>Earnings</b></Typography>}
                                                        color="default"
                                                        style={{ display: 'flex', justifyContent: 'flex-center', backgroundColor: '#1BFF00' }}
                                                    />

                                                    <Grid container spacing={3}>
                                                        <Grid item xs={6}>
                                                            <Typography style={{ fontSize: 16 }}><b>Basic: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Absenses/Tardiness: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Allowance: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Overtime: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Rest Day: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Rest Day OT: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Regular Holiday: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Regular Holiday OT: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Special Holiday: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Special Holiday OT: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Regular Holiday Rest Day: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Regular Holiday Rest Day OT: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Special Holiday Rest Day: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Special Holiday Rest Day OT: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>13th Month: </b></Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.basic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.absensesTardiness.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.allowance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.overtime.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.restday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.restdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.holiday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.holidayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.sh.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.shOt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.holidayRestday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.holidayRestdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.specialHolidayRestday.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.specialHolidayRestdayOT.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{i.tMonthPay.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                        </Grid>
                                                    </Grid>

                                                    <br />
                                                    <Typography style={{ fontSize: 18 }}><b>Total Earnings: {x.totalEarnings.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                </Grid>
                                            )}
                                            {x.deductions.map(j =>
                                                <Grid item xs={6}>
                                                    <Chip
                                                        label={<Typography style={{ fontSize: 21, textAlign: 'center' }}><b>Deductions</b></Typography>}
                                                        color="default"
                                                        style={{ display: 'flex', justifyContent: 'flex-center', backgroundColor: '#E60C0C' }}
                                                    />

                                                    <Grid container spacing={3}>
                                                        <Grid item xs={4}>
                                                            <Typography style={{ fontSize: 16 }}><b>SSS: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>PHIC: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>HDMF: </b></Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography style={{ fontSize: 16 }}><b>{j.sss.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{j.phic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{j.hdmf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                        </Grid>
                                                    </Grid>

                                                    <br />

                                                    <Typography style={{ fontSize: 21, textAlign: 'left' }}><b>Other Deductions</b></Typography>
                                                    <Grid container spacing={3}>
                                                        <Grid item xs={4}>
                                                            <Typography style={{ fontSize: 16 }}><b>SSS Loan: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>PAG-IBIG Loan: </b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>Care Health Plus: </b></Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography style={{ fontSize: 16 }}><b>{j.sssLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{j.pagibigLoan.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                            <Typography style={{ fontSize: 16 }}><b>{j.careHealthPlus.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                        </Grid>
                                                    </Grid>

                                                    <br /><br />
                                                    <Typography style={{ fontSize: 18 }}><b>Total Deductions: {x.totalDeduction.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </div>
                                </CardContent>

                                <CardActions>
                                    <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Typography style={{ fontSize: 20, }}><b>Net Pay: {x.netPayMetalAsia.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</b></Typography>
                                    </div>
                                </CardActions>
                            </Card>
                        </Grid>
                    )}
                </Grid>
                {loader === true &&
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }}>
                        <CircularProgress />
                    </div>
                }
                {logList.length === 0 && loader !== true &&
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }}>
                        <h1 style={{ color: '#C4C4C4C4' }}>No Data Found</h1>
                    </div>
                }
            </div>

            {Object.keys(selectedEmployee).length === 0 &&
                <TablePagination
                    // rowsPerPageOptions={[10, 25, 100]}
                    labelRowsPerPage=''
                    rowsPerPageOptions={[]}
                    component="div"
                    count={totalEmployee}
                    rowsPerPage={5}
                    page={page}
                    onChangePage={handleChangePage}
                // onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            }
        </div >
    );
}

export default Payroll;