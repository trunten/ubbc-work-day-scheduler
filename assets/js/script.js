const HOUR_START = 9;
const HOUR_END = 21;
const timeBlockContainer = $(".container");

// event listeners
timeBlockContainer.on("click", ".saveBtn", save);
timeBlockContainer.on('input', "textarea", stateChange);
$("#date-down").on("click", function() {
    currentDate.subtract(1, 'days');
    updateDate();
});
$("#date-up").on("click", function() {
    currentDate.add(1, 'days');
    updateDate();
});

// Initial state
let savedEvents = JSON.parse(localStorage.getItem("scheduled")) || {};
let currentDate = moment().set({hour: 0, minute: 0, second: 0});

updateDate();

function updateDate() {
    $("#currentDay").text(currentDate.format("dddd Do MMMM YYYY"));
    createTimeBlocks();
}

function createTimeBlocks() {
    $(".row").remove();
    for (let i = HOUR_START; i <= HOUR_END; i++) {
        // Set hour to current loop index
        let hour = moment(currentDate).set({
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
        if (timeID < now) {
            textInput.addClass("past");
        } else if (timeID > now) {
            textInput.addClass("future");
        } else {
            textInput.addClass("present");
        }
    })

    // Run at again on the next hour to update colours as the day advances.
    let next = moment();
    next.set({hour: next.hour() + 1, minute: 0, second: 3}); // Set seconds to 3 because timer seemed to drift and run early on ocassion
    console.log(next);
    next = (next.unix() - moment().unix()) * 1000; //seconds to milliseconds
    setTimeout(updateBlockColours, next);
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

