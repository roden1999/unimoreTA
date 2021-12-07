import React, { useState, useEffect, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Popover from '@material-ui/core/Popover';
import { Visibility, VisibilityOff } from '@material-ui/icons/';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import FilledInput from '@material-ui/core/FilledInput';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { useSpring, animated } from 'react-spring/web.cjs';
import 'react-toastify/dist/ReactToastify.css'
import { TextField } from '@material-ui/core';

import UserContext from './context/userContext';
const axios = require('axios');
const moment = require("moment");

const useStyles = makeStyles((theme) => ({
    typography: {
        padding: theme.spacing(2),
    },
}));

const Login = (props) => {
    const classes = useStyles();
    const { setUserData } = useContext(UserContext);
    const [name, setName] = useState("");
    const [resgisterUserName, setRegisterUserName] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordCheck, setPasswordCheck] = useState("");
    const [errSignInMsg, setErrSignInMsg] = useState("");
    const [errRegisterMsg, setErrRegisterMsg] = useState("");
    const [signInLoader, setSignInLoader] = useState(false);
    const [registerLoader, setRegisterLoader] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [visiblePassword, setVisiblePassword] = useState(false);

    const onLogin = async () => {
        setSignInLoader(true);
        const url = window.apihost + "login";
        const loginUser = {
            "userName": userName,
            "password": password
        }
        await axios.post(url, loginUser)
            .then(function (response) {
                // handle success
                sessionStorage.setItem("auth-token", response.data.token);
                sessionStorage.setItem("userData", JSON.stringify(response.data));
                sessionStorage.setItem("user", JSON.stringify(response.data.user));

                //Detailed Logs
                var emp = { "emp": [] };
                var dept = { "dept": [] };
                var remarks = { "remarks": [] };
                sessionStorage.setItem("dlSemp", JSON.stringify(emp));
                sessionStorage.setItem("dlSdept", JSON.stringify(dept));
                sessionStorage.setItem("dlSremarks", JSON.stringify(remarks));
                sessionStorage.setItem("dlSfromDate", moment().startOf('month').format('MM/DD/yyyy').toString());
                sessionStorage.setItem("dlStoDate", moment().format('MM/DD/yyyy').toString());

                //Dtr Logs
                sessionStorage.setItem("dtrSemp", JSON.stringify(emp));
                sessionStorage.setItem("dtrSdept", JSON.stringify(dept));
                sessionStorage.setItem("dtrSfromDate", moment().startOf('month').format('MM/DD/yyyy').toString());
                sessionStorage.setItem("dtrStoDate", moment().format('MM/DD/yyyy').toString());

                //Raw Logs
                sessionStorage.setItem("rawSemp", JSON.stringify(emp));
                sessionStorage.setItem("rawSfromDate", moment().startOf('month').format('MM/DD/yyyy').toString());
                sessionStorage.setItem("rawStoDate", moment().format('MM/DD/yyyy').toString());

                setUserData(response.data);
                setSignInLoader(false);
            })
            .catch(err => {
                const errors = {
                    msg: err.response.data.message,
                    status: err.response.status
                }
                setErrSignInMsg(err.response.data.message);
                setSignInLoader(false);
            });
    }

    const handleSignInUserName = (e) => {
        setUserName(e.target.value);
        setErrSignInMsg("");
    }

    const handleSignInPassword = (e) => {
        setPassword(e.target.value);
        setErrSignInMsg("");
    }

    const onRegister = () => {
        setRegisterLoader(true);
        const url = window.apihost + "registration";
        const newUser = {
            "name": name,
            "userName": resgisterUserName,
            "password": registerPassword,
            // "passwordCheck": passwordCheck
        };
        axios.post(url, newUser)
            .then(function (response) {
                // handle success
                alert("Successfully Registered " + response.data);
                setRegisterLoader(false);
            })
            .catch(err => {
                const errors = {
                    msg: err.response.data,
                    status: err.response.status
                }
                setErrRegisterMsg(err.response.data);
                setRegisterLoader(false);
            });
    }

    const handleName = (e) => {
        setName(e.target.value);
        setErrRegisterMsg("");
    }

    const handleRegisterUserName = (e) => {
        setRegisterUserName(e.target.value);
        setErrRegisterMsg("");
    }

    const handleRegisterPassword = (e) => {
        setRegisterPassword(e.target.value);
        setErrRegisterMsg("");
    }

    const handlePasswordChecker = (e) => {
        setPasswordCheck(e.target.value);
        setErrRegisterMsg("");
    }

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const openPopover = Boolean(anchorEl);
    const popOverId = openPopover ? 'simple-popover' : undefined;

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            fontFamily: `'Montserrat', sans-serif`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
            background: '#F3F1F1',
        }}>
            <Card link style={{ margin: '0 auto', width: '30%' }}>
                {/* <h1 style={{ textAlign: 'center', marginTop: 10, marginBottom: 10 }}>Logo</h1> */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                    <img src="unimore-logo-landscape.png" width="70%" height="90%" style={{ backgroundColor: 'white' }} />
                </div>
                <h6 style={{ textAlign: 'center', marginTop: 10, marginBottom: 5, color: 'red' }}>{errSignInMsg}</h6>
                <div style={{ paddingLeft: 30, paddingRight: 30, }}>
                    <form autoComplete="off">
                        <div>
                            <TextField
                                fluid
                                label='Username'
                                placeholder='username'
                                id='form-input-first-name'
                                size='large'
                                variant="filled"
                                fullWidth
                                value={userName}
                                onChange={handleSignInUserName}
                            />
                        </div>
                        <div style={{ marginTop: 10 }}>
                            <FormControl fullWidth className={clsx(classes.margin, classes.textField)} variant="filled">
                                <InputLabel htmlFor="filled-adornment-password">Password</InputLabel>
                                <FilledInput
                                    fluid
                                    label='Password'
                                    placeholder='password'
                                    type={visiblePassword === false ? "password" : "text"}
                                    size='large'
                                    variant="filled"                                    
                                    value={password}
                                    onChange={handleSignInPassword}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setVisiblePassword(!visiblePassword)}
                                                onMouseDown={handleMouseDownPassword}
                                            >
                                                {visiblePassword !== false ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                        </div>

                        <div>
                            <div style={{ margin: '0 auto', marginTop: 10, display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                                <Button
                                    size='large'
                                    variant='contained'
                                    style={{ backgroundColor: '#1e88e5', color: '#fff', borderRadius: 20, width: '130px', height: '50px' }}
                                    disabled={signInLoader}
                                    onClick={onLogin}
                                    type='submit'
                                >
                                    {signInLoader === false ? "Sign In" : <CircularProgress />}
                                </Button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
                                {/* <a href='#'><b>Forgot Password?</b></a> */}
                                {/* <Popup
                                    content='Contact admin to change your password.'
                                    on='click'
                                    pinned
                                    trigger={<a href='#'><b>Forgot Password?</b></a>}
                                /> */}
                                <a aria-describedby={popOverId} variant="contained" color="primary" onClick={handleClick}>
                                    Forgot Password?
                                </a>
                                <Popover
                                    id={popOverId}
                                    open={openPopover}
                                    anchorEl={anchorEl}
                                    onClose={handleClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'center',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'center',
                                    }}
                                >
                                    <Typography className={classes.typography}>Contact admin to change your password.</Typography>
                                </Popover>
                            </div>
                        </div>
                    </form>
                </div>
            </Card>
        </div >
    );
}

export default Login;