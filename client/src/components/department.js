import React, { useState, useEffect } from 'react';
import { Layout, Breadcrumb, Row, Col, Card, Button, Empty, Modal, Input, TimePicker, message, Table, Switch } from 'antd';
import {
    EditFilled,
    DeleteFilled,
    WarningOutlined,
    CloseCircleFilled,
    SaveFilled
} from '@ant-design/icons';
import Select from 'react-select';
import 'antd/dist/antd.css'
import Draggable from 'react-draggable';
const moment = require("moment");
const axios = require("axios");

const { Content } = Layout;

const customSelectStyle = {
    control: base => ({
        ...base,
        // height: 40,
        // minHeight: 40,
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

const Department = () => {
    const [departmentData, setDepartmenetData] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState([]);
    const [modal, setModal] = useState(false);
    const [id, setId] = useState(-1);
    const [department, setDepartment] = useState('');
    const [loader, setLoader] = useState(false);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const [disabled, setDisabled] = useState(true);
    const [deletePopup, setDeletePopup] = useState(false);
    const [departmentOption, setDepartmentOption] = useState(null);
    const [editDept, setEditDept] = useState(false);
    const [mondayTS, setMondayTS] = useState('');
    const [mondayTE, setMondayTE] = useState('');
    const [tuesdayTS, setTuesdayTS] = useState('');
    const [tuesdayTE, setTuesdayTE] = useState('');
    const [wednesdayTS, setWednesdayTS] = useState('');
    const [wednesdayTE, setWednesdayTE] = useState('');
    const [thursdayTS, setThursdayTS] = useState('');
    const [thursdayTE, setThursdayTE] = useState('');
    const [fridayTS, setFridayTS] = useState('');
    const [fridayTE, setFridayTE] = useState('');
    const [saturdayTS, setSaturdayTS] = useState('');
    const [saturdayTE, setSaturdayTE] = useState('');
    const [dayNightSwitch, setDayNightSwitch] = useState(true);

    useEffect(() => {
        var data = selectedDepartment;
        console.log(JSON.stringify(data));
        var route = "department/list";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setDepartmenetData(response.data);
                    console.log(JSON.stringify(response.data));
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setDepartmenetData(obj);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [selectedDepartment, loader]);

    const departmentList = departmentData
        ? departmentData.map((x) => ({
            id: x._id,
            department: x.department,
            timePerDay: x.timePerDay,
            dayNightShift: x.dayNightShift
            // timeStart: x.timeStart,
            // timeEnd: x.timeEnd
        }))
        : [];

    useEffect(() => {
        var route = "department/options";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        axios
            .get(url)
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setDepartmentOption(response.data);
                    console.log(JSON.stringify(response.data));
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setDepartmentOption(obj);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [departmentOption, selectedDepartment]);

    const timeTable = [
        {
            title: 'Day',
            width: 10,
            dataIndex: 'day',
            key: 'day',
            render: (text, data) => departmentData.length >= 1 ? (
                <>
                    {data.day}
                </>
            ) : null,
        },
        {
            title: 'Time Start',
            width: 10,
            dataIndex: 'ts',
            key: 'ts',
            render: (text, data) => departmentData.length >= 1 ? (
                <>
                    {data.timeStart !== '' ? data.timeStart : ""}
                </>
            ) : null,
        },
        {
            title: 'Time End',
            width: 10,
            dataIndex: 'te',
            key: 'te',
            // fixed: 'left',
            render: (text, data) => departmentData.length >= 1 ? (
                <>
                    {data.timeEnd !== "" ? data.timeEnd : ""}
                </>
            ) : null,
        },
    ]

    const timeEditTable = [
        {
            title: 'Day',
            width: 10,
            dataIndex: 'day',
            key: 'day',
            render: (text, data) => departmentData.length >= 1 ? (
                <>
                    {data.day}
                </>
            ) : null,
        },
        {
            title: 'Time Start',
            width: 10,
            dataIndex: 'ts',
            key: 'ts',
            render: (text, data) => departmentData.length >= 1 ? (
                <>
                    {editDept === true && data.day === "Monday" &&
                        <TimePicker allowClear={false} defaultValue={mondayTS !== "" ? moment(mondayTS, "h:mm A") : ""} value={mondayTS !== "" ? moment(mondayTS, "h:mm A") : "" } format="h:mm A" onChange={handleMonTimeStart} onSelect={e => handleMonTimeStart("", e)} />
                    }
                    {editDept === true && data.day === "Tuesday" &&
                        <TimePicker allowClear={false} defaultValue={tuesdayTS !== "" ? moment(tuesdayTS, "h:mm A") : ""} value={tuesdayTS !== "" ? moment(tuesdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleTueTimeStart} onSelect={e => handleTueTimeStart("", e)} />
                    }
                    {editDept === true && data.day === "Wednesday" &&
                        <TimePicker allowClear={false} defaultValue={wednesdayTS !== "" ? moment(wednesdayTS, "h:mm A") : ""} value={wednesdayTS !== "" ? moment(wednesdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleWedTimeStart} onSelect={e => handleWedTimeStart("", e)} />
                    }
                    {editDept === true && data.day === "Thursday" &&
                        <TimePicker allowClear={false} defaultValue={thursdayTS !== "" ? moment(thursdayTS, "h:mm A") : ""} value={thursdayTS !== "" ? moment(thursdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleThuTimeStart} onSelect={e => handleThuTimeStart("", e)} />
                    }
                    {editDept === true && data.day === "Friday" &&
                        <TimePicker allowClear={false} defaultValue={fridayTS !== "" ? moment(fridayTS, "h:mm A") : ""} value={fridayTS !== "" ? moment(fridayTS, "h:mm A") : ""} format="h:mm A" onChange={handleFriTimeStart} onSelect={e => handleFriTimeStart("", e)} />
                    }
                    {editDept === true && data.day === "Saturday" &&
                        <TimePicker allowClear={false} defaultValue={saturdayTS !== "" ? moment(saturdayTS, "h:mm A") : ""} value={saturdayTS !== "" ? moment(saturdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleSatTimeStart} onSelect={e => handleSatTimeStart("", e)} />
                    }
                </>
            ) : null,
        },
        {
            title: 'Time End',
            width: 10,
            dataIndex: 'te',
            key: 'te',
            // fixed: 'left',
            render: (text, data) => departmentData.length >= 1 ? (
                <>
                    {editDept === true && data.day === "Monday" &&
                        <TimePicker allowClear={false} defaultValue={mondayTE !== "" ? moment(mondayTE, "h:mm A") : ""} value={mondayTE !== "" ? moment(mondayTE, "h:mm A") : ""} format="h:mm A" onChange={handleMonTimeEnd} onSelect={e => handleMonTimeEnd("", e)} />
                    }
                    {editDept === true && data.day === "Tuesday" &&
                        <TimePicker allowClear={false} defaultValue={tuesdayTE !== "" ? moment(tuesdayTE, "h:mm A") : ""} value={tuesdayTE !== "" ? moment(tuesdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleTueTimeEnd} onSelect={e => handleTueTimeEnd("", e)} />
                    }
                    {editDept === true && data.day === "Wednesday" &&
                        <TimePicker allowClear={false} defaultValue={wednesdayTE !== "" ? moment(wednesdayTE, "h:mm A") : ""} value={wednesdayTE !== "" ? moment(wednesdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleWedTimeEnd} onSelect={e => handleWedTimeEnd("", e)} />
                    }
                    {editDept === true && data.day === "Thursday" &&
                        <TimePicker allowClear={false} defaultValue={thursdayTE !== "" ? moment(thursdayTE, "h:mm A") : ""} value={thursdayTE !== "" ? moment(thursdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleThuTimeEnd} onSelect={e => handleThuTimeEnd("", e)} />
                    }
                    {editDept === true && data.day === "Friday" &&
                        <TimePicker allowClear={false} defaultValue={fridayTE !== "" ? moment(fridayTE, "h:mm A") : ""} value={fridayTE !== "" ? moment(fridayTE, "h:mm A") : ""} format="h:mm A" onChange={handleFriTimeEnd} onSelect={e => handleFriTimeEnd("", e)} />
                    }
                    {editDept === true && data.day === "Saturday" &&
                        <TimePicker allowClear={false} defaultValue={saturdayTE !== "" ? moment(saturdayTE, "h:mm A") : ""} value={saturdayTE !== "" ? moment(saturdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleSatTimeEnd} onSelect={e => handleSatTimeEnd("", e)} />
                    }
                </>
            ) : null,
        },
    ]

    const timeAddTable = [
        {
            title: 'Day',
            width: 10,
            dataIndex: 'day',
            key: 'day',
            render: (text, data) => (
                <>
                    {data.day}
                </>
            ),
        },
        {
            title: 'Time Start',
            width: 10,
            dataIndex: 'ts',
            key: 'ts',
            render: (text, data) => (
                <>
                    {data.day === "Monday" &&
                        <TimePicker allowClear={false} defaultValue={mondayTS !== "" ? moment(mondayTS, "h:mm A") : ""} value={mondayTS !== "" ? moment(mondayTS, "h:mm A") : "" } format="h:mm A" onChange={handleMonTimeStart} onSelect={e => handleMonTimeStart("", e)} />
                    }
                    {data.day === "Tuesday" &&
                        <TimePicker allowClear={false} defaultValue={tuesdayTS !== "" ? moment(tuesdayTS, "h:mm A") : ""} value={tuesdayTS !== "" ? moment(tuesdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleTueTimeStart} onSelect={e => handleTueTimeStart("", e)} />
                    }
                    {data.day === "Wednesday" &&
                        <TimePicker allowClear={false} defaultValue={wednesdayTS !== "" ? moment(wednesdayTS, "h:mm A") : ""} value={wednesdayTS !== "" ? moment(wednesdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleWedTimeStart} onSelect={e => handleWedTimeStart("", e)} />
                    }
                    {data.day === "Thursday" &&
                        <TimePicker allowClear={false} defaultValue={thursdayTS !== "" ? moment(thursdayTS, "h:mm A") : ""} value={thursdayTS !== "" ? moment(thursdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleThuTimeStart} onSelect={e => handleThuTimeStart("", e)} />
                    }
                    {data.day === "Friday" &&
                        <TimePicker allowClear={false} defaultValue={fridayTS !== "" ? moment(fridayTS, "h:mm A") : ""} value={fridayTS !== "" ? moment(fridayTS, "h:mm A") : ""} format="h:mm A" onChange={handleFriTimeStart} onSelect={e => handleFriTimeStart("", e)} />
                    }
                    {data.day === "Saturday" &&
                        <TimePicker allowClear={false} defaultValue={saturdayTS !== "" ? moment(saturdayTS, "h:mm A") : ""} value={saturdayTS !== "" ? moment(saturdayTS, "h:mm A") : ""} format="h:mm A" onChange={handleSatTimeStart} onSelect={e => handleSatTimeStart("", e)} />
                    }
                </>
            ),
        },
        {
            title: 'Time End',
            width: 10,
            dataIndex: 'te',
            key: 'te',
            // fixed: 'left',
            render: (text, data) => (
                <>
                    {data.day === "Monday" &&
                        <TimePicker allowClear={false} defaultValue={mondayTE !== "" ? moment(mondayTE, "h:mm A") : ""} value={mondayTE !== "" ? moment(mondayTE, "h:mm A") : ""} format="h:mm A" onChange={handleMonTimeEnd} onSelect={e => handleMonTimeEnd("", e)} />
                    }
                    {data.day === "Tuesday" &&
                        <TimePicker allowClear={false} defaultValue={tuesdayTE !== "" ? moment(tuesdayTE, "h:mm A") : ""} value={tuesdayTE !== "" ? moment(tuesdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleTueTimeEnd} onSelect={e => handleTueTimeEnd("", e)} />
                    }
                    {data.day === "Wednesday" &&
                        <TimePicker allowClear={false} defaultValue={wednesdayTE !== "" ? moment(wednesdayTE, "h:mm A") : ""} value={wednesdayTE !== "" ? moment(wednesdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleWedTimeEnd} onSelect={e => handleWedTimeEnd("", e)} />
                    }
                    {data.day === "Thursday" &&
                        <TimePicker allowClear={false} defaultValue={thursdayTE !== "" ? moment(thursdayTE, "h:mm A") : ""} value={thursdayTE !== "" ? moment(thursdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleThuTimeEnd} onSelect={e => handleThuTimeEnd("", e)} />
                    }
                    {data.day === "Friday" &&
                        <TimePicker allowClear={false} defaultValue={fridayTE !== "" ? moment(fridayTE, "h:mm A") : ""} value={fridayTE !== "" ? moment(fridayTE, "h:mm A") : ""} format="h:mm A" onChange={handleFriTimeEnd} onSelect={e => handleFriTimeEnd("", e)} />
                    }
                    {data.day === "Saturday" &&
                        <TimePicker allowClear={false} defaultValue={saturdayTE !== "" ? moment(saturdayTE, "h:mm A") : ""} value={saturdayTE !== "" ? moment(saturdayTE, "h:mm A") : ""} format="h:mm A" onChange={handleSatTimeEnd} onSelect={e => handleSatTimeEnd("", e)} />
                    }
                </>
            ),
        },
    ]

    const option = departmentOption
        ? departmentOption.map((x) => ({
            id: x._id,
            department: x.department,
        }))
        : [];

    const handleOpenModal = () => {
        setModal(true);
    }

    const handleCloseModal = () => {
        setModal(false);
        setId(-1);
        setDepartment('');
        setMondayTS('');
        setMondayTE('');
        setTuesdayTS('');
        setTuesdayTE('');
        setWednesdayTS('');
        setWednesdayTE('');
        setThursdayTS('');
        setThursdayTE('');
        setFridayTS('');
        setFridayTE('');
        setSaturdayTS('');
        setSaturdayTE('');
        setDayNightSwitch(true);
    }

    const handleAddDepartment = () => {
        var route = "department/";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            department: department,
            dayNightShift: dayNightSwitch,
            timePerDay: [
                { day: "Monday", timeStart: mondayTS, timeEnd: mondayTE },
                { day: "Tuesday", timeStart: tuesdayTS, timeEnd: tuesdayTE },
                { day: "Wednesday", timeStart: wednesdayTS, timeEnd: wednesdayTE },
                { day: "Thursday", timeStart: thursdayTS, timeEnd: thursdayTE },
                { day: "Friday", timeStart: fridayTS, timeEnd: fridayTE },
                { day: "Saturday", timeStart: saturdayTS, timeEnd: saturdayTE },
            ],
        }

        setLoader(true);
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                message.success(response.data.department + ' successfully saved.', 10);
                setModal(false);
                setLoader(false);
                setId(-1);
                setDepartment('');
                setMondayTS('');
                setMondayTE('');
                setTuesdayTS('');
                setTuesdayTE('');
                setWednesdayTS('');
                setWednesdayTE('');
                setThursdayTS('');
                setThursdayTE('');
                setFridayTS('');
                setFridayTE('');
                setSaturdayTS('');
                setSaturdayTE('');
                setDayNightSwitch(true);
            })
            .catch(function (error) {
                // handle error
                if (error.response.status === 400) {
                    alert(error.response.data);
                } else {
                    alert(error);
                }
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const handleEditDepartment = () => {
        var route = `department/${id}`;
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var timePerDay = [
            { day: "Monday", timeStart: mondayTS, timeEnd: mondayTE },
            { day: "Tuesday", timeStart: tuesdayTS, timeEnd: tuesdayTE },
            { day: "Wednesday", timeStart: wednesdayTS, timeEnd: wednesdayTE },
            { day: "Thursday", timeStart: thursdayTS, timeEnd: thursdayTE },
            { day: "Friday", timeStart: fridayTS, timeEnd: fridayTE },
            { day: "Saturday", timeStart: saturdayTS, timeEnd: saturdayTE },
        ];

        var data = {
            department: department,
            dayNightShift: dayNightSwitch,
            timePerDay: JSON.stringify(timePerDay)
        }

        setLoader(true);
        axios
            .put(url, data)
            .then(function (response) {
                // handle success
                message.success(response.data.department + ' successfully edited.', 10);
                setModal(false);
                setLoader(false);
                setEditDept(false);
                setId(-1);
                setDepartment('');
                setMondayTS('');
                setMondayTE('');
                setTuesdayTS('');
                setTuesdayTE('');
                setWednesdayTS('');
                setWednesdayTE('');
                setThursdayTS('');
                setThursdayTE('');
                setFridayTS('');
                setFridayTE('');
                setSaturdayTS('');
                setSaturdayTE('');
                setDayNightSwitch(true);
            })
            .catch(function (error) {
                // handle error
                alert(error);
                setLoader(false);
                // setEditDept(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const draggleRef = React.createRef();

    const onStart = (event, uiData) => {
        const { clientWidth, clientHeight } = window?.document?.documentElement;
        const targetRect = draggleRef?.current?.getBoundingClientRect();
        setBounds({
            left: -targetRect?.left + uiData?.x,
            right: clientWidth - (targetRect?.right - uiData?.x),
            top: -targetRect?.top + uiData?.y,
            bottom: clientHeight - (targetRect?.bottom - uiData?.y),
        });
    };

    function handleMonTimeStart(time, timeString) {
        setMondayTS(moment(timeString).format("h:mm A"));
    }

    function handleMonTimeEnd(time, timeString) {
        setMondayTE(moment(timeString).format("h:mm A"));
    }

    function handleTueTimeStart(time, timeString) {
        setTuesdayTS(moment(timeString).format("h:mm A"))
    }

    function handleTueTimeEnd(time, timeString) {
        setTuesdayTE(moment(timeString).format("h:mm A"));
    }

    function handleWedTimeStart(time, timeString) {
        setWednesdayTS(moment(timeString).format("h:mm A"))
    }

    function handleWedTimeEnd(time, timeString) {
        setWednesdayTE(moment(timeString).format("h:mm A"));
    }

    function handleThuTimeStart(time, timeString) {
        setThursdayTS(moment(timeString).format("h:mm A"))
    }

    function handleThuTimeEnd(time, timeString) {
        setThursdayTE(moment(timeString).format("h:mm A"));
    }

    function handleFriTimeStart(time, timeString) {
        setFridayTS(moment(timeString).format("h:mm A"))
    }

    function handleFriTimeEnd(time, timeString) {
        setFridayTE(moment(timeString).format("h:mm A"));
    }

    function handleSatTimeStart(time, timeString) {
        setSaturdayTS(moment(timeString).format("h:mm A"))
    }

    function handleSatTimeEnd(time, timeString) {
        setSaturdayTE(moment(timeString).format("h:mm A"));
    }

    const onDelete = (value) => {
        setId(value);
        setDeletePopup(true);
    }

    const handleCancelDelete = () => {
        setId(-1);
        setDeletePopup(false);
    }

    const handleDelete = () => {
        // var token = sessionStorage.getItem("auth-token");
        var url = window.apihost + `department/${id}`;
        setLoader(true);
        axios
            .delete(url)
            .then(function (response) {
                // handle success
                if (response.status <= 200) {
                    message.success('Department successfuly deleted!', 10);
                    setId(-1);
                    setLoader(false);
                    setDeletePopup(false);
                }
            })
            .catch((err) => {
                if (err.response.status === 400) {
                    const error = {
                        status: err.response.status,
                        error: err.response.data,
                    };
                    alert(JSON.stringify(error));
                    setLoader(false);
                } else {
                    // alert(err.response.status + JSON.stringify(err.response.data));
                    const error = {
                        status: err.response.status,
                        error: JSON.stringify(err.response.data),
                    };
                    alert(error);
                    setLoader(false);
                }
            });
    };

    function DepartmentOption(item) {
        var list = [];
        if (item !== undefined || item !== null) {
            item.map((x) => {
                var name = x.department
                return list.push({
                    label: name,
                    value: x.id,
                });
            });
        }
        return list;
    }

    const handleEditDept = (x) => {
        var timePerDay = JSON.parse(x.timePerDay);
        setEditDept(true);
        setId(x.id)
        setDepartment(x.department);

        setMondayTS(timePerDay[0].timeStart);
        setMondayTE(timePerDay[0].timeEnd);
        setTuesdayTS(timePerDay[1].timeStart);
        setTuesdayTE(timePerDay[1].timeEnd);
        setWednesdayTS(timePerDay[2].timeStart);
        setWednesdayTE(timePerDay[2].timeEnd);
        setThursdayTS(timePerDay[3].timeStart);
        setThursdayTE(timePerDay[3].timeEnd);
        setFridayTS(timePerDay[4].timeStart);
        setFridayTE(timePerDay[4].timeEnd);
        setSaturdayTS(timePerDay[5].timeStart);
        setSaturdayTE(timePerDay[5].timeEnd);

        setDayNightSwitch(x.dayNightShift);
    }

    const handleCancelEdit = () => {
        setEditDept(false);
        setId(-1);
        setDepartment('');
        setMondayTS('');
        setMondayTE('');
        setTuesdayTS('');
        setTuesdayTE('');
        setWednesdayTS('');
        setWednesdayTE('');
        setThursdayTS('');
        setThursdayTE('');
        setFridayTS('');
        setFridayTE('');
        setSaturdayTS('');
        setSaturdayTE('');

        setDayNightSwitch(true);
    }

    return (
        <Layout className="site-layout">
            <Content style={{ margin: '0 16px', height: '100%' }}>
                <Breadcrumb style={{ margin: '16px 0' }}>
                    <Breadcrumb.Item style={{ fontSize: 20 }}>Department</Breadcrumb.Item>
                </Breadcrumb>

                <div style={{ paddingLeft: 24, paddingRight: 24, }}>
                    <Button size='large' onClick={handleOpenModal}>Add Department</Button>

                    <div style={{
                        float: 'right', width: '24%', zIndex: 100,
                    }}>
                        <Select
                            defaultValue={selectedDepartment}
                            options={DepartmentOption(option)}
                            onChange={e => setSelectedDepartment(e)}
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
                </div>

                <br />

                <div className="site-layout-background" style={{ padding: 24, minHeight: 360, paddingTop: 5 }} onContextMenu={(e) => e.preventDefault()}>
                    {
                        <div className="site-card-wrapper" style={{ backgroundColor: '#F6F6F6', height: '100%', minHeight: '71vh', maxHeight: '71vh', padding: 10, overflow: 'scroll' }}>
                            <Row gutter={16}>
                                {departmentData !== null && departmentList.map(x =>
                                    <Col span={8}>
                                        <Card
                                            title={
                                                <div>
                                                    {id !== x.id &&
                                                        x.department
                                                    }
                                                    {editDept === true && id === x.id &&
                                                        <>
                                                            <Input placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)} />
                                                        </>
                                                    }
                                                </div>
                                            }
                                            actions={[
                                                <div>
                                                    {id !== x.id &&
                                                        <div onClick={() => handleEditDept(x)}>
                                                            <label><EditFilled key="edit" /> EDIT</label>
                                                        </div>
                                                    }
                                                    {editDept === true && id === x.id &&
                                                        <div onClick={handleCancelEdit}>
                                                            <label><CloseCircleFilled key="cancel" /> CANCEL</label>
                                                        </div>
                                                    }
                                                </div>,
                                                <div>
                                                    {id !== x.id &&
                                                        <div onClick={() => onDelete(x.id)}>
                                                            <label><DeleteFilled key="delete" /> DELETE</label>
                                                        </div>
                                                    }
                                                    {editDept === true && id === x.id &&
                                                        <div onClick={handleEditDepartment}>
                                                            <label><SaveFilled key="save" /> SAVE</label>
                                                        </div>
                                                    }
                                                </div>,
                                            ]}
                                            style={{ marginBottom: 20 }}
                                            bordered={false}
                                            hoverable={true}
                                        >
                                            {id !== x.id &&
                                                <div>
                                                    {/*  <b>Time Start: </b> {x.timeStart + " AM"} - <b>Time End:</b> {x.timeEnd + " PM"}  */}
                                                    <Switch checkedChildren="Day" unCheckedChildren="Night" disabled checked={x.dayNightShift} style={{ marginBottom: 10 }} />
                                                    <Table columns={timeTable} size='large' dataSource={JSON.parse(x.timePerDay)} bordered sticky size='middle' pagination={false} />
                                                </div>
                                            }
                                            {id === x.id &&
                                                <div>
                                                    {/*  <b>Time Start: </b> {x.timeStart + " AM"} - <b>Time End:</b> {x.timeEnd + " PM"}  */}
                                                    <Switch checkedChildren="Day" unCheckedChildren="Night" checked={dayNightSwitch} onChange={setDayNightSwitch} style={{ marginBottom: 10 }} />
                                                    <Table columns={timeEditTable} dataSource={JSON.parse(x.timePerDay)} bordered sticky size='middle' pagination={false} />
                                                </div>
                                            }
                                        </Card>
                                    </Col>
                                )}
                                {departmentData === null &&
                                    <div style={{ margin: '0 auto' }}>
                                        <Empty style={{ marginTop: 60 }} />
                                    </div>
                                }
                            </Row>
                        </div>
                    }
                </div>
            </Content>

            <Modal
                title={
                    <div
                        style={{
                            width: '100%',
                            cursor: 'move',
                        }}
                        onMouseOver={() => {
                            if (disabled) {
                                setDisabled(false)
                            }
                        }}
                        onMouseOut={() => {
                            setDisabled(true);
                        }}
                        // fix eslintjsx-a11y/mouse-events-have-key-events
                        // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
                        onFocus={() => { }}
                        onBlur={() => { }}
                    // end
                    >
                        Add Department
            </div>
                }
                visible={modal}
                onOk={handleAddDepartment}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="back" disabled={loader} onClick={handleCloseModal}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" loading={loader} onClick={handleAddDepartment}>
                        Submit
                    </Button>,
                ]}
                modalRender={modal => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        onStart={(event, uiData) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>{modal}</div>
                    </Draggable>
                )}
            >
                <label>
                    Department
                    <Input size='large' placeholder="department" value={department} onChange={e => setDepartment(e.target.value)} />
                </label>
                <div style={{ marginTop: 10 }}>
                    <Switch checkedChildren="Day" unCheckedChildren="Night" checked={dayNightSwitch} onChange={setDayNightSwitch} style={{ marginBottom: 10 }} />
                    <Table columns={timeAddTable} dataSource={[
                        {day: "Monday"},
                        {day: "Tuesday"},
                        {day: "Wednesday"},
                        {day: "Thursday"},
                        {day: "Friday"},
                        {day: "Saturday"}
                    ]} bordered sticky size='middle' pagination={false} />
                </div>
            </Modal>

            <Modal
                visible={deletePopup}
                title="Warning"
                icon={<WarningOutlined style={{ color: "red" }} />}
                onOk={handleDelete}
                onCancel={handleCancelDelete}
                footer={[
                    <Button key="back" onClick={handleCancelDelete} disabled={loader}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" danger color="red" loading={loader} onClick={handleDelete}>
                        Delete
                    </Button>
                ]}
            >
                <p>Are you sure you want to delete this data?</p>
            </Modal>
        </Layout>
    );
}

export default Department;
