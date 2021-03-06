// API Reference: https://www.wix.com/corvid/reference
// “Hello, World!” Example: https://www.wix.com/corvid/hello-world
//TODO items are in AirTable

import wixLocation from 'wix-location';
import {session} from 'wix-storage';
import {retrievePartyRegistrations, addPartyGuests, updatePartyRegistrations} from 'backend/airtable';
import {getSamplePartyId, getRsvpHeaderMessage, getRsvpNotAvailableMessage, getNoGuestsWithPartyMessage, getGuestValidationMessage, isSamplePartyId} from 'backend/settings';

async function getPartyId() {
    let samplePartyId = '';
    if ((await isSamplePartyId()) === 'true') {
        samplePartyId = await getSamplePartyId();
    }
        
    //WARNING: In Preview, we may need to force this as there is no way to pass URL parameters
    //and there is no way to tell programmatically whether we are in preview or normal mode
    let partyId = wixLocation.query.pid || samplePartyId;
    if (!partyId && !session.getItem("partyId")) {
        partyId = '';
    } else {
        if (!partyId) {
            partyId = session.getItem("partyId");
        }
    }

    session.setItem("partyId", partyId);
    return partyId;
}

async function retrievePartyGuests() {
    try {
        $w("#spinner").show();
        $w("#txtError").text = '';
        $w("#txtError").hide();

        let partyId = await getPartyId();
        if (!partyId) {
            throw (await getRsvpNotAvailableMessage());
        }  
        
        let data = await retrievePartyRegistrations(partyId);
        if (data.length > 0) {
            $w("#txtRegistrationMessage").show();
            $w("#guestsRepeater").data = data;
            $w("#guestsRepeater").show();
            $w("#btnUpdateGuests").show();
            $w("#btnMoreGuests").show();
        } else {
            throw (await getNoGuestsWithPartyMessage());
        }
    }
    catch (error) {
        $w("#txtError").text = error.message || error.toString();
        $w("#txtError").show();
    } finally {
        $w("#spinner").hide();
    }
}

$w.onReady(async function () {
    $w("#txtRegistrationMessage").text = await getRsvpHeaderMessage();
    $w("#txtRegistrationMessage").hide();
    $w("#guestsRepeater").hide();
    $w("#btnUpdateGuests").hide();
    $w("#btnMoreGuests").hide();
    $w("#captchaAddGuests").hide();
    $w("#captchaAddGuests").reset();
    $w("#txtNewGuest1Name").hide();
    $w("#txtNewGuest1ValidationError").hide();
    $w("#cbNewGuest1AgeGroup").hide();
    $w("#btnConfirmAddGuests").hide();
    $w("#btnCancelAddGuests").hide();
    $w("#txtThankYou").hide();
    $w("#txtError").text = "";
    $w("#txtError").hide();
    $w("#btnGift").hide();
    $w("#spinner").hide();

	$w("#guestsRepeater").onItemReady( ($item, itemData, index) => {
		$item("#guestName").text = itemData.name;

        $item("#dropMealChoice").options = itemData.meals;
		$item("#dropMealChoice").value = itemData.meal;

        $item("#dropComingChoice").value = itemData.confirmed ? 1 : 0;
		
		$item("#dropMealChoice").onChange( (event) => {
			itemData.meal = event.target.value;
		});
		
		$item("#dropComingChoice").onChange( (event) => {
			itemData.confirmed = (event.target.value == 1) ? true : false; // === does not work!!
		});
	});	

	$w("#btnUpdateGuests").onClick( async (event) =>  {
        try {
            $w("#spinner").show();
            $w("#txtError").text = '';
            $w("#txtError").hide();
            $w("#txtThankYou").hide();
            $w("#btnUpdateGuests").disable();
            $w("#btnMoreGuests").disable();
            const data = $w("#guestsRepeater").data;
            await updatePartyRegistrations(data);
            $w("#txtThankYou").show();
            //$w("#btnGift").show(); // Adam did not want this!!
        }
        catch (error) {
            $w("#txtError").text = error.message || error.toString();
            $w("#txtError").show();
        } finally {
            $w("#btnUpdateGuests").enable();
            $w("#btnMoreGuests").enable();
            $w("#spinner").hide();
        }
	});

	$w("#btnMoreGuests").onClick( async (event) =>  {
        try {
            $w("#txtError").text = '';
            $w("#txtError").hide();
            $w("#txtThankYou").hide();
            $w("#btnMoreGuests").disable();
            $w("#txtNewGuest1Name").value = '';
            $w("#txtNewGuest1ValidationError").text = '';
            $w("#captchaAddGuests").show();
            $w("#captchaAddGuests").reset();
            $w("#txtNewGuest1Name").show();
            $w("#txtNewGuest1ValidationError").show();
            $w("#cbNewGuest1AgeGroup").show();
            $w("#btnConfirmAddGuests").disable();
            $w("#btnConfirmAddGuests").show();
            $w("#btnCancelAddGuests").show();
        }
        catch (error) {
        } finally {
        }
	});

    $w("#captchaAddGuests").onVerified(() => {
        $w("#btnConfirmAddGuests").enable();
      } );

    $w("#btnConfirmAddGuests").onClick( async (event) =>  {
        let validationError  = '';

        try {
            $w("#txtError").text = '';
            $w("#txtError").hide();
            $w("#txtThankYou").hide();
            $w("#spinner").show();
            $w("#btnMoreGuests").disable();
            $w("#btnConfirmAddGuests").disable();
            $w("#txtNewGuest1ValidationError").text = '';
            $w("#txtNewGuest1ValidationError").hide();

            // Validate
            // Sanitize the input for alpha or 
            var reg = /^[A-Za-z\s]+$/;
            if (!$w("#txtNewGuest1Name").value) {
                $w("#txtNewGuest1ValidationError").text = await getGuestValidationMessage();
                $w("#txtNewGuest1ValidationError").show();
                validationError = 'Guest name must be incldued!';        
            }    

            if ($w("#txtNewGuest1Name").value) {
                if (!reg.test($w("#txtNewGuest1Name").value)) {
                    $w("#txtNewGuest1ValidationError").text = await getGuestValidationMessage();
                    $w("#txtNewGuest1ValidationError").show();
                    validationError = 'Guest 1 name must be alpha!';        
                }
            }

            if (!validationError) {
                let newGuests = [];
                if ($w("#txtNewGuest1Name").value) {
                    let guest = {
                        name: $w("#txtNewGuest1Name").value,
                        ageGroup: $w("#cbNewGuest1AgeGroup").selectedIndices.length > 0 ? 'Child' : 'Adult',
                        gender: ''
                    };
                    newGuests.push(guest);
                }

                // Call upon the AirTable to save 
                let partyId = await getPartyId();
                await addPartyGuests($w("#captchaAddGuests").token, partyId, newGuests);
                await retrievePartyGuests();
            }
        }
        catch (error) {
            $w("#txtError").text = error.message || error.toString();
            $w("#txtError").show();
        } finally {
            if (!validationError) {
                $w("#captchaAddGuests").reset();
                $w("#btnMoreGuests").enable();
                $w("#btnConfirmAddGuests").enable();
                $w("#captchaAddGuests").hide();
                $w("#txtNewGuest1Name").hide();
                $w("#cbNewGuest1AgeGroup").hide();
                $w("#txtNewGuest1ValidationError").text = '';
                $w("#txtNewGuest1ValidationError").hide();
                $w("#btnConfirmAddGuests").hide();
                $w("#btnCancelAddGuests").hide();
            } else {
                $w("#btnConfirmAddGuests").enable();
            }

            $w("#spinner").hide();
        }
	});

	$w("#btnCancelAddGuests").onClick( async (event) =>  {
        try {
            $w("#txtError").text = '';
            $w("#txtError").hide();
            $w("#txtThankYou").hide();
            $w("#btnMoreGuests").enable();
            $w("#btnConfirmAddGuests").enable();
            $w("#captchaAddGuests").hide();
            $w("#captchaAddGuests").reset();
            $w("#txtNewGuest1Name").hide();
            $w("#cbNewGuest1AgeGroup").hide();
            $w("#txtNewGuest1ValidationError").text = '';
            $w("#txtNewGuest1ValidationError").hide();
            $w("#btnConfirmAddGuests").hide();
            $w("#btnCancelAddGuests").hide();
        }
        catch (error) {
        } finally {
        }
	});

    await retrievePartyGuests();
});