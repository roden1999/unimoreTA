import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardActionArea from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TablePagination from '@material-ui/core/TablePagination';
import Input from '@material-ui/core/Input';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import { Save, Edit, Delete, Add } from '@material-ui/icons/';
import { useSpring, animated } from 'react-spring/web.cjs';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { TextField } from '@material-ui/core';

const axios = require("axios");
const moment = require("moment");

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    height: '100%',
    minHeight: '90vh',
    maxHeight: '90vh'
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

const Employee = () => {
  const classes = useStyles();
  const [loader, setLoader] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState(null);
  const [id, setId] = useState(-1);
  const [employeeNo, setEmployeeNo] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [totalEmp, setTotalEmp] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    var data = {
      selectedEmployee: !selectedEmployee ? [] : selectedEmployee,
      page: page
    };
    var route = "employees/list";
    var url = window.apihost + route;
    // var token = sessionStorage.getItem("auth-token");
    // const user = JSON.parse(sessionStorage.getItem('user'));

    axios
      .post(url, data)
      .then(function (response) {
        // handle success
        if (Array.isArray(response.data)) {
          setEmployeeData(response.data);
        } else {
          var obj = [];
          obj.push(response.data);
          setEmployeeData(obj);
        }
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
  }, [page, selectedEmployee, loader]);

  const employeeList = employeeData
    ? employeeData.map((x) => ({
      id: x._id,
      employeeNo: x.employeeNo,
      firstName: x.firstName,
      middleName: x.middleName,
      lastName: x.lastName,
      deptId: x.deptId,
      department: x.department,
      contactNo: x.contactNo,
      gender: x.gender,
      address: x.address,
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
        setTotalEmp(total);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
  }, [employeeOptions, selectedEmployee, loader]);

  useEffect(() => {
    var route = "department/options";
    var url = window.apihost + route;
    var token = sessionStorage.getItem("auth-token");

    axios
      .get(url, {
        headers: { "auth-token": token },
      })
      .then(function (response) {
        // handle success
        if (Array.isArray(response.data)) {
          setDepartmentOptions(response.data);
        } else {
          var obj = [];
          obj.push(response.data);
          setDepartmentOptions(obj);
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

  const departmentOptionsList = departmentOptions
    ? departmentOptions.map((x) => ({
      id: x._id,
      name: x.department,
    }))
    : [];

  function DepartmentOption(item) {
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

  function GenderOption() {
    var list = [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" }
    ];
    return list;
  }



  const handleAddEmployee = () => {
    var route = "employees/";
    var url = window.apihost + route;
    var token = sessionStorage.getItem("auth-token");

    var data = {
      employeeNo: employeeNo,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      department: department ? department.value : "",
      contactNo: contactNo,
      gender: gender ? gender.value : "",
      address: address,
    }

    setLoader(true);

    axios
      .post(url, data, {
        headers: {
          "auth-token": token,
        },
      })
      .then(function (response) {
        // handle success
        toast.success(response.data.employee + ' successfully saved.', {
          position: "top-center"
        });
        setAddModal(false);
        setLoader(false);
        setId(-1);
        setEmployeeNo("");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setDepartment("");
        setGender("");
        setContactNo("");
        setGender("");
        setAddress("");
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
  }

  const handleCloseAddModal = () => {
    setAddModal(false);
    setEmployeeNo("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDepartment("");
    setGender("");
    setContactNo("");
    setAddress("");
  }

  const handleEditEmployee = () => {
    var route = `employees/${id}`;
    var url = window.apihost + route;
    var token = sessionStorage.getItem("auth-token");

    var data = {
      // id: id,
      employeeNo: employeeNo,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      department: department ? department.value : "",
      contactNo: contactNo,
      gender: gender ? gender.value : "",
      address: address,
    }

    setLoader(true);

    axios
      .put(url, data, {
        headers: {
          "auth-token": token,
        },
      })
      .then(function (response) {
        // handle success
        toast.success(response.data.employee + ' successfully saved.', {
          position: "top-center"
        });
        setEditModal(false);
        setLoader(false);
        setId(-1);
        setEmployeeNo("");
        setFirstName("");
        setMiddleName("");
        setLastName("");
        setDepartment("");
        setGender("");
        setContactNo("");
        setAddress("");
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
  }

  const handleOpenEditModal = (params) => {
    var dep = params.department !== "" ? { label: params.department, value: params.deptId } : [];
    var gndr = params.gender !== "" ? { label: params.gender, value: params.gender } : [];
    setEditModal(true);
    setLoader(false);
    setId(params.id);
    setEmployeeNo(params.employeeNo);
    setFirstName(params.firstName);
    setMiddleName(params.middleName);
    setLastName(params.lastName);
    setDepartment(dep);
    setGender(gndr);
    setContactNo(params.contactNo);
    setAddress(params.address);
  }

  const handleCloseEditModal = () => {
    setEditModal(false);
    setLoader(false);
    setId(-1);
    setEmployeeNo("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDepartment("");
    setGender("");
    setContactNo("");
    setAddress("");
  }

  const handleDeleteItem = () => {
    var url = window.apihost + `employees/${id}`;
    var token = sessionStorage.getItem("auth-token");
    setLoader(true);
    axios
      .delete(url, {
        headers: { "auth-token": token },
      })
      .then(function (response) {
        // handle success
        if (response.status <= 200) {
          toast.success('Employee successfully deleted.', {
            position: "top-center"
          })
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
          toast.error(JSON.stringify(error.response.data), {
            position: "top-center"
          });
          setLoader(false);
        }
      });
  }

  const handleOpenDeletePopup = (id) => {
    setDeletePopup(true);
    setId(id);
  }

  const handleCloseDeleteModal = () => {
    setDeletePopup(false);
    setLoader(false);
    setId(-1);
    setEmployeeNo("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDepartment("");
    setContactNo("");
    setAddress("");
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <div className={classes.root}>

      <ToastContainer />
      <Button
        size="large"
        style={{ float: 'left' }}
        variant="contained"
        color="default"
        startIcon={<Add />}
        onClick={() => setAddModal(true)}>Add Employee</Button>

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

      <div style={{ padding: 10, backgroundColor: '#F4F4F4', marginTop: 60, height: '100', minHeight: '75vh', maxHeight: '75vh', overflowY: 'scroll' }}>
        <Grid container spacing={3}>
          {employeeList.length > 0 && employeeList.map(x =>
            <Grid item xs={3}>
              <Card>
                <CardActionArea>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      {x.firstName + " " + x.middleName + " " + x.lastName}
                    </Typography>
                    <Typography gutterBottom variant="p" component="h3">
                      Employee No: {x.employeeNo}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" component="p">
                      Department: {x.department} <br />
                      Gender: {x.gender} <br />
                      Contact No: {x.contactNo} <br />
                      Address: {x.address}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions>
                  <Button size="small" color="primary" onClick={() => handleOpenEditModal(x)}>
                    Edit
                  </Button>
                  <Button size="small" color="primary" onClick={() => handleOpenDeletePopup(x.id)}>
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          )}
        </Grid>
      </div>

      <TablePagination
        // rowsPerPageOptions={[10, 25, 100]}
        labelRowsPerPage=''
        rowsPerPageOptions={[]}
        component="div"
        count={totalEmp}
        rowsPerPage={20}
        page={page}
        onChangePage={handleChangePage}
      // onChangeRowsPerPage={handleChangeRowsPerPage}
      />

      <Modal
        aria-labelledby="spring-modal-title"
        aria-describedby="spring-modal-description"
        className={classes.modal}
        open={addModal}
        onClose={handleCloseAddModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={addModal}>
          <div className={classes.modalPaper}>
            <div>
              <h1>Add Employee</h1>
            </div>
            <Divider />
            <br />
            <form noValidate autoComplete="off">
              <div>
                <label style={{ fontSize: '17px' }}><strong>Employee No</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Employee No" value={employeeNo} onChange={e => setEmployeeNo(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>First Name</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Middle Name</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Middle Name" value={middleName} onChange={e => setMiddleName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Last Name</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><b>Department</b></label>
                <Select
                  defaultValue={department}
                  options={DepartmentOption(departmentOptionsList)}
                  onChange={e => setDepartment(e)}
                  placeholder='Department...'
                  // isClearable
                  // isMulti
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

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><b>Gender</b></label>
                <Select
                  defaultValue={gender}
                  options={GenderOption()}
                  onChange={e => setGender(e)}
                  placeholder='Gender...'
                  // isClearable
                  // isMulti
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

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Contact No</strong></label><br />
                <TextField type="number" variant='outlined' size='small' fullWidth placeholder="Contact No" value={contactNo} onChange={e => setContactNo(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>
              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Address</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <Button
                  size="large"
                  // style={{ float: 'right' }}
                  variant="contained"
                  color="default"
                  onClick={handleCloseAddModal}>
                  <b>Cancel</b>
                </Button>
                <Button
                  size="large"
                  style={{ marginLeft: 10 }}
                  variant="contained"
                  color="default"
                  startIcon={<Save />}
                  onClick={handleAddEmployee}>
                  <b>Submit</b>
                </Button>
              </div>
            </form>
          </div>
        </Fade>
      </Modal>


      <Modal
        aria-labelledby="spring-modal-title"
        aria-describedby="spring-modal-description"
        className={classes.modal}
        open={editModal}
        onClose={handleCloseEditModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={editModal}>
          <div className={classes.modalPaper}>
            <div>
              <h1>Edit Employee</h1>
            </div>
            <Divider />
            <br />
            <form noValidate autoComplete="off">
              <div>
                <label style={{ fontSize: '17px' }}><strong>Employee No</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Employee No" value={employeeNo} onChange={e => setEmployeeNo(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>First Name</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Middle Name</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Middle Name" value={middleName} onChange={e => setMiddleName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Last Name</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><b>Department</b></label>
                <Select
                  defaultValue={department}
                  options={DepartmentOption(departmentOptionsList)}
                  onChange={e => setDepartment(e)}
                  placeholder='Department...'
                  // isClearable
                  // isMulti
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

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><b>Gender</b></label>
                <Select
                  defaultValue={gender}
                  options={GenderOption()}
                  onChange={e => setGender(e)}
                  placeholder='Gender...'
                  // isClearable
                  // isMulti
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

              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Contact No</strong></label><br />
                <TextField type="number" variant='outlined' size='small' fullWidth placeholder="Contact No" value={contactNo} onChange={e => setContactNo(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>
              <br />

              <div>
                <label style={{ fontSize: '17px' }}><strong>Address</strong></label><br />
                <TextField variant='outlined' size='small' fullWidth placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
              </div>

              <br />

              <div>
                <Button
                  size="large"
                  // style={{ float: 'right' }}
                  variant="contained"
                  color="default"
                  onClick={handleCloseEditModal}>
                  <b>Cancel</b>
                </Button>
                <Button
                  size="large"
                  style={{ marginLeft: 10 }}
                  variant="contained"
                  color="default"
                  startIcon={<Save />}
                  onClick={handleEditEmployee}>
                  <b>Submit</b>
                </Button>
              </div>
            </form>
          </div>
        </Fade>
      </Modal>

      <Modal
        aria-labelledby="spring-modal-title"
        aria-describedby="spring-modal-description"
        className={classes.modal}
        open={deletePopup}
        onClose={handleCloseDeleteModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={deletePopup}>
          <div className={classes.modalPaper}>
            <div>
              <h1>Warning</h1>
            </div>
            <Divider />
            <br />

            <p>Are you sure you want to delete this employee?</p>

            <br />
            <Divider />
            <br />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="large"
                // style={{ float: 'right' }}
                variant="contained"
                color="default"
                onClick={handleCloseDeleteModal}>
                <b>Cancel</b>
              </Button>
              <Button
                size="large"
                style={{ marginLeft: 10 }}
                variant="contained"
                color='secondary'
                startIcon={<Delete />}
                onClick={handleDeleteItem}>
                <b>Delete</b>
              </Button>
            </div>
          </div>
        </Fade>
      </Modal>
    </div>
  );
}

export default Employee;