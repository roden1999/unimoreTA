import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { Mail as MailIcon, PeopleAlt, HomeWork, EventNote, LocalAtm, MoneyOff, Today } from '@material-ui/icons/';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import Employee from "./employee";
import Department from "./department";
import TimeLogs from "./timeLogs";
import HolidaySchedule from "./holidaySchedule";

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
}));

function Main(props) {
    const { window } = props;
    const classes = useStyles();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pageName, setPageName] = useState("Time Logs")

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handlePage = (value) => {
        setPageName(value);
    }

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

            <List>
                <List>
                    <ListItem button onClick={() => handlePage("Payroll")}>
                        <ListItemIcon>{<LocalAtm />}</ListItemIcon>
                        <ListItemText primary={"Payroll"} />
                    </ListItem>
                    <ListItem button onClick={() => handlePage("Deductions")}>
                        <ListItemIcon>{<MoneyOff />}</ListItemIcon>
                        <ListItemText primary={"Deductions"} />
                    </ListItem>
                </List>
            </List>
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
                    <Typography variant="h6" noWrap>
                        {pageName}
                    </Typography>
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