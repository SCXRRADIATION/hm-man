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

export class LoadStartupContentChannel implements IpcChannelInterface {

    getName(): string {
        return 'load-startup-content';
    }

    handle(event: Electron.IpcMainEvent, request: IpcRequest): void {

        State.oauthWorkflow.ensureLoggedIn(result => {
            if (!result){
                return; // Not Logged In
            }

            const auth = State.oauthWorkflow.oAuth2Client;

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
        })

    }

}
