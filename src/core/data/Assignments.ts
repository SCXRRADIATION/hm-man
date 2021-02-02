import {State} from '../../main';
import {DataCommon, RejectionReason} from './Common';
import {classroom_v1, google} from 'googleapis';
import Schema$Date = classroom_v1.Schema$Date;
import Schema$TimeOfDay = classroom_v1.Schema$TimeOfDay;

enum AssignmentState {
    IN_PROGRESS,
    COMPLETED
}

const AssignmentRejectionReason = {
    ...RejectionReason,
    NO_COURSES: 'No Courses'
};

interface GetAssignmentsOptions {
    pageSize?: number,
    page?: number,
    coursesPageSize?: number,
    courseWorkPageSize?: number,
    submissionsPageSize?: number,
    state?: AssignmentState
}

export enum AssignmentDueStatus {
    SAFE = "safe",
    WARNING = "warning",
    OVERDUE = "overdue"
}

export interface AssignmentPreview {
    title: string,
    dueDays: number,
    dueStatus: AssignmentDueStatus,
    description: string,
    courseName: string
}

export class Assignments {

    private static calculateDueDate(dueDate: Schema$Date, dueTime: Schema$TimeOfDay): { dueDays: number, dueStatus: AssignmentDueStatus } {
        let days = -1;

        if (dueDate !== undefined && dueTime !== undefined) {
            let dueDateObj = new Date(dueDate.year, dueDate.month - 1, dueDate.day,
                dueTime.hours, dueTime.minutes);
            let diff = (dueDateObj.getTime() / 1000) - (Date.now() / 1000);
            if (diff > 0) {
                days = Math.round(diff / 86400);
            }

            if (days === 0) {
                return {dueDays: days, dueStatus: AssignmentDueStatus.OVERDUE};
            }

            if (days < 3) {
                return {dueDays: days, dueStatus: AssignmentDueStatus.WARNING};
            }

            return {dueDays: days, dueStatus: AssignmentDueStatus.SAFE};
        }

        return {dueDays: -1, dueStatus: AssignmentDueStatus.SAFE};
    }

    public static loadAssignmentPreviews(options: GetAssignmentsOptions, callback: (err?: string, assignment?: AssignmentPreview) => void) {
        // Ensure a user is logged in
        State.oauthWorkflow.ensureLoggedIn(result => {
            if (!result) {
                callback(AssignmentRejectionReason.NOT_LOGGED_IN);
            }

            const auth = State.oauthWorkflow.oAuth2Client;
            const classroom = google.classroom({version: 'v1', auth});

            classroom.courses.list({
                pageSize: options.coursesPageSize || 10
            }, (err: any, res) => {
                if (err) {
                    callback(DataCommon.getAPIErrorType(err));
                }

                const {courses} = res.data;
                if (!courses || courses.length < 1) {
                    callback(AssignmentRejectionReason.NO_COURSES);
                }

                courses.forEach(course => {
                    const {courseState, id} = course;
                    if (courseState === 'ACTIVE') {
                        classroom.courses.courseWork.list({
                            courseId: course.id,
                            pageSize: options.courseWorkPageSize || 10
                        }, (err, res) => {
                            if (err) {
                                callback(DataCommon.getAPIErrorType(err));
                            }

                            const {courseWork} = res.data;
                            courseWork?.forEach(cw => {
                                const {workType, id: cwId, dueDate, dueTime} = cw;
                                if (workType === 'ASSIGNMENT') {
                                    classroom.courses.courseWork.studentSubmissions.list({
                                        courseId: id,
                                        courseWorkId: cwId,
                                        userId: 'me'
                                    }, (err, res) => {
                                        if (err) {
                                            callback(DataCommon.getAPIErrorType(err));
                                        }

                                        // TODO: Order and check for other pages
                                        // TODO: Use global page size counter

                                        const {studentSubmissions} = res.data;
                                        if (studentSubmissions && studentSubmissions.length > 0) {
                                            if (studentSubmissions[0].state !== 'TURNED_IN') {
                                                callback(null, {
                                                    title: cw.title || 'No Title',
                                                    description: cw.description?.substr(0, 50) ?? '',
                                                    courseName: course.name,
                                                    ...this.calculateDueDate(dueDate, dueTime),
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        });
                    }
                });
            });
        });
    }

}
