import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CardActionArea from '@material-ui/core/CardActionArea';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button';
import { Save, Edit, Delete, Add } from '@material-ui/icons/';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { useSpring, animated } from 'react-spring/web.cjs';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import { TextField } from '@material-ui/core';
import Backdrop from '@material-ui/core/Backdrop';
import 'react-toastify/dist/ReactToastify.css';
const axios = require("axios");

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
        // color: state.isSelected ? 'white' : 'black',
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

const Users = () => {
    const classes = useStyles();
    const [usersData, setUsersData] = useState(null);
    const [selectedUser, setSelectedUser] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [loader, setLoader] = useState(false);
    const [addModal, setAddModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [changePassModal, setChangePassModal] = useState(false);
    const [id, setId] = useState(-1);
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState([]);
    const [deletePopup, setDeletePopup] = useState(false);

    useEffect(() => {
        var data = selectedUser;
        var route = "users/list";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        axios
            .post(url, data, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setUsersData(response.data);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setUsersData(obj);
                }
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .finally(function () {
                // always executed
            });
    }, [selectedUser, loader]);

    const usersList = usersData
        ? usersData.map((x) => ({
            id: x._id,
            userName: x.UserName,
            name: x.Name,
            role: x.Role,
        }))
        : [];

    useEffect(() => {
        var route = "users/search-options";
        var url = window.apihost + route;
        var token = sessionStorage.getItem("auth-token");

        axios
            .get(url, {
                headers: { "auth-token": token },
            })
            .then(function (response) {
                // handle success
                if (Array.isArray(response.data)) {
                    setUserOptions(response.data);
                } else {
                    var obj = [];
                    obj.push(response.data);
                    setUserOptions(obj);
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

    const usersOptionsList = userOptions
        ? userOptions.map((x) => ({
            id: x._id,
            userName: x.UserName,
        }))
        : [];

    function UsersOption(item) {
        var list = [];
        if (item !== undefined || item !== null) {
            item.map((x) => {
                var name = x.userName;
                return list.push({
                    label: name,
                    value: x.id,
                });
            });
        }
        return list;
    }

    function RoleOption() {
        var list = [];
        var item = [
            { role: "Administrator", key: "Administrator" },
            { role: "HR", key: "HR" },
            { role: "HR Staff", key: "HR Staff" }
        ]
        if (item !== undefined || item !== null) {
            item.map((x) => {
                return list.push({
                    label: x.role,
                    value: x.key,
                });
            });
        }
        return list;
    }

    const handleAddUser = () => {
        var route = "users/";
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            userName: userName,
            password: password,
            confirmPassword: confirmPassword,
            name: name,
            role: Object.keys(role).length > 0 ? role.value : ''
        }

        setLoader(true);
        axios
            .post(url, data)
            .then(function (response) {
                // handle success
                toast.success(response.data.user + ' successfully saved.', {
                    position: "top-center"
                });
                setAddModal(false);
                setLoader(false);
                setId(-1);
                setUserName('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setRole('');
            })
            .catch(function (error) {
                // handle error
                toast.error(error.response.data, {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }


    const handlCloseAddModal = () => {
        setAddModal(false);
        setId(-1);
        setUserName("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setRole("");
    }

    const handleEditUser = () => {
        var route = `users/${id}`;
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            UserName: userName,
            Name: name,
            Role: Object.keys(role).length > 0 ? role.value : ''
        }

        setLoader(true);
        axios
            .put(url, data)
            .then(function (response) {
                // handle success
                toast.success(response.data.user + ' successfully edited.', {
                    position: "top-center"
                });
                setEditModal(false);
                setLoader(false);
                setId(-1);
                setUserName('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setRole('');
            })
            .catch(function (error) {
                // handle error
                toast.error(error.response.data, {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const handleOpenEditModal = (params) => {
        setId(params.id);
        setEditModal(true);
        setUserName(params.userName);
        setName(params.name);
        var data = params.role !== "" ? params.role : "";
        setRole([{ label: data, value: data }]);
    }

    const handlCloseEditModal = () => {
        setEditModal(false);
        setId(-1);
        setUserName("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setRole("");
    }

    const onDelete = (value) => {
        setId(value);
        setDeletePopup(true);
    }

    const handleCloseDeleteModal = () => {
        setDeletePopup(false);
        setId(-1);
        setUserName("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setRole("");
    }

    const handleDeleteUser = () => {
        var url = window.apihost + `users/${id}`;
        setLoader(true);
        axios
            .delete(url)
            .then(function (response) {
                // handle success
                if (response.status <= 200) {
                    toast.success('User successfully deleted!', {
                        position: "top-center"
                    });
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
                    toast.error(error.response.data, {
                        position: "top-center"
                    });
                    setLoader(false);
                } else {
                    // alert(err.response.status + JSON.stringify(err.response.data));
                    const error = {
                        status: err.response.status,
                        error: JSON.stringify(err.response.data),
                    };
                    alert(JSON.stringify(error));
                    setLoader(false);
                }
            });
    }

    const handleChangePassword = () => {
        var route = `users/change-password/${id}`;
        var url = window.apihost + route;
        // var token = sessionStorage.getItem("auth-token");

        var data = {
            Password: password,
            ConfirmPassword: confirmPassword
        }

        setLoader(true);
        axios
            .put(url, data)
            .then(function (response) {
                // handle success
                toast.success(response.data.user + ' successfully changed password.', {
                    position: "top-center"
                });
                setChangePassModal(false);
                setLoader(false);
                setId(-1);
                setUserName('');
                setPassword('');
                setConfirmPassword('');
                setName('');
                setRole('');
            })
            .catch(function (error) {
                // handle error
                toast.error(error.response.data, {
                    position: "top-center"
                });
                setLoader(false);
            })
            .finally(function () {
                // always executed
            });
    }

    const handlCloseChangePassModal = () => {
        setChangePassModal(false);
        setId(-1);
        setUserName('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setRole('');
    }

    const handleOpenChangePassModal = (value) => {
        setChangePassModal(true);
        setId(value);
    }

    return (
        <div className={classes.root}>
            <ToastContainer />
            <Button
                size='large'
                onClick={() => setAddModal(true)}
                style={{ float: 'left' }}
            >
                <Add />Add User
            </Button>

            <div style={{
                float: 'right', width: '30%', zIndex: 100,
            }}>
                <Select
                    defaultValue={selectedUser}
                    options={UsersOption(usersOptionsList)}
                    onChange={e => setSelectedUser(e)}
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
                    {usersList !== null && usersList.map(x =>
                        <Grid item xs={3}>
                            <Card>
                                <CardActionArea>
                                    <CardContent>
                                        <Typography gutterBottom variant="h5" component="h5">
                                            Name: <strong>{x.name}</strong>
                                        </Typography>
                                        <Typography gutterBottom variant="h5" component="h5">
                                            Username: <strong>{x.userName}</strong>
                                        </Typography>
                                        <Typography gutterBottom variant="p" component="h3">
                                            Role: {x.role}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                                <CardActions>
                                    <Button size="small" color="primary" disabled={x.userName === "superadmin" ? true : false} onClick={() => handleOpenEditModal(x)}>
                                        Edit
                                    </Button>
                                    <Button size="small" color="primary" disabled={x.userName === "superadmin" ? true : false} onClick={() => handleOpenChangePassModal(x.id)}>
                                        Change Password
                                    </Button>
                                    <Button size="small" color="primary" disabled={x.userName === "superadmin" ? true : false} onClick={() => onDelete(x.id)}>
                                        Delete
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    )}
                </Grid>

                {usersList === null || usersList.length === 0 && loader !== true &&
                    <div style={{ textAlign: 'center', padding: 120 }}>
                        <h1 style={{ color: "#C4C4C4" }}>No data found!</h1>
                    </div>
                }
                {loader === true &&
                    <div style={{ margin: '0 auto', textAlign: 'center' }}>
                        <CircularProgress />
                    </div>
                }
            </div>

            {/* <TablePagination
                // rowsPerPageOptions={[10, 25, 100]}
                labelRowsPerPage=''
                rowsPerPageOptions={[]}
                component="div"
                count={totalEmp}
                rowsPerPage={20}
                page={page}
                onChangePage={handleChangePage}
            // onChangeRowsPerPage={handleChangeRowsPerPage}
            /> */}

            <Modal
                aria-labelledby="spring-modal-title"
                aria-describedby="spring-modal-description"
                className={classes.modal}
                open={addModal}
                onClose={handlCloseAddModal}
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
                                <label style={{ fontSize: '17px' }}><strong>Name</strong></label><br />
                                <TextField variant='outlined' size='small' fullWidth placeholder="Name" value={name} onChange={e => setName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Role</strong></label><br />
                                <Select
                                    defaultValue={role}
                                    options={RoleOption()}
                                    onChange={e => setRole(e)}
                                    placeholder='role'
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
                                <label style={{ fontSize: '17px' }}><strong>Username</strong></label><br />
                                <TextField variant='outlined' size='small' fullWidth placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Password</strong></label><br />
                                <TextField variant='outlined' type="password" size='small' fullWidth placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Confirm Password</strong></label><br />
                                <TextField variant='outlined' type="password" size='small' fullWidth placeholder="Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />
                            <div>
                                <Button
                                    size="large"
                                    // style={{ float: 'right' }}
                                    variant="contained"
                                    color="default"
                                    onClick={handlCloseAddModal}>
                                    <b>Cancel</b>
                                </Button>
                                <Button
                                    size="large"
                                    style={{ marginLeft: 10 }}
                                    variant="contained"
                                    color="default"
                                    startIcon={<Save />}
                                    onClick={handleAddUser}>
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
                onClose={handlCloseEditModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={editModal}>
                    <div className={classes.modalPaper}>
                        <div>
                            <h1>Edit User</h1>
                        </div>
                        <Divider />
                        <br />

                        <form noValidate autoComplete="off">
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Name</strong></label><br />
                                <TextField variant='outlined' size='small' fullWidth placeholder="Name" value={name} onChange={e => setName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Role</strong></label><br />
                                <Select
                                    defaultValue={role}
                                    options={RoleOption()}
                                    onChange={e => setRole(e)}
                                    placeholder='role'
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
                                <label style={{ fontSize: '17px' }}><strong>Username</strong></label><br />
                                <TextField variant='outlined' size='small' fullWidth placeholder="Username" value={userName} onChange={e => setUserName(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />
                            <div>
                                <Button
                                    size="large"
                                    // style={{ float: 'right' }}
                                    variant="contained"
                                    color="default"
                                    onClick={handlCloseEditModal}>
                                    <b>Cancel</b>
                                </Button>
                                <Button
                                    size="large"
                                    style={{ marginLeft: 10 }}
                                    variant="contained"
                                    color="default"
                                    startIcon={<Save />}
                                    onClick={handleEditUser}>
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

                        <p>Are you sure you want to delete this User?</p>

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
                                onClick={handleDeleteUser}>
                                <b>Delete</b>
                            </Button>
                        </div>
                    </div>
                </Fade>
            </Modal>

            <Modal
                aria-labelledby="spring-modal-title"
                aria-describedby="spring-modal-description"
                className={classes.modal}
                open={changePassModal}
                onClose={handlCloseChangePassModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={changePassModal}>
                    <div className={classes.modalPaper}>
                        <div>
                            <h1>Change Password</h1>
                        </div>
                        <Divider />
                        <br />

                        <form noValidate autoComplete="off">
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Password</strong></label><br />
                                <TextField variant='outlined' type="password" size='small' fullWidth placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>
                            <br />
                            <div>
                                <label style={{ fontSize: '17px' }}><strong>Confirm Password</strong></label><br />
                                <TextField variant='outlined' type="password" size='small' fullWidth placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} inputProps={{ 'aria-label': 'description' }} />
                            </div>

                            <br />
                            <div>
                                <Button
                                    size="large"
                                    // style={{ float: 'right' }}
                                    variant="contained"
                                    color="default"
                                    onClick={handlCloseChangePassModal}>
                                    <b>Cancel</b>
                                </Button>
                                <Button
                                    size="large"
                                    style={{ marginLeft: 10 }}
                                    variant="contained"
                                    color="default"
                                    startIcon={<Save />}
                                    onClick={handleChangePassword}>
                                    <b>Submit</b>
                                </Button>
                            </div>
                        </form>
                    </div>
                </Fade>
            </Modal>
        </div >
    );
}

export default Users;