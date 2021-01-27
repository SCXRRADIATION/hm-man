import {app, BrowserWindow, IpcMain, ipcMain, IpcMainEvent, dialog, remote} from 'electron';
import * as path from 'path';
import * as windowStateKeeper from 'electron-window-state';
import {TestButtonChannel} from './TestButtonChannel';
import * as http from 'http';
import * as net from 'net';
import * as fs from 'fs';
import {OAuthWorkflow} from "./OAuthWorkflow";

export class State {
    public static oauthWorkflow: OAuthWorkflow = new OAuthWorkflow();
}

export class CredentialState {
    public static TOKEN_PATH = path.join(app.getPath('userData'), 'token.json');
}

class Main {
    private mainWindow: BrowserWindow;

    public init(ipcChannels: IpcChannelInterface[]) {
        app.setName('Homework Manager');

        app.on('ready', this.createWindow);
        app.on('window-all-closed', this.onWindowAllClosed);
        app.on('activate', this.onActivate);

        this.registerIpcChannels(ipcChannels);
    }

    private createWindow() {
        // Load the previous state with fallback to defaults
        let mainWindowState = windowStateKeeper({
            defaultWidth: 1000,
            defaultHeight: 800
        });

        const {width, height, x, y} = mainWindowState;

        this.mainWindow = new BrowserWindow({
            width: width,
            height: height,
            x: x,
            y: y,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        this.mainWindow.setMenu(null);

        this.mainWindow.loadFile(path.join(__dirname, '../index.html'));
        mainWindowState.manage(this.mainWindow);

        this.mainWindow.webContents.on('did-finish-load', () => {
            this.mainWindow.webContents.send('page-load', CredentialState.TOKEN_PATH);
        });

        this.mainWindow.webContents.openDevTools();
    }

    private onWindowAllClosed() {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    }

    private onActivate() {
        if (!this.mainWindow) {
            this.createWindow();
        }
    }

    private registerIpcChannels(ipcChannels: IpcChannelInterface[]) {
        ipcChannels.forEach(channel => {
            ipcMain.on(channel.getName(), (event, request) => {
                channel.handle(event, request);
            });
        });
    }
}

export interface IpcRequest {
    responseChannel?: string;

    params?: string[];
}

export interface IpcChannelInterface {
    getName(): string

    handle(event: IpcMainEvent, request: IpcRequest): void;
}

(new Main()).init([
    new TestButtonChannel()
]);
