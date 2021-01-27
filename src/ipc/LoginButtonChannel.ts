import {app, dialog, IpcMainEvent, shell} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import {State, CredentialState} from '../main';
import * as net from 'net';

import {google, oauth2_v2} from 'googleapis';
import * as http from 'http';
import {OAuthError, OAuthWorkflow} from "../core/auth/OAuthWorkflow";
import {IpcChannelInterface, IpcRequest} from "./IpcService";

export class LoginButtonChannel implements IpcChannelInterface {

    getName(): string {
        return 'login-btn-click';
    }

    handle(event: Electron.IpcMainEvent, request: IpcRequest): void {
        const CREDENTIALS_PATH = path.join(app.getPath('userData'), 'credentials.json');

        fs.readFile(CREDENTIALS_PATH, (err, content) => {
            if (err) {
                dialog.showErrorBox('Homework Manager', 'No credentials.json file found!\n' +
                    '\nPlease create your API key at https://developers.google.com/classroom/quickstart/nodejs \n\nand' +
                    ' save the credentials.json file to: ' + CREDENTIALS_PATH.toString());
                return;
            }

            State.oauthWorkflow.authorize(JSON.parse(content.toString()), result => {
                if (result == OAuthError.NOT_LOGGED_IN) {
                    event.sender.send('oauth-login-browser');
                }
            }, result => {
                if (result) {
                    event.sender.send('oauth-login-complete');
                }
            });
        });
    }
}
