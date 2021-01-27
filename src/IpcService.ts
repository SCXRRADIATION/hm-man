import {IpcRenderer} from 'electron';
import {IpcRequest} from './main';

export class IpcService {
    private ipcRenderer?: IpcRenderer;

    private initIpcRenderer() {
        this.ipcRenderer = window.require('electron').ipcRenderer;
    }

    public send<T>(channel: string, request: IpcRequest = {}): Promise<T> {
        if (!this.ipcRenderer) {
            this.initIpcRenderer();
        }

        const ipcRenderer = this.ipcRenderer;
        ipcRenderer.send(channel, request);

        return new Promise(resolve => {
            ipcRenderer.once(request.responseChannel, (event, response) => {
                resolve(response);
            });
        });
    }
}