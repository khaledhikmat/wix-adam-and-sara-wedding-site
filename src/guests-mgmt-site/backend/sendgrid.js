import {getSecret} from 'wix-secrets-backend';
import sendGridMail from '@sendgrid/mail';

const ADAM_N_SARA_WEDDING_FROM = 'invitations@adamandsara.wedding';

// Can be used with `async` since it implements a promise 
export function email (sender, alias, to, subject, html) {
    new Promise((resolve, reject) => {
        getSecret('SENDGRID_API_KEY')
        .then((secret) => {
            sendGridMail.setApiKey(secret);
            const msg = {
                to: to,
                from: ADAM_N_SARA_WEDDING_FROM,
                subject: subject,
                html: html
            };
            //console.log('sendGrid - email - from: ' + from + ' - alias: ' + alias + ' - to: ' + to + ' - subject: ' + subject + ' - html: ' + html);
            sendGridMail
            .send(msg)
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        })
        .catch((error) => {
            reject(error);
        });
    });
}
