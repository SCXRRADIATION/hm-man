import {ipcRenderer} from 'electron';
import {IpcService} from '../ipc/IpcService';
import * as fs from 'fs';
import {AssignmentPreview} from '../core/data/Assignments';

const ipc = new IpcService();

ipcRenderer.on('page-load', function (event, data) {
    if (fs.existsSync(data)) {
        document.getElementById('login-container').style.display = 'none';
        loadStartupContent();
    } else {
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('login-btn').addEventListener('click', async function () {
            const result = await ipc.send<boolean>('login-btn-click');
        });
    }

});


ipcRenderer.on('oauth-login-browser', function (event, data) {
    // TODO: Screen to display when user is logging in in web browser.
    const ele = document.createElement('div');
    ele.setAttribute('id', 'oauth-login-browser');
    const header = document.createElement('h1');
    header.innerHTML = 'Logging in...';
    const message = document.createElement('p');
    message.innerHTML = 'Please login with your web browser';

    const message2 = document.createElement('p');
    message2.innerHTML = 'If your web browser does not open, click the button below.';

    const br = document.createElement('br');

    const btn = document.createElement('btn');
    btn.innerHTML = 'Open Web Browser';
    btn.setAttribute('id', 'oauth-open-browser-btn');
    btn.setAttribute('class', 'btn');
    btn.addEventListener('click', async function () {
        const result = await ipc.send<boolean>('oauth-open-browser-btn-click');
    });

    ele.append(header, message, message2, br, btn);
    document.body.appendChild(ele);
});

ipcRenderer.on('oauth-login-complete', function (event, data) {
    const ele = document.getElementById('oauth-login-browser');
    if (ele) {
        document.body.removeChild(ele);
    }

    const ele2 = document.getElementById('login-container');
    if (ele2) {
        document.body.removeChild(ele2);
    }

    document.getElementById('main-container').style.display = 'block';
    loadStartupContent();
});


const loadStartupContent = function () {
    ipc.send<any>('load-startup-content');
};

ipcRenderer.on('clear-assignments-list', function (event) {
    const list = document.getElementById('assignment-list-ul');
    list.innerHTML = '';
});

ipcRenderer.on('render-assignments-error', function (event, err: Error) {
    // TODO: Add error UI
});

ipcRenderer.on('render-assignments-item', function (event, assignment: AssignmentPreview) {
    const list = document.getElementById('assignment-list-ul');

    const li = document.createElement('li');

    const listItem = document.createElement('div');
    listItem.setAttribute('class', 'assignment-list-item');

    // TODO: Respect user setting of compact mode/expanded mode
    const listCompact = document.createElement('div');
    listCompact.setAttribute('class', 'assignment-list-compact');

    const itemTitle = document.createElement('div');
    itemTitle.setAttribute('class', 'assignment-list-title');
    const title = document.createElement('p');

    const itemTime = document.createElement('div');
    itemTime.setAttribute('class', 'assignment-list-time ' + assignment.dueStatus);
    const time = document.createElement('p');

    const listFull = document.createElement('div');
    listFull.setAttribute('class', 'assignment-list-full');

    const itemDescription = document.createElement('div');
    itemDescription.setAttribute('class', 'assignment-list-description');
    const description = document.createElement('p');

    const itemCourse = document.createElement('div');
    itemCourse.setAttribute('class', 'assignment-list-course');
    const course = document.createElement('p');

    title.innerText = assignment.title;
    time.innerText = assignment.dueDays.toString() + 'd';
    description.innerText = assignment.description;
    course.innerText = assignment.courseName;

    itemTitle.appendChild(title);
    itemTime.appendChild(time);
    itemDescription.appendChild(description);
    itemCourse.appendChild(course);

    listCompact.appendChild(itemTitle);
    if (assignment.dueDays !== -1) {
        listCompact.appendChild(itemTime);
    }
    listFull.append(itemDescription, itemCourse);

    listItem.append(listCompact, listFull);
    li.appendChild(listItem);

    list.appendChild(li);
});
