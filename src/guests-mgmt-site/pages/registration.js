// API Reference: https://www.wix.com/corvid/reference
// “Hello, World!” Example: https://www.wix.com/corvid/hello-world
//TODO items are in AirTable

import wixLocation from 'wix-location';
import wixData from 'wix-data';
import {session, memory} from 'wix-storage';
import {fetch} from 'wix-fetch';

const SETTINGS_MAIN_ID = '8a97468f-6bfb-4efd-84b1-1cd507123704';
const SAMPLE = false;

function getMealLabel(name) {
    if (name === 'Fish') {
        return "Fish 🐟";
    } else if (name === 'Chicken') {
        return "Chicken 🐔";
    } else if (name === 'Lamb') {
        return "Lamb 🐄";
    } else {
        return "Pizza 🍕";
    }
}

$w.onReady(function () {
    $w("#guestsRepeater").hide();
    $w("#txtThankYou").hide();
    $w("#txtError").hide();
    $w("#btnGift").hide();

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

	$w("#btnUpdateGuests").onClick( (event) => {
		const data = $w("#guestsRepeater").data;
        //console.log(data);

        let payload = {};
        payload.records = [];
        for (let i = 0; i < data.length; i++) {		
            let item = data[i];
            let record = {}; 
            record.id = item._id;
            record.fields = {};
            record.fields.Confirmed = item.confirmed;
            record.fields.Meal = [];
            record.fields.Meal.push(item.meal);
            payload.records.push(record);
        }
        
        //console.log(payload);

        // Update AirTable - do not use AirTable if hard-coded sample data
        if (!SAMPLE) {
            //WARNING: The API_KEY has already been retrieved from the collection
            let API_KEY = memory.getItem('api_key');

            fetch( "https://api.airtable.com/v0/appbbqhH1dJLClmD2/Guests", {
                "method": "PATCH",
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + API_KEY
                },
                "body": JSON.stringify(payload)
            } )
            .then( (httpResponse) => {
                if (httpResponse.ok) {
                    return httpResponse.json();
                } else {
                    console.log(httpResponse);
                    return Promise.reject("Fetch did not succeed");
                }
            } )
            .then( (json) => {
                //console.log(json);
                $w("#txtThankYou").show();
                $w("#btnGift").show();
            })
            .catch(error => {
                //console.log(error);
                $w("#txtError").text = error.message || error.toString();
                $w("#txtError").show();
            });		
        } else {
            $w("#txtThankYou").show();
            $w("#btnGift").show();
        }
	});

    wixData.get("settings", SETTINGS_MAIN_ID)
    .then( (results) => {
        let item = results;
        // console.log('settings'); 
        // console.log(item);

        let API_KEY = item.apikey;
        let SAMPLE_PARTY_ID = item.samplerecordid;

        // Store in memory so it an be used by the update button handler
        memory.setItem('api_key', API_KEY);
        
        // Load from AirTable only if a party name exists as a query parameter
        if (!SAMPLE) {
            let partyId = wixLocation.query.pid;
            if (!partyId) {
                //console.log('Getting party id:' + session.getItem("partyId"));
                partyId = session.getItem("partyId") || SAMPLE_PARTY_ID;
            } else {
                //console.log('Storing party id:' + partyId);
                session.setItem("partyId", partyId);
            }

            // Get guests from AirTable
            // I was not able to filter by formula unfortunately....linked records cannot be filtered by formula!!!
            fetch("https://api.airtable.com/v0/appbbqhH1dJLClmD2/Guests?maxRecords=300&view=Grid%20view&fields%5B%5D=Name&fields%5B%5D=Party&fields%5B%5D=partyName&fields%5B%5D=Status&fields%5B%5D=Meal&fields%5B%5D=Confirmed", {
                "method": "get", "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + API_KEY
            }})
            .then( (httpResponse) => {
                if (httpResponse.ok) {
                    return httpResponse.json();
                } else {
                    return Promise.reject("Fetch did not succeed");    }
                }	 
            )
            .then(json => {
                //console.log(json);
                //console.log(json.records);
                //console.log('Got records...');
                let records = json.records;
                let registrations = [];
                let meals = [];

                // Get meals from AirTable
                fetch("https://api.airtable.com/v0/appbbqhH1dJLClmD2/Meal?maxRecords=10&view=Grid%20view&fields%5B%5D=Name", {
                    "method": "get", "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + API_KEY
                }})
                .then( (httpResponse) => {
                    if (httpResponse.ok) {
                        return httpResponse.json();
                    } else {
                        return Promise.reject("Fetch did not succeed");    }
                    }	 
                )
                .then(json1 => {
                    //console.log(json1);
                    //console.log(json1.records);
                    //console.log('Got meals...');
                    for (let i = 0; i < json1.records.length; i++) {		
                        let record = json1.records[i];
                        let meal = {};
                        meal.value = record.id;
                        meal.label = getMealLabel(record.fields.Name);
                        meals.push(meal);
                    }
            
                    //console.log(meals);

                    for (let i = 0; i < records.length; i++) {		
                        let record = json.records[i];
                        let reg = {};
                        reg._id = record.id;
                        reg.name = record.fields.Name;
                        reg.partyId = record.fields.Party[0];
                        reg.party = record.fields.partyName[0];
                        reg.confirmed = record.fields.Confirmed ? true : false;
                        reg.meal = record.fields.Meal[0];
                        reg.meals = meals;
                        registrations.push(reg);
                    }
        
                    //console.log(registrations);
                    const regs = registrations.filter(item => item.partyId === partyId);		
                    //console.log(regs);
                    $w("#guestsRepeater").data = regs;
                    $w("#guestsRepeater").show();
                })
                .catch(err => { 
                    //console.log(err);
                    $w("#txtError").text = err;
                    $w("#txtError").show();
                });
            })
            .catch(error => {
                //console.log(error);
                $w("#txtError").text = error.message || error.toString();
                $w("#txtError").show();
            });
        } else {
            const regData = [
                {
                    "_id":"reg1",
                    "name":"Sample1 LastName",
                    "partyId": "",
                    "meal":"Lamb",
                    "confirmed":true,
                    "meals": [
                        {"label": "Fish 🐟", "value": "Fish"},
                        {"label": "Lamb 🐄", "value": "Lamb"},
                        {"label": "Chicken 🐔", "value": "Chicken"}                
                    ]
                },
                {
                    "_id":"reg2",
                    "name":"Sample2 LastName",
                    "partyId": "",
                    "meal":"Chicken",
                    "confirmed":true,
                    "meals": [
                        {"label": "Fish 🐟", "value": "Fish"},
                        {"label": "Lamb 🐄", "value": "Lamb"},
                        {"label": "Chicken 🐔", "value": "Chicken"}                
                    ]
                },
                {
                    "_id":"reg3",
                    "name":"Sample3 LastName",
                    "partyId": "",
                    "meal":"Fish",
                    "confirmed":false,
                    "meals": [
                        {"label": "Fish 🐟", "value": "Fish"},
                        {"label": "Lamb 🐄", "value": "Lamb"},
                        {"label": "Chicken 🐔", "value": "Chicken"}                
                    ]
                }
            ];

            $w("#guestsRepeater").data = regData;
            $w("#guestsRepeater").show();
        }
    } )
    .catch( (error) => {
        $w("#txtError").text = error.message || error.toString();
        $w("#txtError").show();
    } );

});