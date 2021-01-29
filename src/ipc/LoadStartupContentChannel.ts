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

export interface AssignmentPreview {
    title: string,
    due: string,
    dueStatus: string,
    description: string,
    courseName: string
}

export class LoadStartupContentChannel implements IpcChannelInterface {

    getName(): string {
        return 'load-startup-content';
    }

    handle(event: Electron.IpcMainEvent, request: IpcRequest): void {

        State.oauthWorkflow.ensureLoggedIn(result => {
            if (!result) {
                return; // Not Logged In
            }

            const auth = State.oauthWorkflow.oAuth2Client;

            const classroom = google.classroom({version: 'v1', auth});

            classroom.courses.list({
                pageSize: 10
            }, (err, res) => {
                if (err) {
                    // TODO: Display error nicely.
                    return console.error('The API returned an error: ' + err);
                }

                let assignments: AssignmentPreview[] = [];

                const courses = res.data.courses;
                if (courses && courses.length) {
                    courses.forEach((course) => {
                        if (course.courseState === 'ACTIVE') {
                            classroom.courses.courseWork.list({
                                courseId: course.id,
                                pageSize: 30
                            }, (err, res) => {
                                if (err) {
                                    return console.error('The API returned an error: ' + err);
                                }

                                res.data.courseWork?.forEach((courseWork) => {
                                    let id = courseWork.id;
                                    if (courseWork.workType === 'ASSIGNMENT') {
                                        classroom.courses.courseWork.studentSubmissions.list({
                                            courseId: course.id,
                                            courseWorkId: id,
                                        }, (err, res) => {
                                            if (err) {
                                                return console.error('The API returned an error: ' + err);
                                            }

                                            // TODO: Is indexing correct here?
                                            if (res.data.studentSubmissions[0].state !== 'TURNED_IN') {
                                                let due = '', days = 0, dueDate = courseWork.dueDate,
                                                    dueTime = courseWork.dueTime, dueStatus = 'safe';

                                                if (dueDate !== undefined && dueTime !== undefined) {
                                                    let dueDateObj = new Date(dueDate.year, dueDate.month - 1, dueDate.day, dueTime.hours, dueTime.minutes);
                                                    let diff = (dueDateObj.getTime() / 1000) - (Date.now() / 1000);
                                                    if (diff > 0) {
                                                        days = Math.round(diff / 86400);
                                                    }

                                                    if (days > 0) {
                                                        due = days.toString(10) + 'd';
                                                    } else {
                                                        due = 'Overdue';
                                                    }

                                                    if (days === 0) {
                                                        dueStatus = 'overdue';
                                                    } else if (days < 3) {
                                                        dueStatus = 'warning';
                                                    }
                                                }

                                                assignments.push({
                                                    title: courseWork.title,
                                                    description: courseWork.description?.substr(0, 100) ?? '',
                                                    courseName: course.name,
                                                    due: due,
                                                    dueStatus: dueStatus
                                                });


                                                event.sender.send('render-assignment-items', assignments);
                                            }
                                        });
                                    }

                                });
                            });
                        }
                    });
                } else {
                    console.log('No courses found');
                }
            });
        });

    }

}
