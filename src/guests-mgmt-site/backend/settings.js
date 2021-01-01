import {getSecret} from 'wix-secrets-backend';

export async function isSamplePartyId() {
    return await getSecret('SAMPLE_GUEST_WHEN_NO_PARTY_ID');
}

export async function getSamplePartyId() {
    return await getSecret('SAMPLE_GUEST_RECORD_ID');
}

export async function isMeals() {
    return await getSecret('MEALS_ON');
}

export async function isWeddingAlbum() {
    return await getSecret('ALBUM_WEDDING_ON');
}

export async function getGiftsHeaderMessage() {
    let message = '';
    
    try {
        message = await getSecret('MSG_GIFTS_HEADER');
    } catch (err) {
        message = '​We do not have a gifts registry. However, we do appreciate your gift.';
    } 

    return message;
}

export async function getRsvpHeaderMessage() {
    let message = '';
    
    try {
        message = await getSecret('MSG_RSVP_HEADER');
    } catch (err) {
        message = '​The following guests are invited under your party. Please let us know who is coming and what meal they prefer. Thank you.';
    } 

    return message;
}

export async function getRsvpNotAvailableMessage() {
    let message = '';
    
    try {
        message = await getSecret('MSG_RSVP_NOT_AVAILABLE');
    } catch (err) {
        message = 'Sorry....RSVP is not available unless you reach this page from an invitation link';
    } 

    return message;
}

export async function getNoGuestsWithPartyMessage() {
    let message = '';

    try {
        message = await getSecret('MSG_NO_GUESTS_WITH_PARTY');
    } catch (err) {
        message = 'Sorry....there are no guests associated with this party id!';
    }

    return message;
}

export async function getGuestValidationMessage() {
    let message = '';
    
    try {
        message = await getSecret('MSG_GUEST_VALIDATION');
    } catch (err) {
        message = 'Guest name must be alpha only!';
    }

    return message;
}
