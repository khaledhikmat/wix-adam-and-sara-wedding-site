import wixLocation from 'wix-location';
import {retrieveFileContent} from 'backend/media';
import {retrievePartiesForEmail, retrievePartiesForLink, updatePartyEmailDates, updatePartyLinks} from 'backend/airtable';
import {email} from 'backend/sendgrid';

const INVITATION_EMAIL_TEMPLATE_FILE_NAME = '515ba6_b1275b614eb64e8ca6978bbc9f4d834a.txt';
const INVITATION_EMAIL_TEMPLATE_FILE_URL = 'https://515ba6a9-04d9-40b0-b12a-87877f07f4b8.usrfiles.com/ugd/515ba6_82b93c70165c4e7690e87fbc235ea05c.txt';

async function generateEmails(partyName) {
    let items = [];
    
    //1. Using the URL from the media manager, read the invitations email template (as .TXT) which already contains the invitations image URL (hosted on the WIX)
    let html = await retrieveFileContent(INVITATION_EMAIL_TEMPLATE_FILE_URL);
    //console.log(html);
    
    //2. Retrieve all parties with email filterd by partyName if provided
    let parties = await retrievePartiesForEmail(partyName);

    if (parties && parties.length == 0) {
        throw 'Party was not found or party has a missing email address!';
    } else if (!parties) {
        throw 'Parties was not returned!';
    }

    //3. For each party, replace the registration link in template and email out
    parties.forEach(async (party) => {
        try {
            let partyHtml = html;
            partyHtml = partyHtml.replace('{{registration-link}}', wixLocation.baseUrl + '/rsvp?pid=' + party.id);
            //console.log(partyHtml);

            //Use sendGrid to send email
            await email(party.sender, 'Adam & Sara Wedding', party.email, 'Adam & Sara Wedding Invitation for ' + party.name, partyHtml);

            let item = {};
            item.id = party.id;
            item.emailDate = new Date().toISOString();
            items.push(item)
        } catch (error) {
            console.log('Error occurred while emailing: ' + party.email);
        }

        await updatePartyEmailDates(items); 
    });
}

async function generateLinks(partyName) {
    let items = [];
    
    //1. Retrieve all parties filterd by partyName if provided 
    let parties = await retrievePartiesForLink(partyName);
    //console.log(parties);

    if (parties && parties.length == 0) {
        throw 'Party was not found or party has a missing email address!';
    } else if (!parties) {
        throw 'Parties was not returned!';
    }

    //2. For each party, include the party id and registration link
    parties.forEach((party) => {
        let item = {};
        item.id = party.id;
        item.link = wixLocation.baseUrl + '/rsvp?pid=' + party.id;
        items.push(item)
    });
    //console.log(items);

    await updatePartyLinks(items); 
}

$w.onReady(function async () {
    $w("#spinner").hide();
    $w("#txtError").text = "";
    $w("#txtPartyName").value = "";
    $w("#btnGenerateEmails").enable();
    $w("#btnGenerateSingleEmail").enable();
    $w("#btnGenerateLinks").enable();
    $w("#btnGenerateSingleLink").enable();

    $w("#btnGenerateEmails").onClick( async (event) =>  {
        try {
            $w("#txtError").text = "";
            $w("#spinner").show();
            $w("#btnGenerateEmails").disable();
            $w("#btnGenerateSingleEmail").disable();
            $w("#btnGenerateLinks").disable();
            $w("#btnGenerateSingleLink").disable();
            await generateEmails();
            $w("#spinner").hide();
        }
        catch (error) {
            $w("#txtError").text = error.message || error.toString();
            $w("#txtError").show();
        } finally {
            $w("#spinner").hide();
            $w("#btnGenerateEmails").enable();
            $w("#btnGenerateSingleEmail").enable();
            $w("#btnGenerateLinks").enable();
            $w("#btnGenerateSingleLink").enable();
        }
    });

    $w("#btnGenerateSingleEmail").onClick( async (event) =>  {
        try {
            $w("#txtError").text = "";
            $w("#spinner").show();
            $w("#btnGenerateEmails").disable();
            $w("#btnGenerateSingleEmail").disable();
            $w("#btnGenerateLinks").disable();
            $w("#btnGenerateSingleLink").disable();

            if ($w("#txtPartyName").value) {
                await generateEmails($w("#txtPartyName").value);
            } else {
                throw 'Please provide a party name!';
            }
        } catch (error) {
            $w("#txtError").text = error.message || error.toString();
            $w("#txtError").show();
        } finally {
            $w("#spinner").hide();
            //$w("#txtPartyName").value = "";
            $w("#btnGenerateEmails").enable();
            $w("#btnGenerateSingleEmail").enable();
            $w("#btnGenerateLinks").enable();
            $w("#btnGenerateSingleLink").enable();
        }
	});

    $w("#btnGenerateLinks").onClick( async (event) =>  {
        try {
            $w("#txtError").text = "";
            $w("#spinner").show();
            $w("#btnGenerateEmails").disable();
            $w("#btnGenerateSingleEmail").disable();
            $w("#btnGenerateLinks").disable();
            $w("#btnGenerateSingleLink").disable();
            await generateLinks();
            $w("#spinner").hide();
        }
        catch (error) {
            $w("#txtError").text = error.message || error.toString();
            $w("#txtError").show();
        } finally {
            $w("#spinner").hide();
            $w("#btnGenerateEmails").enable();
            $w("#btnGenerateSingleEmail").enable();
            $w("#btnGenerateLinks").enable();
            $w("#btnGenerateSingleLink").enable();
        }
    });

    $w("#btnGenerateSingleLink").onClick( async (event) =>  {
        try {
            $w("#txtError").text = "";
            $w("#spinner").show();
            $w("#btnGenerateEmails").disable();
            $w("#btnGenerateSingleEmail").disable();
            $w("#btnGenerateLinks").disable();
            $w("#btnGenerateSingleLink").disable();

            if ($w("#txtPartyName").value) {
                await generateLinks($w("#txtPartyName").value);
            } else {
                throw 'Please provide a party name!';
            }
        } catch (error) {
            $w("#txtError").text = error.message || error.toString();
            $w("#txtError").show();
        } finally {
            $w("#spinner").hide();
            //$w("#txtPartyName").value = "";
            $w("#btnGenerateEmails").enable();
            $w("#btnGenerateSingleEmail").enable();
            $w("#btnGenerateLinks").enable();
            $w("#btnGenerateSingleLink").enable();
        }
	});
});