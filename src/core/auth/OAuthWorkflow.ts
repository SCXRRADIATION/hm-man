import {CredentialState, State} from "../../main";
import * as http from "http";
import * as net from "net";
import {google} from "googleapis";
import {OAuth2Client} from 'google-auth-library';
import * as fs from "fs";
import {shell} from "electron";

interface Credentials {
    installed: {
        client_id: string,
        project_id: string,
        auth_uri: string,
        token_uri: string,
        auth_provider_x509_cert_url: string,
        client_secret: string,
        redirect_uris: [string]
    }
}

export enum OAuthError {
    NO_LOCALHOST_REDIRECT,
    NOT_LOGGED_IN,
    INVALID_TOKEN,
    CANNOT_RETRIEVE_TOKEN,
    CANNOT_SAVE_TOKEN
}

type OAuthCallback = ((result: boolean | OAuthError) => void);

export class OAuthWorkflow {
    private server: http.Server;

    private SCOPES = [
        'https://www.googleapis.com/auth/classroom.announcements.readonly',
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
        'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
        'https://www.googleapis.com/auth/classroom.profile.photos',
        'https://www.googleapis.com/auth/classroom.push-notifications',
        'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
        'https://www.googleapis.com/auth/classroom.topics.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly'
    ];

    public oAuth2Client: OAuth2Client;
    private loginCallback?: OAuthCallback;

    /**
     * Checks if the user has been authenticated, otherwise opens the OAuth login URL in the web browser.
     * @param credentials The credentials stored in the credentials.json file.
     * @param callback The function to call when this method has completed.
     * @param loginCallback The function to call when a user logs in from the web browser. Will only be called if they
     * are not already logged in.
     * @returns True if the user is logged in and their token is valid or false if the token is valid or the user is
     * required to log in in the web browser.
     */
    public authorize(credentials: Credentials, callback: OAuthCallback, loginCallback?: OAuthCallback) {
        const {client_secret, client_id} = credentials.installed;

        this.server = http.createServer(this.handleLoginResponse);
        this.server.listen(0);
        const port = (<net.AddressInfo>this.server.address()).port;
        this.loginCallback = loginCallback;

        let localhostFound = false, i = 0;
        do {
            if (credentials.installed.redirect_uris[i].match(/http[s]?:\/\/localhost/gm)) {
                localhostFound = true;
            }
            i++;
        } while (!localhostFound && i < credentials.installed.redirect_uris.length);

        if (!localhostFound) {
            // Redirect URLs does not contain localhost.
            callback(OAuthError.NO_LOCALHOST_REDIRECT);
            return;
        }

        this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:' + port);

        fs.readFile(CredentialState.TOKEN_PATH, (err, token) => {
            if (err) {
                this.getNewToken()
                callback(OAuthError.NOT_LOGGED_IN);
                return;
            }

            this.server.close();
            this.oAuth2Client.setCredentials(JSON.parse(token.toString()));
            callback(true);
        });
    }

    /**
     * Opens the web browser to the Google OAuth login page.
     */
    public getNewToken() {
        const authUrl = this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES
        });

        shell.openExternal(authUrl);
    }

    /**
     * Handles the request sent to the web server after the user has granted access.
     * @param req
     * @param res
     */
    public handleLoginResponse(req: http.IncomingMessage, res: http.ServerResponse) {
        if (req.url.indexOf('code') === -1) {
            // Silently ignore requests if they do not contain a code parameter in the URL.
            return;
        }

        const code = new URL('http://localhost' + req.url).searchParams.get('code');
        res.writeHead(200, {'Content-Type': 'text/html charset=utf-8'});
        res.end(fs.readFileSync('./oauth-res.html'));
        State.oauthWorkflow.server.close();

        State.oauthWorkflow.oAuth2Client.getToken(code, (err: any, token: any) => {
            if (err) {
                State.oauthWorkflow.loginCallback?.(OAuthError.CANNOT_RETRIEVE_TOKEN);
                return;
            }

            State.oauthWorkflow.oAuth2Client.setCredentials(token);
            fs.writeFile(CredentialState.TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    State.oauthWorkflow.loginCallback?.(OAuthError.CANNOT_SAVE_TOKEN);
                    return;
                }

                console.log('Token stored to', CredentialState.TOKEN_PATH);
            });
            State.oauthWorkflow.loginCallback?.(true);
        });
    }

}
