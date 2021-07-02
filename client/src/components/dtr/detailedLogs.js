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


const DetailedLogs = () => {
    const classes = useStyles();
    const [loader, setLoader] = useState(false);
    const [logData, setLogData] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [fromDate, setFromDate] = useState(moment().startOf('month').format('MM/DD/yyyy'));
    const [toDate, setToDate] = useState(moment().format('MM/DD/yyyy'));
    const [totalEmployee, setTotalEmployee] = useState(0);
    const [page, setPage] = useState(0);

    useEffect(() => {
        var data = {
            selectedDetailedLogs: !selectedEmployee ? [] : selectedEmployee,
            fromDate: fromDate,
            toDate: toDate,
            page: page
        };
        var route = "timeLogs/detailed-list";
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
    }, [selectedEmployee, page, loader, toDate, fromDate]);

    const logList = logData
        ? logData.map((x) => ({
            id: x._id,
            employeeNo: x.employeeNo,
            employeeName: x.employeeName,
            department: x.department,
            timeLogs: x.timeLogs,
            totalHoursWork: x.totalHoursWork,
            totalRestday: x.totalRestday,
            totalHoliday: x.totalHoliday,
            totalSpecialHoliday: x.totalSpecialHoliday,
            totalLate: x.totalLate,
            totalUT: x.totalUT,
            totalOT: x.totalOT,
            totalAbsent: x.totalAbsent,
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
                    value: x.employeeNo,
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

    const handleImportLogs = (file) => {
        var selectedFile = file[0];
        var reader = new FileReader();
        const rABS = !!reader.readAsBinaryString;

        reader.onload = function (e) {
            var data = e.target.result;
            const wb = XLSX.read(data, { type: rABS ? "binary" : "array" });
            // wb.SheetNames[0].foreach(function(sheetName) {
            //     var XL_row_object = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
            //     var json_object = JSON.stringify(XL_row_object);
            //     alert(json_object);
            // })
            var sheet_name_list = wb.SheetNames[0];
            var jsonFromExcel = XLSX.utils.sheet_to_csv(wb.Sheets[sheet_name_list], {
                raw: false,
                dateNF: "MM-DD-YYYY",
                header: 1,
                defval: ""
            })
            var lines = jsonFromExcel.split("\n");

            var result = [];

            var headers = lines[0].split(",");

            for (var i = 1; i < lines.length; i++) {
                var obj = {};
                var currentline = lines[i].split(",");

                for (var j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }

                if (obj.EnNo && obj.DaiGong) {
                    result.push(obj);
                }
            }
            // alert(JSON.stringify(result));

            var route = `timeLogs/import`;
            var url = window.apihost + route;
            var token = sessionStorage.getItem("auth-token");

            var data = {
                data: result
            };

            setLoader(true);

            axios
                .post(url, data, {
                    headers: {
                        "auth-token": token,
                    },
                })
                .then(function (response) {
                    // handle success
                    toast.success(response.data.logs, {
                        position: "top-center"
                    });
                    setAddModal(false);
                    setLoader(false);
                })
                .catch(function (error) {
                    // handle error
                    toast.error(JSON.stringify(error.response.data), {
                        position: "top-center"
                    });
                    setLoader(false);
                })
                .finally(function () {
                    // always executed
                });
        };

        reader.onerror = function (err) {
            alert("File could not be read! Code " + err.target.error.code);
        };

        reader.readAsBinaryString(selectedFile);
    }

    const handleCloseAddModal = () => {
        setAddModal(false);
    }

    const exportToPDF = (e) => {
        const document = {
            content: [
                { image: 'unimore', width: 180, height: 60 },
                { text: e.employeeName, fontStyle: 15, bold: true, lineHeight: 1 },
                { text: e.department, fontStyle: 15, bold: true, lineHeight: 1 },
            ],
            images: {
                unimore: 'https://i.ibb.co/mTwt2jt/unimore-logo-back-black.png'
            }
        }
        document.content.push({
            // layout: 'lightHorizontalLines',
            table: {
                headerRows: 1,
                widths: ['*', 50, '*', '*', '*', 35, 30, 30, 100],
                body: [
                    //Data
                    //Header
                    [
                        { text: 'Day', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'Date', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'In', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'Out', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'Hours Work', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'Late', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'UT', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'OT', bold: true, fontSize: 11, alignment: "center" },
                        { text: 'Remarks', bold: true, fontSize: 11, alignment: "center" }
                    ],
                ]
            },
        });

        e.timeLogs.forEach(y => {
            document.content.push({
                // layout: 'lightHorizontalLines',
                table: {
                    headerRows: 1,
                    widths: ['*', 50, '*', '*', '*', 35, 30, 30, 100],
                    body: [
                        //Data
                        [
                            { text: y.day.toString(), fontSize: 9, alignment: "center" },
                            { text: moment(y.dateTime).format("MM/DD/yyyy").toString(), fontSize: 9, alignment: "center" },
                            { text: y.timeIn !== "Invalid date" ? y.timeIn.toString() : "", fontSize: 9, alignment: "center" },
                            { text: y.timeOut !== "Invalid date" ? y.timeIn.toString() : "", fontSize: 9, alignment: "center" },
                            { text: y.hoursWork.toString(), fontSize: 9, alignment: "right" },
                            { text: y.late.toString(), fontSize: 9, alignment: "right" },
                            { text: y.UT.toString(), fontSize: 9, alignment: "right" },
                            { text: y.OT.toString(), fontSize: 9, alignment: "right" },
                            { text: y.remarks.toString(), fontSize: 9, alignment: "center" }
                        ],
                    ],
                    lineHeight: 2
                },
            });
        });

        var totalhrswrk = "Total Hours Work: " + e.totalHoursWork;
        var totalRestdayHrsWrk = "Total Restday Hours Work: " + e.totalRestday;
        var totalHoliday = "Total Holiday Hours Work: " + e.totalHoliday;
        var totalSh = "Total Special Holiday Hours Work: " + e.totalSpecialHoliday;
        var totalUT = "Total UT: " + e.totalUT;
        var totalOT = "Total OT: " + e.totalOT;
        var totalLate = "Total Late: " + e.totalLate;
        var totalAbsent = "Total Absent: " + e.totalAbsent;

        document.content.push([
                { text: totalhrswrk, fontStyle: 9, bold: true, lineHeight: 1, },
                { text: totalRestdayHrsWrk, fontStyle: 9, bold: true, lineHeight: 1, },
                { text: totalHoliday, fontStyle: 9, bold: true, lineHeight: 1, },
                { text: totalSh, fontStyle: 9, bold: true, lineHeight: 1, },
                { text: totalUT, fontStyle: 9, bold: true, lineHeight: 1, },
                { text: totalOT, fontStyle: 9, bold: true, lineHeight: 1, },
                { text: totalLate, fontStyle: 9, bold: true, lineHeight: 1, },
                { text: totalAbsent, fontStyle: 9, bold: true, lineHeight: 1, },
        ]);

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
                                        onClick={() => exportToPDF(x)}>Print Logs</Button>

                                    <Typography style={{ fontSize: 14 }} color="textSecondary" gutterBottom>
                                        {x.employeeNo}
                                    </Typography>
                                    <Typography variant="h5" component="h2">
                                        {x.employeeName}
                                    </Typography>
                                    <Typography color="textSecondary">
                                        {x.department}
                                    </Typography>

                                    <div style={{ padding: 10, backgroundColor: '#F4F4F4', marginTop: 10, height: '100%', minHeight: '40vh', maxHeight: '40vh', overFlowY: 'auto' }}>
                                        <TableContainer className={classes.tbcontainer}>
                                            <Table stickyHeader aria-label="sticky table">
                                                <TableHead>
                                                    <TableRow>
                                                        <StyledTableCell>Time In</StyledTableCell>
                                                        <StyledTableCell>Time Out</StyledTableCell>
                                                        <StyledTableCell>Time Start / End</StyledTableCell>
                                                        <StyledTableCell>Date</StyledTableCell>
                                                        <StyledTableCell>Day</StyledTableCell>
                                                        <StyledTableCell>Hours Work</StyledTableCell>
                                                        <StyledTableCell>Late</StyledTableCell>
                                                        <StyledTableCell>UT</StyledTableCell>
                                                        <StyledTableCell>OT</StyledTableCell>
                                                        <StyledTableCell>Remarks</StyledTableCell>
                                                    </TableRow>
                                                </TableHead>
                                                {x.timeLogs.map(y =>
                                                    <TableBody>
                                                        <StyledTableRow hover role="checkbox" tabIndex={-1} key={y.id}>
                                                            <StyledTableCell>
                                                                {y.timeIn !== "Invalid date" ? y.timeIn : ""}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.timeOut !== "Invalid date" ? y.timeOut : ""}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.timeStartEnd}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {moment(y.dateTime).format("MMM DD, yyyy")}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.day}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.hoursWork}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.late}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.UT}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.OT}
                                                            </StyledTableCell>
                                                            <StyledTableCell>
                                                                {y.remarks}
                                                            </StyledTableCell>
                                                        </StyledTableRow>
                                                    </TableBody>
                                                )}
                                            </Table>
                                        </TableContainer>
                                    </div>
                                </CardContent>
                                <CardActions>
                                    <Grid container spacing={3}>
                                        <Grid item xs={3}>
                                            <Typography style={{ fontSize: 18 }}><b>Total Hours Work: {x.totalHoursWork}</b></Typography>
                                            <Typography style={{ fontSize: 18 }}><b>Total Overtime: {x.totalOT}</b></Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography style={{ fontSize: 18 }}><b>Total Restday Hours Works: {x.totalRestday}</b></Typography>
                                            <Typography style={{ fontSize: 18 }}><b>Total Late: {x.totalLate}</b></Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography style={{ fontSize: 18 }}><b>Total Holiday Hours Works: {x.totalHoliday}</b></Typography>
                                            <Typography style={{ fontSize: 18 }}><b>Total Undertime: {x.totalUT}</b></Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography style={{ fontSize: 18 }}><b>Total SH Hours Works: {x.totalSpecialHoliday}</b></Typography>
                                            <Typography style={{ fontSize: 18 }}><b>Total Absent: {x.totalAbsent}</b></Typography>
                                        </Grid>
                                    </Grid>
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

            <DropzoneDialog
                open={addModal}
                // onSave={this.handleSave.bind(this)}
                onSave={e => handleImportLogs(e)}
                // acceptedFiles={['image/jpeg', 'image/png', 'image/bmp']}
                acceptedFiles={['.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel']}
                showPreviews={true}
                filesLimit={1}
                showFileNames={true}
                maxFileSize={5000000}
                onClose={handleCloseAddModal}
            />
        </div >
    );
}

export default DetailedLogs;