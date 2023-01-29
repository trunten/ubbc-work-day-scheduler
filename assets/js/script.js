const HOUR_START = 0;
const HOUR_END = 23;
const ONE_HOUR = 3600000;
const TODAY = moment();
const timeBlockContainer = $(".container");

// event listeners
timeBlockContainer.on("click", ".saveBtn", save);
timeBlockContainer.on('input', "textarea", stateChange);
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

updateDate();

function updateDate() {
    $("#currentDay").text(currentDateTime.format("dddd Do MMMM YYYY"));
    createTimeBlocks();
}

function createTimeBlocks() {
    $(".row").remove();
    for (let i = HOUR_START; i <= HOUR_END; i++) {
        // Set hour to current loop index
        let hour = moment(currentDateTime).set({
            hour: i,
            minute: 0,
            second: 0,
        });

        // Unique dataset value for buttons and textareas
        let timeID = hour.unix();

        // Create elements
        let timeBlock  = $(`<div class="time-block row"></div>`);
        let hourText = $(`<div class="col-2 col-lg-1 hour"><h3 class="align-middle text-right pt-3">${hour.format("hA")}</h3></div>`);
        let textInput = $(`<textarea data-datetime="${timeID}" class="col-8 col-lg-10"></textarea>`);
        let button = $(`<button data-datetime="${timeID}" class="col-2 col-lg-1 saveBtn "><i class="fas fa-save"></i></button>`);

        // Set text input colour
        if (savedEvents[timeID]) {
            textInput.val(savedEvents[timeID]);
        }
        if (currentDateTime < TODAY) {
            textInput.addClass("past");
        } else if (currentDateTime > TODAY) {
            textInput.addClass("future");
        } else {
            if (i < currentDateTime.hour()) {
                textInput.addClass("past");
            } else if (i > currentDateTime.hour()) {
                textInput.addClass("future");
            } else {
                textInput.addClass("present");
            }
        }

        // Add elements to container
        timeBlock.append(hourText).append(textInput).append(textInput).append(button);
        timeBlock.appendTo(timeBlockContainer);
    }
}

function save() {
    let target = $(this);
    let timeID = target.attr("data-datetime");
    let eventText = $(`textarea[data-datetime=${timeID}]`).val().trim();
    if (eventText) {
        savedEvents[timeID] = eventText;
    } else {
        delete savedEvents[timeID];
    }
    localStorage.setItem("scheduled", JSON.stringify(savedEvents));
    if (!target.hasClass("changed")) { return; }
    const icon = target.children();
    icon.addClass("fa-spinner fa-spin").removeClass("fa-save");
    setTimeout(function() {
        icon.addClass("fa-save").removeClass("fa-spin fa-spinner")
        target.removeClass("changed");
        showPopup();
    }, 800);
}

function showPopup(delay = 1500) {
    $('.popup').css({opacity: "1"})
    setTimeout(() => $('.popup').css({opacity: "0"}), delay);
}

function stateChange() {
    let timeID = $(this).attr("data-datetime");
    let eventButton = $(`.saveBtn[data-datetime=${timeID}]`);
    eventButton.addClass("changed")
}

