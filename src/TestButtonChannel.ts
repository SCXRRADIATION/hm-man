import {app, dialog, IpcMainEvent, shell} from 'electron';
import {IpcChannelInterface, IpcRequest} from './main';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import {State, CredentialState} from './main';
import * as net from 'net';

import {google, oauth2_v2} from 'googleapis';
import * as http from 'http';
import {OAuthWorkflow} from "./OAuthWorkflow";

export class TestButtonChannel implements IpcChannelInterface {

    getName(): string {
        return 'test-button-click';
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
                if (!result) {
                    event.sender.send('oauth-login-browser');
                }
            }, result => {
                if (result) {
                    console.log("User is logged in, now we can do something");
                    event.sender.send('oauth-login-complete');
                }
            });
        });
    }

    // TODO: Factor this in somewhere
    /*private listCourses(auth: any) {
        const classroom = google.classroom({version: 'v1', auth});

        classroom.courses.list({
            pageSize: 10
        }, (err, res) => {
            if (err) {
                return console.error('The API returned an error: ' + err);
            }

            console.log(res.data);

            const courses = res.data.courses;
            if (courses && courses.length) {
                console.log('Courses:');
                courses.forEach((course) => {
                    console.log(`${course.name} (${course.id})`);
                    classroom.courses.courseWork.list({
                        courseId: course.id,
                        pageSize: 30
                    }, (err, res) => {
                        if (err) {
                            return console.error('The API returned an error: ' + err);
                        }

                        res.data.courseWork.forEach((courseWork) => {
                            let id = courseWork.id;
                            classroom.courses.courseWork.studentSubmissions.list({
                                courseId: course.id,
                                courseWorkId: id
                            }, (err, res) => {
                                if (err) {
                                    return console.error('The API returned an error: ' + err);
                                }

                                console.log(res.data);
                            });
                        });
                    });
                });
            } else {
                console.log('No courses found');
            }
        });
    }*/

}
