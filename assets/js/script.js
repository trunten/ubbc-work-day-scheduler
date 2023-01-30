// Global constants & variables
const timeBlockContainer = $(".container");
let settings;
let timer;
let savedEvents;
let currentDate;

init();

// Set up initial app state
function init() {
    // Add event listeners
    timeBlockContainer.on("click", ".saveBtn", save);
    timeBlockContainer.on('input', "textarea", stateChange);
    $("#settings-btn").on("click", showModal);
    $("#close-modal").on("click", closeModal);
    $("#save-settings").on("click", saveSettings);
    $("#clear-schedule").on("click", clearSchedule);
    $("#date-down").on("click", function() {
        if (confirmUnsaved()) {
            currentDate.subtract(1, 'days');
            updateDate();
        }
    });
    $("#date-up").on("click", function() {
        if (confirmUnsaved()) {
            currentDate.add(1, 'days');
            updateDate();
        }
    });
    $("#today").on("click", function(e) {
        e.preventDefault();
        if (confirmUnsaved()) {
            currentDate = moment().set({hour: 0, minute: 0, second: 0});
            updateDate();
        }
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

// Function updates the date displayed in the header and calls a funciton to generate the required time blocks
function updateDate() {
    $("#currentDay").text(currentDate.format("dddd Do MMMM YYYY"));
    if (currentDate.unix() == moment().set({hour: 0, minute: 0, second: 0}).unix()) {
        $("#today").addClass("invisible"); // Hide the link it the selected day is today
    } else {
        $("#today").removeClass("invisible"); // Show the link it the selected day is not today
    }
    createTimeBlocks();
}

// Creates all of the required time blocks based on user settings. 
// Defaults apply if no settings have been updated.
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
    // Set text input colours
    updateBlockColours();
}

// Processes all of the displayed timeblocks and colour codes them accordingly
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

    // If a timer is not set I need to set one.
    // - For automatic updating of colours if the hour changes whilst a user is on the page
    if (!timer) {
        // Run at again on the next hour to update colours as the day advances.
        let next = moment();
        next.set({hour: next.hour() + 1, minute: 0, second: 3}); // Set seconds to 3 because timer seemed to drift and run early on ocassion
        next = (next.unix() - moment().unix()) * 1000; // Time to next hour (seconds to milliseconds)

        // Using setTimeout rather than interval because the first refresh will need to be sooner than 1 hour in the future.
        timer = setTimeout(function() {
            timer = false; // Set timer to false becuase it's ran at this point so I'll need to set a new one
            updateBlockColours();
        }, next);
    }
    
}

// Handles the click event for the save buttons and saves the corresponding time block entry to local storage
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
    if (!target.hasClass("changed")) { return; } // Leave function early if there's nothing to save
    
    // Show a little animation when saving just for a bit of whimsy
    const icon = target.children();
    icon.addClass("fa-spinner fa-spin").removeClass("fa-save");
    setTimeout(function() {
        icon.addClass("fa-save").removeClass("fa-spin fa-spinner")
        let i = $(".changed").length
        target.removeClass("changed");
        // target.prop("disabled", true);

        // Bug-fix
        // Sometimes this was showing on refresh if there were unsaved events
        // prior to the refresh. This check ensures it will not display unexpectedly.
        if (i > 0) { showPopup(); } 
    }, 500);
}

// Show a popup message letting the user know an event has been saved
function showPopup(delay = 1500) {
    $('.popup').css({opacity: "1"})
    setTimeout(() => $('.popup').css({opacity: "0"}), delay);
}

// Handles the event fired when the user updates a timeblock entry
// - Colours the save button orange to give a visual prompt that the event has not been saved
function stateChange() {
    let timeID = $(this).attr("data-datetime");
    let eventButton = $(`.saveBtn[data-datetime=${timeID}]`);
    // eventButton.prop("disabled", false);
    eventButton.addClass("changed")
}

// Shows settings modal
function showModal() {
    document.getElementById("settings").showModal();
}

// Closes settings modal
function closeModal(e) { 
    e.preventDefault();
    document.getElementById("settings").close();
}


// Saves user settings in local storage
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

// Clears the entire schedule for the currently selected day.
// - Prompts the user for confimration before proceeding
function clearSchedule(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to clear this day's schedule?\nThis action cannot be undone.")) {
        for (let i = 0; i < 24; i++) {
            let timeID = moment(currentDate).set({
                hour: i,
                minute: 0,
                second: 0,
            }).unix();
            delete savedEvents[timeID];
        }
        $(".container textarea").val("");
        $(".saveBtn").removeClass("changed");
        localStorage.setItem("scheduled", JSON.stringify(savedEvents));
    }
}

// If there are unsaved changes this will request confirmation from the user
// that they do which to discard any unsaved changes (or not)
function confirmUnsaved() {
    if ($(".changed").length) {
        return confirm("Changes have not been saved.\n\nAre you sure you want to change the date?");
    } else {
        return true;
    }
}

// If there are unsaved changes this will alert the user if they try and quit the app to check if they intend
// to discard any unsaved changes (or not as the case may be)
window.onbeforeunload = function () {
    if ($(".changed").length) {
        return "Unsaved changes.";
    }
}

