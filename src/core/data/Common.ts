export const RejectionReason = {
    NOT_LOGGED_IN: "Not Logged In",
    API_PERMISSION_DENIED: "API Permission Denied",
    API_INVALID_ARGUMENT: "API Invalid Argument",
    API_NOT_FOUND: "API Not Found",
    API_UNKNOWN_ERROR: "API Unknown Error"
}

export class DataCommon {

    static getAPIErrorType(err: any): string {
        let {code: number} = err;
        switch (number || 0) {
            case 401:
            case 403:
                return RejectionReason.API_PERMISSION_DENIED;
            case 400:
                return RejectionReason.API_INVALID_ARGUMENT;
            case 404:
                return RejectionReason.API_NOT_FOUND;
            default:
                return RejectionReason.API_UNKNOWN_ERROR;
        }
    }

}
