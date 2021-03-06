// Constants
const matriculationId = '7055197';
const serverUrl = 'http://dhbw.radicalsimplicity.com/calendar/' + matriculationId + '/';
const eventStatus = ['Free', 'Tentative', 'Busy'];
const defaultEventColor = '#007bff';

// Data
let events = [];
let currentEvent;
let categories = [];
let editDisabled = true;
let view = 0;
let modalOpen = false;
let date = new Date();
let filter;


// HTML Elements
const monthView = document.getElementById('calendarMonthView');
const listView = document.getElementById('listView');
const categoryView = document.getElementById('categoryView');
const categoryList = document.getElementById('category-list');
const navBarLinks = document.getElementById('navbar-links');
const eventList = document.getElementById('event-list');
const footer = document.getElementById('modalFooter');
const title = document.getElementById('titleField');
const loc = document.getElementById('locationField');
const desc = document.getElementById('descField');
const startDate = document.getElementById('startDateField');
const startTime = document.getElementById('startTimeField');
const endDate = document.getElementById('endDateField');
const endTime = document.getElementById('endTimeField');
const allDay = document.getElementById('allDaySwitch');
const organizer = document.getElementById('organizerField');
const webPage = document.getElementById('webPageField');
const statusGroup = document.getElementById('statusGroup');
const copyright = document.getElementById('copyright-text');
const topImage = document.getElementById('modalImage');
const confirmationTitle = document.getElementById('confirmationTitle');
const confirmationBody = document.getElementById('confirmationBody');
const confirmationYes = document.getElementById('confirmationYes');
const detailsForm = document.getElementById('detailsForm');
const modalDelete = document.getElementById('modalDeleteButton');
const modalSaveIcon = document.getElementById('modalSaveIcon');
const modalSaveText = document.getElementById('modalSaveText');
const categoryDropdownList = document.getElementById('categoryDropdown');
const categoryDropdownButton = document.getElementById('categoryDropdownButton');
const newCategoryField = document.getElementById('newCategoryField');
const topImageContainer = document.getElementById('top-image-container');
const hoverImage = document.getElementById('hover-image');
const imageInput = document.getElementById('image-input');
const monthTable = document.getElementById('monthTableBody');
const calendarTitle = document.getElementById('calendarTitle');
const filterButton = document.getElementById('filterButton');
const filterDropdown = document.getElementById('filterDropdown');
const colorPicker = document.getElementById('colorPicker');
const modalDuplicate = document.getElementById('modalDuplicateButton');

// jQuery
const $detailsModal = $('#detailsModal');
const $confirmationModal = $('#confirmationModal');
const $clickableFields = $('.clickable');

// Listeners
document.addEventListener('keydown', ev => {
    if (view === 0 && !$detailsModal.hasClass('show') && !$confirmationModal.hasClass('show')) {
        switch (ev.code) {
            case 'ArrowLeft':
                showPrevious();
                break;
            case 'ArrowRight':
                showNext();
                break;
        }
    }
    if ($confirmationModal.hasClass('show')) {
        if (ev.code === 'Enter') {
            ev.preventDefault();
            confirmationYes.click();
        }
    }
});

$clickableFields.on('click', ev => {
    if (ev.target.tagName === 'INPUT' && ev.target.disabled === true) {
        const value = ev.target.value;
        const type = ev.target.placeholder.toLowerCase()
        clickField(type, value);
    }

});

$detailsModal.on('hidden.bs.modal', () => {
    modalOpen = false;
    loadEvents();
});

allDay.onchange = () => checkAllDay();
newCategoryField.onkeypress = ev => newCategoryKeyPress(ev, null);

startDate.onchange = initTime;
endDate.onchange = initTime;
startTime.onchange = initTime;
endTime.onchange = initTime;

loadEvents();
loadView();


// TODO: Drag and drop events

function newCategoryKeyPress(ev, name) {
    if (ev.code === 'Enter') {
        ev.preventDefault();
        addCategory(name);
    }
}

function duplicateEvent() {
    if (currentEvent != null) {
        addEvent();
    }
}

function dropImage(ev) {
    if (!editDisabled) {
        ev.preventDefault();
        let file;
        if (ev.dataTransfer.items != null) {
            if (ev.dataTransfer.items[0].kind === 'file') {
                file = ev.dataTransfer.items[0].getAsFile();
            }
        } else {
            file = ev.dataTransfer.files[0];
        }
        setUploadedImage(file);
    }
}

function dragOverImage(ev) {
    if (!editDisabled) {
        ev.preventDefault();
    }
}

function loadView() {
    const storedView = localStorage.getItem('view');
    if (storedView != null) {
        view = parseInt(storedView);
    }

    monthView.style.display = 'none';
    listView.style.display = 'none';
    categoryView.style.display = 'none';

    switch (view) {
        case 1:
            listView.style.display = 'block';
            break;
        case 2:
            categoryView.style.display = 'block';
            break;
        default:
            monthView.style.display = 'block';
            break;
    }

    for (let i in navBarLinks.children) {
        if (typeof i === 'number') {
            if (i === String(view)) {
                navBarLinks.children[i].classList.add('active');
            } else {
                navBarLinks.children[i].classList.remove('active');
            }
        }
    }
}

function clickField(type, value) {
    if (value.length > 0) {
        switch (type) {
            case 'location':
                open('https://www.google.de/maps/search/' + value + '/');
                break;
            case 'organizer':
                open('mailto:' + value);
                break;
            case 'webpage':
                open(value);
                break;
        }
    }
}

function changeView(index) {
    view = index;
    localStorage.setItem('view', view);
    loadView();
}

function fillDaysOfMonth() {
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getUTCDay();
    let dayCounter = -firstDay;
    let months = 0;
    let today = new Date();

    const dateFormat = new Intl.DateTimeFormat('en', {year: 'numeric', month: 'long'})
    calendarTitle.innerText = dateFormat.format(date);

    clearContent(monthTable);
    for (let r = 0; months < 2; r++) {
        resetOffsets();
        const row = monthTable.insertRow();
        for (let c = 0; c < 7; c++) {
            let day = new Date(date.getFullYear(), date.getMonth(), 1 + dayCounter++);
            const column = row.insertCell(c);

            column.classList.add('calendarCell');
            column.ondragover = ev => ev.preventDefault();
            column.ondrop = ev => {
                ev.preventDefault();
                const index = ev.dataTransfer.getData('index');
                currentEvent = events[index];
                const startTime = new Date(currentEvent.start).getTime();
                const endTime = new Date(currentEvent.end).getTime();

                const length = Math.floor((endTime - startTime) / (1000 * 3600 * 24));

                const dayOfMonth = parseInt(column.getElementsByClassName('innerCell')[0].innerHTML);
                day.setDate(dayOfMonth);
                const startDateString = day.getFullYear() + '-' + ('0' + (day.getMonth() + 1))
                                            .slice(-2) + '-' + ('0' + day.getDate()).slice(-2);
                day.setDate(dayOfMonth + length);
                const endDateString = day.getFullYear() + '-' + ('0' + (day.getMonth() + 1))
                                            .slice(-2) + '-' + ('0' + day.getDate()).slice(-2);

                currentEvent.start = startDateString + currentEvent.start.substring(10, currentEvent.start.length);
                currentEvent.end = endDateString + currentEvent.end.substring(10, currentEvent.end.length);
                updateDetails();
                saveChanges();

            };

            if (day.getDate() === 1) {
                months++;
            }
            if (months !== 1) {
                column.classList.add('previousNextMonth')
            }
            if (day.toDateString() === today.toDateString()) {
                column.classList.add('calendarCellToday');
            }

            const innerCell = document.createElement('div');
            innerCell.classList.add('innerCell');
            innerCell.onclick = () => showAddEvent(day);
            innerCell.innerText = day.getDate().toString();
            column.appendChild(innerCell);

            const eventsOfDay = getEventsOfDayByOffset(day);
            calculateOffsets(eventsOfDay);
            fillDay(column, day, eventsOfDay);
        }
    }
}

function fillDay(column, day, eventsOfDay) {

    const buttons = document.createElement('div');

    const maxOffsetEvent = eventsOfDay.sort((a, b) => a.offset < b.offset ? 1 : -1)[0];
    if (maxOffsetEvent != null) {
        const maxOffset = maxOffsetEvent.offset;
        for (let i = 0; i <= maxOffset; i++) {
            const event = eventsOfDay.find(value => value.offset === i);

            const backgroundColor = getColorElseDefault(event);
            const textColor = getTextColorFromBackgroundColor(backgroundColor);
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('btn', 'btn-sm', 'btn-primary', 'calendarEvent');
            button.style.backgroundColor = backgroundColor;
            button.style.borderColor = backgroundColor;
            button.style.color = textColor;

            if (event == null) {
                button.disabled = true;
                button.innerText = 'spacer';
            } else {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                button.onclick = () => showDetails(event);
                button.innerHTML = '&nbsp;';

                if (day.getMonth() === startDate.getMonth() && day.getDate() === startDate.getDate()) {
                    button.innerText = event.title;
                    button.classList.add('eventStart');

                    button.draggable = true;
                    button.ondragstart = ev => {
                        ev.dataTransfer.setData('index', events.indexOf(event).toString());
                    }
                }
                if (day.getMonth() === endDate.getMonth() && day.getDate() === endDate.getDate()) {
                    button.classList.add('eventEnd');
                }
            }
            buttons.appendChild(button);
        }
    }


    column.appendChild(buttons);
}

function updateCategories() {
    setFilterCategory(-1);
    clearContent(filterDropdown);
    clearContent(categoryList);
    const allButton = document.createElement('a');
    allButton.classList.add('dropdown-item');
    allButton.href = '#';
    allButton.onclick = () => setFilterCategory(-1);
    allButton.innerText = 'All';
    filterDropdown.appendChild(allButton);

    if (categories.length > 0) {
        categories.forEach(category => {
            const filterElement = document.createElement('a');
            filterElement.innerText = category.name;
            filterElement.classList.add('dropdown-item')
            filterElement.href = '#';
            filterElement.onclick = () => setFilterCategory(categories.indexOf(category));
            filterDropdown.appendChild(filterElement);

            const listCat = document.createElement('a');
            listCat.classList.add('list-group-item', 'list-group-item-action', 'category-list');
            listCat.href = '#';
            listCat.onclick = () => deleteAsk('category', category);
            listCat.innerText = category.name;
            categoryList.appendChild(listCat);
        });

    } else {
        categoryList.innerText = "There are no categories!";
    }

    const addBox = document.createElement('a');
    const addGroup = document.createElement('div');
    const addInput = document.createElement('input');
    const addAppend = document.createElement('div');
    const addAppendButton = document.createElement('button');

    addBox.classList.add('list-group-item', 'list-group-item-action', 'list-item-noHover');
    addBox.href = '#';

    addGroup.classList.add('input-group');
    addInput.classList.add('form-control');
    addInput.placeholder = 'New Category';
    addInput.onkeypress = ev => newCategoryKeyPress(ev, addInput.value);

    addAppend.classList.add('input-group-append')

    addAppendButton.classList.add('btn', 'btn-outline-secondary', 'material-icons');
    addAppendButton.innerText = 'add';
    addAppendButton.onclick = () => addCategory(addInput.value);

    addAppend.append(addAppendButton);
    addGroup.append(addInput);
    addGroup.append(addAppend);
    addBox.append(addGroup);
    categoryList.appendChild(addBox);
}

function getTextColorFromBackgroundColor(color) {
    const noHash = color.substring(1);
    const rgb = parseInt(noHash, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (brightness < 128) {
        return 'white';
    } else {
        return 'black';
    }
}

function getDescriptionElseEmpty(event) {
    if (event != null && event.extra != null && event.extra.desc != null) {
        return event.extra.desc
    }
    return '';
}

function getColorElseDefault(event) {
    if (event != null && event.extra != null && event.extra.color != null) {
        return event.extra.color
    }
    return defaultEventColor;
}

function setFilterCategory(index) {
    filter = categories[index];
    filterButton.innerText = filter != null ? filter.name : 'Filter';
    fillDaysOfMonth();
}

function calculateOffsets(eventsOfDay) {
    eventsOfDay.forEach(event => {
        if (event.offset == null) {
            for (let x = 0; x < eventsOfDay.length; x++) {
                if (isOffsetFree(eventsOfDay, x)) {
                    event.offset = x;
                }
            }
        }
    });
}

function getEventsOfDayByOffset(day) {
    if (filter != null) {
        return events.filter(e => e.categories.filter(c => c.id === filter.id).length > 0)
            .filter(e => isDateInBetweenDates(day, new Date(e.start), new Date(e.end)))
            .sort((a, b) => a.offset < b.offset ? -1 : 1);
    } else {
        return events.filter(e => isDateInBetweenDates(day, new Date(e.start), new Date(e.end)))
            .sort((a, b) => a.offset < b.offset ? -1 : 1);
    }

}

function isOffsetFree(eventSource, offset) {
    return eventSource.find(e => e.offset === offset) == null;
}

function resetTime(date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
}

function resetOffsets() {
    events.forEach(event => {
        event.offset = null;
    })
}

function showToday() {
    date = new Date();
    fillDaysOfMonth();
}

function showPrevious() {
    date.setMonth(date.getMonth() - 1);
    fillDaysOfMonth();
}

function showNext() {
    date.setMonth(date.getMonth() + 1);
    fillDaysOfMonth();
}

function updateList() {
    if (events.length > 0) {
        clearContent(eventList);
        events.forEach(event => {
            const entry = document.createElement('a');
            const backgroundColor = getColorElseDefault(event);
            const textColor = getTextColorFromBackgroundColor(backgroundColor);
            entry.classList.add('list-group-item', 'list-group-item-action', 'event-list');
            entry.href = '#';
            entry.onclick = () => showDetails(event);
            entry.innerText = event.title;
            entry.addEventListener('mouseenter', () => {
                entry.style.backgroundColor = backgroundColor;
                entry.style.color = textColor;
            });
            entry.addEventListener('mouseleave', () => {
                entry.style.backgroundColor = 'white';
                entry.style.color = 'black';
            });

            eventList.appendChild(entry);
        });
    } else {
        eventList.innerText = "There are no events!";
    }
}

function setUploadedImage(file) {
    if (file == null) {
        file = imageInput.files[0];
    }
    if (file != null) {
        if (file.size < 500000) {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = (ev) => {
                const base64 = ev.target.result;
                const type = base64.substring(5, 15);
                if (type === 'image/png;' || type === 'image/jpeg') {
                    topImage.src = base64;
                    currentEvent.imagedata = base64;
                } else {
                    showErrorAlert('File is not a png or jpeg file!');
                }
            }
        } else {
            showErrorAlert('File is larger than 500 kb!');
        }
    }
}

function updateDetails() {
    if (currentEvent != null) {
        title.value = getValueElseEmpty(currentEvent.title);
        loc.value = getValueElseEmpty(currentEvent.location);
        desc.value = getDescriptionElseEmpty(currentEvent);
        colorPicker.value = getColorElseDefault(currentEvent);
        startDate.value = getDate(currentEvent.start);
        startTime.value = getTime(currentEvent.start);
        endDate.value = getDate(currentEvent.end);
        endTime.value = getTime(currentEvent.end);
        allDay.checked = currentEvent.allday;
        organizer.value = getValueElseEmpty(currentEvent.organizer);
        webPage.value = getValueElseEmpty(currentEvent.webpage);

        if (currentEvent.imageurl == null) {
            if (currentEvent.imagedata == null) {
                topImage.src = 'img/calendar.jpg';
            } else {
                topImage.src = currentEvent.imagedata;
            }
        } else {
            topImage.src = currentEvent.imageurl;
        }

        updateCategoryDropdownList();
        initTime();
    }
}

function updateCategoryDropdownList() {
    categoryDropdownButton.innerText = beautifyCategories();

    clearContent(categoryDropdownList);
    if (categories.length === 0) {
        const noFoundMessage = document.createElement('a');
        noFoundMessage.classList.add('dropdown-item');
        noFoundMessage.href = '#';
        noFoundMessage.innerText = 'No Categories found';
        categoryDropdownList.appendChild(noFoundMessage);
    } else {
        categories.forEach(cat => {
            const dropdownItem = document.createElement('div');
            dropdownItem.classList.add('dropdown-item');

            const checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.classList.add('categoryCheckbox');

            const label = document.createElement('label');
            label.innerText = cat.name;

            if (currentEvent.categories != null
                && currentEvent.categories.filter(value => value.id === cat.id).length > 0) {
                dropdownItem.onclick = () => setOrClearCategory(cat.id, false);
                checkBox.checked = true;
            } else {
                dropdownItem.onclick = () => setOrClearCategory(cat.id, true);
            }

            dropdownItem.appendChild(checkBox);
            dropdownItem.appendChild(label);
            categoryDropdownList.appendChild(dropdownItem);
        });
    }
}

function setOrClearCategory(catId, set) {
    const categoryById = categories.find(c => c.id === catId);
    if (set) {
        if (currentEvent.categories != null) {
            currentEvent.categories.push(categoryById);
        } else {
            currentEvent.categories = [categoryById];
        }

    } else {
        currentEvent.categories = currentEvent.categories.filter(c => c.id !== catId);
    }
    currentEvent.categories = currentEvent.categories.sort((a, b) => a.id - b.id);
    updateCategoryDropdownList();
}


function enableEditMode(value) {
    editDisabled = !value;

    if (editDisabled) {
        detailsForm.action = 'javascript:enableEditMode(true)';
        modalSaveIcon.innerText = 'edit';
        modalSaveText.innerText = 'Edit';
        modalDelete.style.display = 'block';
        modalDuplicate.style.display = 'block';

        topImageContainer.classList.remove('top-image-container-hover');
        topImageContainer.classList.add('top-image-container-view')
        hoverImage.title = '';
        hoverImage.onclick = null;

    } else {
        modalSaveIcon.innerText = 'save';
        modalSaveText.innerText = 'Save';
        detailsForm.action = 'javascript:saveChanges()';

        topImageContainer.classList.add('top-image-container-hover')
        topImageContainer.classList.remove('top-image-container-view')
        hoverImage.title = 'Click or drop file here to set image...';
        hoverImage.onclick = () => imageInput.click();
    }

    title.disabled = editDisabled;
    loc.disabled = editDisabled;
    desc.disabled = editDisabled;
    startDate.disabled = editDisabled;
    startTime.disabled = editDisabled;
    endDate.disabled = editDisabled;
    endTime.disabled = editDisabled;
    allDay.disabled = editDisabled;
    organizer.disabled = editDisabled;
    webPage.disabled = editDisabled;
    categoryDropdownButton.disabled = editDisabled;
    colorPicker.disabled = editDisabled;
    const statusButtons = document.getElementsByClassName('statusButtons');
    for (let i in statusButtons) {
        statusButtons[i].disabled = editDisabled;
    }
    checkAllDay();
}

function showDetails(event) {
    modalOpen = true;
    currentEvent = event;
    changeStatus(eventStatus.indexOf(currentEvent.status));
    updateDetails();
    enableEditMode(false);


    detailsForm.action = 'javascript:enableEditMode(true)';
    modalSaveIcon.innerText = 'edit';
    modalSaveText.innerText = 'Edit';
    modalDelete.style.display = 'block';
    modalDuplicate.style.display = 'block';

    $detailsModal.modal({
        backdrop: 'static',
        keyboard: true
    })

}

function showAddEvent(date) {
    currentEvent = {};
    updateDetails();

    if (date == null) {
        date = new Date();
    }
    const dateString = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1))
        .slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    startDate.value = dateString;
    endDate.value = dateString;

    changeStatus(0);
    enableEditMode(true);
    checkAllDay();

    modalDelete.style.display = 'none';
    modalDuplicate.style.display = 'none';
    modalSaveIcon.innerText = 'add';
    modalSaveText.innerText = 'Add';
    detailsForm.action = "javascript:addEvent()";


    $detailsModal.modal({
        backdrop: 'static',
        keyboard: true
    })
}

function changeStatus(statusIndex) {
    currentEvent.status = eventStatus[statusIndex];

    clearContent(statusGroup);
    for (let i in eventStatus) {
        const statusButton = document.createElement('button');
        statusButton.type = 'button';
        statusButton.classList.add('btn', 'statusButtons');
        statusButton.onclick = () => changeStatus(i);
        statusButton.innerText = eventStatus[i];

        if (i === String(statusIndex)) {
            statusButton.classList.add('btn-secondary');
        } else {
            statusButton.classList.add('btn-outline-secondary');
        }
        statusGroup.appendChild(statusButton);
    }
}

function setCurrentEventFromModalValues() {
    let extra = {
        desc: desc.value,
        color: colorPicker.value
    };

    currentEvent = {
        id: currentEvent.id,
        title: title.value,
        location: loc.value,
        organizer: organizer.value,
        start: combineDateTime(startDate.value, startTime.value),
        end: combineDateTime(endDate.value, endTime.value),
        status: currentEvent.status,
        allday: allDay.checked,
        webpage: webPage.value,
        categories: currentEvent.categories,
        extra: extra,
        imagedata: currentEvent.imagedata
    };
}

function deleteAsk(type, dataCategory) {
    if (type === 'event') {
        confirmationTitle.innerText = "Delete Event";
        confirmationBody.innerText = "Are you sure you want to delete \"" + currentEvent.title + "\" ?";
        confirmationYes.onclick = () => deleteEvent();

    } else {
        confirmationTitle.innerText = "Delete Category";
        confirmationBody.innerText = "Are you sure you want to delete \"" + dataCategory.name + "\" ?";
        confirmationYes.onclick = () => deleteCategory(dataCategory);
    }

    $confirmationModal.modal({
        backdrop: 'static',
        keyboard: true
    })
}


// Utils

function checkAllDay() {
    currentEvent.allday = allDay.checked;
    if (allDay.checked) {
        startTime.disabled = true;
        endTime.disabled = true;
        startTime.value = '00:00';
        endTime.value = '23:59';
    } else {
        if(!editDisabled){
            startTime.disabled = false;
            endTime.disabled = false;
        }
    }
}

function initTime() {
    endDate.min = startDate.value;
    if (endDate.value === startDate.value) {
        endTime.min = startTime.value;
    } else {
        endTime.min = '';
    }
}

function clearContent(element) {
    element.innerHTML = '';
}

function beautifyCategories() {
    let output = '';
    for (let i in currentEvent.categories) {
        output += currentEvent.categories[i].name;
        if (i < currentEvent.categories.length - 1) {
            output
                += ', '
        }
    }
    if (output.length === 0) {
        return 'None';
    }
    return output;
}

function getValueElseEmpty(value) {
    if (value != null) {
        return value;
    }
    return '';
}

function isDateInBetweenDates(dateToTest, beginDate, endDate) {
    resetTime(dateToTest);
    resetTime(beginDate);
    resetTime(endDate);
    return (dateToTest >= beginDate && dateToTest <= endDate);
}

function getDate(dateTime) {
    return getValueElseEmpty(dateTime).substring(0, 10);
}

function getTime(dateTime) {
    return getValueElseEmpty(dateTime).substring(11, 16);
}

function combineDateTime(date, time) {
    return date + 'T' + time;
}

function showRequestError(request) {
    const error = JSON.parse(request.responseText);
    alert('Error ' + error.code + ': ' + error.description);
}

function showErrorAlert(msg) {
    if (msg != null) {
        alert('Error: ' + msg);
    } else {
        alert('Error! Please try again.')
    }
}

// Server Communication

function loadEvents() {
    const request = new XMLHttpRequest();
    request.open('GET', serverUrl + 'events/');
    request.send();
    request.addEventListener('load', () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                const responseJson = JSON.parse(request.responseText);
                if (responseJson.length === 0) {
                    console.log('No events found!');
                } else {
                    events = responseJson.sort((a, b) => new Date(a.start) - new Date(b.start));
                    console.log('Loaded ' + events.length + ' events...');
                }
                updateList();
                fillDaysOfMonth();
            } else {
                showRequestError(request);
            }
        }
    });
    loadCategories();
}

function loadCategories() {
    const request = new XMLHttpRequest();
    request.open('GET', serverUrl + 'categories');
    request.send();
    request.addEventListener('load', () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                const responseJson = JSON.parse(request.responseText);
                if (responseJson.length === 0) {
                    console.log('No categories found!');
                } else if (JSON.stringify(categories) !== JSON.stringify(responseJson)) {
                    categories = responseJson;
                    console.log('Loaded ' + categories.length + ' categories...');
                }
                updateCategories();
                updateDetails();
            } else {
                showRequestError(request);
            }
        }
    });
}

function addCategory(name) {
    if (name == null) {
        name = newCategoryField.value;
    }
    const category = {name: name};
    newCategoryField.value = '';
    const request = new XMLHttpRequest();
    request.open('POST', serverUrl + 'categories');
    request.send(JSON.stringify(category));
    request.addEventListener('load', () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                loadCategories();
            } else {
                showRequestError(request);
            }
        }
    });
}

function deleteCategory(category) {
    const request = new XMLHttpRequest();
    request.open('DELETE', serverUrl + 'categories/' + category.id);
    request.send();
    request.addEventListener('load', () => {
        if (request.readyState === 4) {
            if (request.status === 204) {
                loadEvents();
            } else {
                showRequestError(request);
            }
        }
    });
}

function addEvent() {
    $detailsModal.modal('hide');
    setCurrentEventFromModalValues()
    const request = new XMLHttpRequest();
    request.open('POST', serverUrl + 'events');
    request.send(JSON.stringify(currentEvent));
    request.addEventListener('load', () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                loadEvents();
            } else {
                showRequestError(request);
            }
        }
    });
}

function saveChanges() {
    $detailsModal.modal('hide');
    setCurrentEventFromModalValues();
    const request = new XMLHttpRequest();
    request.open('PUT', serverUrl + 'events/' + currentEvent.id);
    request.send(JSON.stringify(currentEvent));
    request.addEventListener('load', () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                updateList();
                fillDaysOfMonth();
            } else {
                showRequestError(request);
            }
        }
    });
}


function deleteEvent() {
    const request = new XMLHttpRequest();
    request.open('DELETE', serverUrl + 'events/' + currentEvent.id);
    request.send();
    request.addEventListener('load', () => {
        if (request.readyState === 4) {
            if (request.status === 204) {
                loadEvents();
            } else {
                showRequestError(request);
            }
        }
    });
}
