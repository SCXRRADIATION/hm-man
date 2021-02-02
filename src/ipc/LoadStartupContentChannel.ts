import {IpcChannelInterface, IpcRequest} from './IpcService';
import {Assignments} from '../core/data/Assignments';

export class LoadStartupContentChannel implements IpcChannelInterface {

    getName(): string {
        return 'load-startup-content';
    }

    handle(event: Electron.IpcMainEvent, request: IpcRequest): void {
        event.sender.send('clear-assignments-list');

        Assignments.loadAssignmentPreviews({}, (err, assignment) => {
            if (err) {
                event.sender.send('render-assignments-error', new Error(err));
                return;
            }

            event.sender.send('render-assignments-item', assignment);
        });
    }

}
