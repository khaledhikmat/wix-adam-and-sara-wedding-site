import { mediaManager } from 'wix-media-backend';
import {fetch} from 'wix-fetch';

export async function retrieveFileInfo(fileName) {
    return await mediaManager.getFileInfo(fileName);
}

export async function retrieveFileUrl(fileName) {
    return await mediaManager.getFileUrl(fileName);
}

export async function retrieveFileContent(fileUrl) {
    let content = '';

    try {
        let httpResponse = await fetch(fileUrl, {
            "method": "GET"
        });
        
        if (!httpResponse.ok) {
            throw 'API Call to retrieve file content ' + httpResponse.status;
        }

        content = httpResponse.text();
    }
    catch (error) {
        throw error;
    }

    return content;
}

