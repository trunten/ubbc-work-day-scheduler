const HOUR_START = 9;
const HOUR_END = 23;
const ONE_HOUR = 3600000;
const TODAY = moment();
const timeBlockContainer = $(".container");

// event listeners
timeBlockContainer.on("click", ".saveBtn", save);
$("#date-down").on("click", function() {
    currentDateTime.subtract(1, 'days');
    updateDate();
});

$("#date-up").on("click", function() {
    currentDateTime.add(1, 'days');
    updateDate();
});

// Initial state
let savedEvents = JSON.parse(localStorage.getItem("scheduled")) || {};
let currentDateTime = moment(TODAY);

