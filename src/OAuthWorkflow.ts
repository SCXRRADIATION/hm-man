import {CredentialState, State} from "./main";
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
    private loginCallback?: ((result: boolean) => void);

    public authorize(credentials: Credentials, callback: ((result: boolean) => void), loginCallback?: ((result: boolean) => void)) {
        const {client_secret, client_id} = credentials.installed;

        this.server = http.createServer(this.handleLoginResponse);
        this.server.listen(0);
        const port = (<net.AddressInfo>this.server.address()).port;
        this.loginCallback = loginCallback;

        // TODO: Check if localhost is added as redirect URL
        this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:' + port);

        fs.readFile(CredentialState.TOKEN_PATH, (err, token) => {
            if (err) {
                this.getNewToken(this.oAuth2Client)
                callback(false);
                return;
            }

            this.server.close();
            this.oAuth2Client.setCredentials(JSON.parse(token.toString()));
            callback(true);
        });
    }

    // TODO: Add types to all parameters
    public getNewToken(oAuth2Client: any) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES
        });

        shell.openExternal(authUrl);
    }

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
                if (State.oauthWorkflow.loginCallback) {
                    State.oauthWorkflow.loginCallback(false);
                }
                return console.error('Error retrieving access token', err);
            }

            State.oauthWorkflow.oAuth2Client.setCredentials(token);
            fs.writeFile(CredentialState.TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    if (State.oauthWorkflow.loginCallback) {
                        State.oauthWorkflow.loginCallback(false);
                    }
                    return console.error(err);
                }

                console.log('Token stored to', CredentialState.TOKEN_PATH);
            });
            if (State.oauthWorkflow.loginCallback) {
                State.oauthWorkflow.loginCallback(true);
            }
        });
    }

}
