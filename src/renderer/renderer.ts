import {ipcRenderer} from 'electron';
import {IpcService} from '../ipc/IpcService';
import * as fs from 'fs';

const ipc = new IpcService();

ipcRenderer.on('page-load', function (event, data) {
    const loginContainer = document.getElementById('login-container');
    if (fs.existsSync(data)) {
        loginContainer.style.display = 'none';
        loadStartupContent()
    }
    else
    {
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
    loadStartupContent()
});

const loadStartupContent = function()
{
    ipc.send<any>('load-startup-content');
}