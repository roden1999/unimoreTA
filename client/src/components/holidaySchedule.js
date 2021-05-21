import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const axios = require("axios");
const moment = require("moment");

const localizer = momentLocalizer(moment);

const allViews = () => Object
    .keys(Calendar.Views)
    .map(k => Calendar.Views[k]);

const HolidaySchedule = () => {

    const data = [
        {
            'title': 'All Day Event very long title',
            'allDay': true,
            'start': new Date(2021, 3, 0),
            'end': new Date(2021, 3, 1)
        },
        {
            'title': 'Long Event',
            'start': new Date(2021, 3, 7),
            'end': new Date(2021, 3, 10)
        },

        {
            'title': 'DTS STARTS',
            'start': new Date(2021, 2, 13, 0, 0, 0),
            'end': new Date(2021, 2, 20, 0, 0, 0)
        },

        {
            'title': 'DTS ENDS',
            'start': new Date(2021, 10, 6, 0, 0, 0),
            'end': new Date(2021, 10, 13, 0, 0, 0)
        },

        {
            'title': 'Some Event',
            'start': new Date(2021, 3, 9, 0, 0, 0),
            'end': new Date(2021, 3, 9, 0, 0, 0)
        },
        {
            'title': 'Conference',
            'start': new Date(2021, 3, 11),
            'end': new Date(2021, 3, 13),
            desc: 'Big conference for important people'
        },
        {
            'title': 'Meeting',
            'start': new Date(2021, 3, 12, 10, 30, 0, 0),
            'end': new Date(2021, 3, 12, 12, 30, 0, 0),
            desc: 'Pre-meeting meeting, to prepare for the meeting'
        },
        {
            'title': 'Lunch',
            'start': new Date(2021, 3, 12, 12, 0, 0, 0),
            'end': new Date(2021, 3, 12, 13, 0, 0, 0),
            desc: 'Power lunch'
        },
        {
            'title': 'Meeting',
            'start': new Date(2021, 3, 12, 14, 0, 0, 0),
            'end': new Date(2021, 3, 12, 15, 0, 0, 0)
        },
        {
            'title': 'Happy Hour',
            'start': new Date(2021, 3, 12, 17, 0, 0, 0),
            'end': new Date(2021, 3, 12, 17, 30, 0, 0),
            desc: 'Most important meal of the day'
        },
        {
            'title': 'Dinner',
            'start': new Date(2021, 3, 12, 20, 0, 0, 0),
            'end': new Date(2021, 3, 12, 21, 0, 0, 0)
        },
        {
            'title': 'Birthday Party',
            'start': new Date(2021, 3, 13, 7, 0, 0),
            'end': new Date(2021, 3, 13, 10, 30, 0)
        },
        {
            'title': 'Birthday Party 2',
            'start': new Date(2021, 3, 13, 7, 0, 0),
            'end': new Date(2021, 3, 13, 10, 30, 0)
        },
        {
            'title': 'Birthday Party 3',
            'start': new Date(2021, 3, 13, 7, 0, 0),
            'end': new Date(2021, 3, 13, 10, 30, 0)
        },
        {
            'id': "123",
            'title': 'Late Night Event',
            'start': new Date(2021, 3, 17, 19, 30, 0),
            'end': new Date(2021, 3, 18, 2, 0, 0)
        },
        {
            'title': 'Multi-day Event',
            'start': new Date(2021, 3, 20, 19, 30, 0),
            'end': new Date(2021, 3, 20, 19, 30, 0)
        }
    ];
    return (
        <div style={{ height: 700, backgroundColor: 'white', padding: 5 }}>
            <Calendar
                localizer={localizer}
                events={data}
                onSelectEvent={(e) => alert(JSON.stringify(e))}
                step={60}
                views={allViews}
                defaultDate={new Date(moment())}
            />
        </div>
    );
}

export default HolidaySchedule;
