import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Badge from '@material-ui/core/Badge';
import { Mail as MailIcon, PeopleAlt, HomeWork, EventNote, LocalAtm, MoneyOff, Today, AccountCircle, PeopleAltSharp } from '@material-ui/icons/';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import Employee from "./employee";
import Department from "./department";
import TimeLogs from "./timeLogs";
import HolidaySchedule from "./holidaySchedule";
import SalaryAndDeduction from "./salaryAndDeductions";
import Payroll from "./payroll";
import User from "./user";
import UserContext from './context/userContext';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    drawer: {
        [theme.breakpoints.up('sm')]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    appBar: {
        [theme.breakpoints.up('sm')]: {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
        },
    },
    title: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            display: 'none',
        },
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
        width: drawerWidth,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        backgroundColor: '#C4C4C4C4',
        height: '100%',
        minHeight: '100vh',
        maxHeight: '100vh'
    },

    customBadge: {
        backgroundColor: "#1AEC02",
        color: "white"
    }
}));

function Main(props) {
    const { window } = props;
    const classes = useStyles();
    const theme = useTheme();
    const { userData, setUserData } = useContext(UserContext);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pageName, setPageName] = useState("Employee");
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [anchorEl, setAnchorEl] = React.useState(null);

    useEffect(() => {
        const data = sessionStorage.getItem('page');
        if (data) setPageName(data);

        const user = JSON.parse(sessionStorage.getItem('user'));
        setRole(user.role);
        setName(user.Name);
    }, []);
    useEffect(() => {
        sessionStorage.setItem('page', pageName);
    });

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handlePage = (value) => {
        setPageName(value);
    }

    const logOut = () => {
        setUserData({
            token: undefined,
            user: undefined
        });
        sessionStorage.setItem("auth-token", "");
        sessionStorage.setItem("userData", "");
        sessionStorage.setItem("user", "");
        sessionStorage.setItem("page", "Employee");
        // Storage.empty();
    }

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const drawer = (
        <div>
            <div className={classes.toolbar} style={{ display: 'flex', justifyContent: 'center' }}>
                <img src="unimore-logo-landscape.png" width='200' height='60' />
            </div>

            <Divider />

            <List>
                <ListItem button onClick={() => handlePage("Employee")}>
                    <ListItemIcon>{<PeopleAlt />}</ListItemIcon>
                    <ListItemText primary={"Employee"} />
                </ListItem>
            </List>
            <List>
                <ListItem button onClick={() => handlePage("Department")}>
                    <ListItemIcon>{<HomeWork />}</ListItemIcon>
                    <ListItemText primary={"Department"} />
                </ListItem>
            </List>
            <List>
                <ListItem button onClick={() => handlePage("Time Logs")}>
                    <ListItemIcon>{<EventNote />}</ListItemIcon>
                    <ListItemText primary={"Time Logs"} />
                </ListItem>
            </List>
            <List>
                <ListItem button onClick={() => handlePage("Holiday Schedule")}>
                    <ListItemIcon>{<Today />}</ListItemIcon>
                    <ListItemText primary={"Holiday Schedule"} />
                </ListItem>
            </List>

            <Divider />

            {/*role === "Administrator" || role === "HR" ?
                <List>
                    <List>
                        <ListItem button onClick={() => handlePage("Payroll")}>
                            <ListItemIcon>{<LocalAtm />}</ListItemIcon>
                            <ListItemText primary={"Payroll"} />
                        </ListItem>
                        <ListItem button onClick={() => handlePage("Salary & Deductions")}>
                            <ListItemIcon>{<MoneyOff />}</ListItemIcon>
                            <ListItemText primary={"Salary & Deductions"} />
                        </ListItem>
                    </List>
                </List> :
                <></>
            */}

            <Divider />

            {role === "Administrator" &&
                <List>
                    <List>
                        <ListItem button onClick={() => handlePage("Users")}>
                            <ListItemIcon>{<PeopleAltSharp />}</ListItemIcon>
                            <ListItemText primary={"Users"} />
                        </ListItem>
                    </List>
                </List>
            }
        </div>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        className={classes.menuButton}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap className={classes.title}>
                        {pageName}
                    </Typography>
                    <IconButton
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        edge="end"
                        onClick={handleClick}
                        color="inherit"
                    >
                        <Badge variant="dot" color="secondary" classes={{ badge: classes.customBadge }}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                        >
                            <AccountCircle />
                        </Badge>
                        <div>
                            <ListItemText style={{ marginLeft: 7 }} primary={name}
                                secondary={<label style={{ fontSize: 12, color: '#BEBFC1' }}>{role}</label>}
                            />
                        </div>
                    </IconButton>
                    <Menu
                        id="simple-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={logOut}>Logout</MenuItem>
                    </Menu>

                </Toolbar>
            </AppBar>
            <nav className={classes.drawer} aria-label="mailbox folders">
                {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                <Hidden smUp implementation="css">
                    <Drawer
                        container={container}
                        variant="temporary"
                        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                    >
                        {drawer}
                    </Drawer>
                </Hidden>
                <Hidden xsDown implementation="css">
                    <Drawer
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        variant="permanent"
                        open
                    >
                        {drawer}
                    </Drawer>
                </Hidden>
            </nav>
            <main className={classes.content}>
                <div className={classes.toolbar} />

                {pageName === "Employee" &&
                    <Employee />
                }

                {pageName === "Department" &&
                    <Department />
                }

                {pageName === "Time Logs" &&
                    <TimeLogs />
                }

                {pageName === "Holiday Schedule" &&
                    <HolidaySchedule />
                }

                {/*pageName === "Salary & Deductions" && role === "Administrator" || pageName === "Salary & Deductions" && role === "HR" ?
                    <SalaryAndDeduction /> : <></>
                */}

                {/*pageName === "Payroll" && role === "Administrator" || pageName === "Payroll" && role === "HR" ?
                    <Payroll /> : <></>
                */}

                {pageName === "Users" && role === "Administrator" &&
                    <User />
                }

            </main>
        </div>
    );
}

Main.propTypes = {
    /**
     * Injected by the documentation to work in an iframe.
     * You won't need it on your project.
     */
    window: PropTypes.func,
};

export default Main;