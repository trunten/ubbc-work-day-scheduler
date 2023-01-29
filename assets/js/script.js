// Global constants & variables
const timeBlockContainer = $(".container");
let settings;
let timer;
let savedEvents;
let currentDate;

init();

function init() {
    // event listeners
    timeBlockContainer.on("click", ".saveBtn", save);
    timeBlockContainer.on('input', "textarea", stateChange);
    $("#settings-btn").on("click", showModal);
    $("#close-modal").on("click", closeModal);
    $("#save-settings").on("click", saveSettings);
    $("#date-down").on("click", function() {
        currentDate.subtract(1, 'days');
        updateDate();
    });
    $("#date-up").on("click", function() {
        currentDate.add(1, 'days');
        updateDate();
    });
    $("#today").on("click", function(e) {
        e.preventDefault();
        currentDate = moment().set({hour: 0, minute: 0, second: 0});
        updateDate();
    })

    // Get settings from local storage and set form values
    settings = JSON.parse(localStorage.getItem("settings")) || { format: 12, start: 9, end: 17 };
    for (let i = 0; i < 24; i++) {
        let t = ("0" + i).slice(-2) + ":00";
        $("#start").append($(`<option value="${i}">${t}</option>`));
        $("#end").append($(`<option value="${i}">${t}</option>`));
    }
    if (settings.format === 12) {
        $("#12").prop("checked", true);
    } else {
        $("#24").prop("checked", true);
    }
    $("#start").val(settings.start);
    $("#end").val(settings.end);

    // Get saved events from local storage and set initial state
    savedEvents = JSON.parse(localStorage.getItem("scheduled")) || {};
    currentDate = moment().set({hour: 0, minute: 0, second: 0});

    // Set the date text and create timeblocks
    updateDate();
}

function updateDate() {
    $("#currentDay").text(currentDate.format("dddd Do MMMM YYYY"));
    if (currentDate.unix() == moment().set({hour: 0, minute: 0, second: 0}).unix()) {
        $("#today").addClass("invisible");
    } else {
        $("#today").removeClass("invisible");
    }
    createTimeBlocks();
}

function createTimeBlocks() {
    $(".row").remove();
    for (let i = settings.start; i <= settings.end; i++) {
        // Set hour to current loop index
        let hour = moment(currentDate).set({
            hour: i,
            minute: 0,
            second: 0,
        });

        // Unique dataset value for buttons and textareas
        let timeID = hour.unix();

        // Create elements
        let label = settings.format === 12 ? hour.format("hA") : hour.format("HH:mm");
        let timeBlock  = $(`<div class="time-block row"></div>`);
        let hourText = $(`<div class="col-2 col-lg-1 hour"><h3 class="align-middle text-right pt-3">${label}</h3></div>`);
        let textInput = $(`<textarea data-datetime="${timeID}" class="col-8 col-lg-10"></textarea>`);
        let button = $(`<button data-datetime="${timeID}" class="col-2 col-lg-1 saveBtn"><i class="fas fa-save"></i></button>`);
        // button.prop("disabled", true);

        // Set text input value if it's in local storage
        if (savedEvents[timeID]) {
            textInput.val(savedEvents[timeID]);
        }

        // Add elements to container
        timeBlock.append(hourText).append(textInput).append(textInput).append(button);
        timeBlock.appendTo(timeBlockContainer);
    }
    // Set text input colour
    updateBlockColours();
}

function updateBlockColours() {
    let now = moment().set({minute: 0, second: 0}).unix();
    $(".container textarea").each(function(i, el) {
        let textInput = $(el);
        let timeID = parseInt(textInput.attr("data-datetime"));
        // Set text input colour
        textInput.removeClass("past present future")
        if (timeID < now) {
            textInput.addClass("past");
        } else if (timeID > now) {
            textInput.addClass("future");
        } else {
            textInput.addClass("present");
        }
    })

    // If a timer is not set
    if (!timer) {
        // Run at again on the next hour to update colours as the day advances.
        let next = moment();
        next.set({hour: next.hour() + 1, minute: 0, second: 3}); // Set seconds to 3 because timer seemed to drift and run early on ocassion
        next = (next.unix() - moment().unix()) * 1000; // Time to next hour (seconds to milliseconds)
        timer = setTimeout(function() {
            timer = false; // Set timer to false becuase it's ran at this point
            updateBlockColours();
        }, next);
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
        // target.prop("disabled", true);
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
    // eventButton.prop("disabled", false);
    eventButton.addClass("changed")
}

function showModal() {
    document.getElementById("settings").showModal();
}

function closeModal(e) { 
    e.preventDefault();
    document.getElementById("settings").close();
}

function saveSettings(e) {
    e.preventDefault();
    let format = 12;
    if ($("#24").is(":checked")) {
        format = 24;
    }
    let start = parseInt($("#start").val());
    let end = parseInt($("#end").val());
    settings = {
        format: format,
        start: start,
        end: end,
    }
    localStorage.setItem("settings", JSON.stringify(settings));
    document.getElementById("settings").close();
    createTimeBlocks();
}

