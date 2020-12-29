import {getSecret} from 'wix-secrets-backend';
import wixCaptcha from 'wix-captcha-backend';
import {fetch} from 'wix-fetch';

const SAMPLE = false;

export async function retrievePartyRegistrations(partyId) {
    let partyRegistrations = [];

    try {
        // Load from AirTable only if a party name exists as a query parameter
        if (!SAMPLE) {
            // Get guests from AirTable
            // I was not able to filter by formula unfortunately....linked records cannot be filtered by formula!!!
            let httpResponse = await fetch("https://api.airtable.com/v0/appbbqhH1dJLClmD2/Guests?maxRecords=300&view=Grid%20view&fields%5B%5D=Name&fields%5B%5D=Party&fields%5B%5D=partyName&fields%5B%5D=Meal&fields%5B%5D=Confirmed", {
                "method": "GET", 
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + await getSecret('AT_API_KEY')
                }
            });
            
            if (!httpResponse.ok) {
                throw 'API Call to retrieve guests returned ' + httpResponse.status;
            }

            let json = await httpResponse.json();
            let guestRecords = json.records;

            // Get meals from AirTable
            httpResponse = await fetch("https://api.airtable.com/v0/appbbqhH1dJLClmD2/Meal?maxRecords=10&view=Grid%20view&fields%5B%5D=Name", {
                "method": "get", 
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + await getSecret('AT_API_KEY')
                }
            });

            if (!httpResponse.ok) {
                throw 'API Call to retrieve available meals returned ' + httpResponse.status;
            }

            json = await httpResponse.json();
            let mealRecords = json.records;

            let meals = [];
            let defaultMealId = '';
            for (let i = 0; i < mealRecords.length; i++) {		
                let record = mealRecords[i];
                let meal = {};
                meal.value = record.id;
                defaultMealId = record.id;
                // Ignore the meals that do not have a name
                if (record.fields.Name) {
                    meal.label = getMealLabel(record.fields.Name);
                    meals.push(meal);
                }
            }

            let registrations = [];
            for (let i = 0; i < guestRecords.length; i++) {		
                let record = guestRecords[i];
                let reg = {};
                reg._id = record.id;
                //Ignore the guests that do not have a name or party
                if (record.fields.Name &&
                    typeof record.fields.Party != 'undefined' && 
                    typeof record.fields.Party[0] != 'undefined' &&
                    typeof record.fields.partyName != 'undefined' && 
                    typeof record.fields.partyName[0] != 'undefined'
                ) {
                    reg.name = record.fields.Name;
                    reg.email = record.fields.Email || '';
                    reg.partyId = record.fields.Party[0];
                    reg.party = record.fields.partyName[0];
                    reg.confirmed = record.fields.Confirmed ? true : false;
                    reg.meal = record.fields.Meal && record.fields.Meal[0] ? record.fields.Meal[0] : defaultMealId;
                    reg.meals = meals;
                    registrations.push(reg);
                }
            }
            
            //WARNING: Filter (out at the client) the parties only
            partyRegistrations = partyId ? registrations.filter(item => item.partyId === partyId) : registrations;		
        } else {
            partyRegistrations = [
                {
                    "_id":"reg1",
                    "name":"Sample1 LastName",
                    "email":"khaled.hikmat@gmail.com",
                    "partyId": "",
                    "meal":"Beef",
                    "confirmed":true,
                    "meals": [
                        {"label": "Fish 🐟", "value": "Fish"},
                        {"label": "Beef 🐄", "value": "Beef"},
                        {"label": "Chicken 🐔", "value": "Chicken"}                
                    ]
                },
                {
                    "_id":"reg2",
                    "name":"Sample2 LastName",
                    "email":"khaled.hikmat@gmail.com",
                    "partyId": "",
                    "meal":"Chicken",
                    "confirmed":true,
                    "meals": [
                        {"label": "Fish 🐟", "value": "Fish"},
                        {"label": "Beef 🐄", "value": "Beef"},
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
                        {"label": "Beef 🐄", "value": "Beef"},
                        {"label": "Chicken 🐔", "value": "Chicken"}                
                    ]
                }
            ];
        }
    }
    catch (error) {
        throw error;
    }

    return partyRegistrations;
}

export async function retrieveParties() {
    let parties = [];

    try {
        // Get parties from AirTable
        let httpResponse = await fetch("https://api.airtable.com/v0/appbbqhH1dJLClmD2/Party?maxRecords=300&view=Grid%20view", {
            "method": "GET", 
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + await getSecret('AT_API_KEY')
            }
        });
        
        if (!httpResponse.ok) {
            throw 'API Call to retrieve parties returned ' + httpResponse.status;
        }

        let json = await httpResponse.json();
        let partyRecords = json.records;

        for (let i = 0; i < partyRecords.length; i++) {		
            let record = partyRecords[i];
            let party = {};
            party.id = record.id;
            party.name = record.fields.Name;
            party.email = record.fields.Email || '';
            party.link = record.fields.Link || '';
            party.sender = record.fields.Sender || 'Adam';
            parties.push(party);
        }
    } catch (error) {
        throw error;
    }

    return parties;
}

export async function retrievePartiesForEmail(partyName) {
    let parties = await retrieveParties();
    // Filter out the ones without email addresses and match the provided partyName
    return parties.filter(item => item.email != '' && (partyName ? item.name === partyName : false));		
}

export async function retrievePartiesForLink(partyName) {
    let parties = await retrieveParties();
    // Filter out the ones that match the provided partyName
    return parties.filter(item => (partyName ? item.name === partyName : false));		
}

export async function updatePartyRegistrations(data) {
    try {
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
        
        // Update AirTable - do not use AirTable if hard-coded sample data
        if (!SAMPLE) {
            let httpResponse = await fetch( "https://api.airtable.com/v0/appbbqhH1dJLClmD2/Guests", {
                "method": "PATCH",
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + await getSecret('AT_API_KEY')
                },
                "body": JSON.stringify(payload)
            });
            if (!httpResponse.ok) {
                throw 'API Call to update party registrations returned ' + httpResponse.status;
            }
        }
    }
    catch (error) {
        throw error;
    }
} 

export async function addPartyGuests(token, partyId, newGuests) {
    try {
        try {await wixCaptcha.authorize(token);} catch (error) {throw 'Captcha validation failed!'}

        let payload = {};
        payload.records = [];
        for (let i = 0; i < newGuests.length; i++) {		
            let guest = newGuests[i];
            let record = {}; 
            record.fields = {};
            record.fields.Name = guest.name;
            record.fields.Gender = guest.gender;
            record.fields['Age Group'] = guest.ageGroup;
            record.fields.Language = 'English';
            record.fields.Party = [];
            record.fields.Party.push(partyId);
            payload.records.push(record);
        }
        
        // Update AirTable - do not use AirTable if hard-coded sample data
        if (!SAMPLE) {
            let httpResponse = await fetch( "https://api.airtable.com/v0/appbbqhH1dJLClmD2/Guests", {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + await getSecret('AT_API_KEY')
                },
                "body": JSON.stringify(payload)
            });
            if (!httpResponse.ok) {
                throw 'API Call to add parties links returned ' + httpResponse.status;
            }
        }
    }
    catch (error) {
        throw error;
    }
} 

export async function updatePartyEmailDates(data) {
    try {
        let payload = {};
        payload.records = [];
        for (let i = 0; i < data.length; i++) {		
            let item = data[i];
            let record = {}; 
            record.id = item.id;
            record.fields = {};
            record.fields.EmailDate = item.emailDate;
            payload.records.push(record);
        }
        
        // Update AirTable - do not use AirTable if hard-coded sample data
        let httpResponse = await fetch( "https://api.airtable.com/v0/appbbqhH1dJLClmD2/Party", {
            "method": "PATCH",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + await getSecret('AT_API_KEY')
            },
            "body": JSON.stringify(payload)
        });
        if (!httpResponse.ok) {
            throw 'API Call to update party email dates returned ' + httpResponse.status;
        }
    }
    catch (error) {
        throw error;
    }
} 

export async function updatePartyLinks(data) {
    try {
        let payload = {};
        payload.records = [];
        for (let i = 0; i < data.length; i++) {		
            let item = data[i];
            let record = {}; 
            record.id = item.id;
            record.fields = {};
            record.fields.Link = item.link;
            payload.records.push(record);
        }
        
        // Update AirTable - do not use AirTable if hard-coded sample data
        let httpResponse = await fetch( "https://api.airtable.com/v0/appbbqhH1dJLClmD2/Party", {
            "method": "PATCH",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + await getSecret('AT_API_KEY')
            },
            "body": JSON.stringify(payload)
        });
        if (!httpResponse.ok) {
            throw 'API Call to update party links returned ' + httpResponse.status;
        }
    }
    catch (error) {
        throw error;
    }
} 

//*** PRIVATE */
function getMealLabel(name) {
    return name;
    // if (name === 'Fish') {
    //     return "Fish 🐟";
    // } else if (name === 'Chicken') {
    //     return "Chicken 🐔";
    // } else if (name === 'Beef') {
    //     return "Beef 🐄";
    // } else {
    //     return "Pizza 🍕";
    // }
}

