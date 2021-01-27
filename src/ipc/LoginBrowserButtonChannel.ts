import {app, dialog, IpcMainEvent, shell} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import {State, CredentialState} from '../main';
import * as net from 'net';

import {google, oauth2_v2} from 'googleapis';
import * as http from 'http';
import {OAuthError, OAuthWorkflow} from '../core/auth/OAuthWorkflow';
import {IpcChannelInterface, IpcRequest} from './IpcService';

export class LoginBrowserButtonChannel implements IpcChannelInterface {

    getName(): string {
        return 'oauth-open-browser-btn-click';
    }

    handle(event: Electron.IpcMainEvent, request: IpcRequest): void {
        State.oauthWorkflow.getNewToken();
    }
}
