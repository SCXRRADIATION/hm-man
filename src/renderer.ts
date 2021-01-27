import {ipcRenderer} from 'electron';
import {IpcService} from './IpcService';
import * as fs from 'fs';

const ipc = new IpcService();

ipcRenderer.on('page-load', function (event, data) {
    const loginContainer = document.getElementById('login-container');
    if (fs.existsSync(data)) {
        loginContainer.style.display = 'none';
    }
});

ipcRenderer.on('oauth-login-browser', function (event, data) {
    const ele = document.createElement('div');
    ele.setAttribute('id', 'oauth-login-browser');
    const header = document.createElement('h1');
    header.innerHTML = "Logging in..."
    const message = document.createElement('p');
    message.innerHTML = "Please login with your web browser";
    ele.append(header, message);
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
});

const btn = document.getElementById('login-button');

btn.addEventListener('click', async function () {
    const result = await ipc.send<boolean>('test-button-click');
    if (!result) {
        document.getElementById('login-status').innerHTML = 'Error logging you in. Please try again.';
        return;
    }
    // TODO: Logged in successfully
});
