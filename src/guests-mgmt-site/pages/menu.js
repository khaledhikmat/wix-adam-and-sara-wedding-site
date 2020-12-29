
import { retrieveMeals } from 'backend/airtable';
import {isMeals} from 'backend/settings';

async function retrieveMealsAsync() {
    if ((await isMeals()) === 'true') {
        $w("#txtWorkInProgress").hide();
        $w("#mealsRepeater").hide();

        try {
            $w("#spinner").show();
            $w("#txtError").text = '';
            $w("#txtError").hide();
    
            let data = await retrieveMeals();
            if (data.length > 0) {
                $w("#mealsRepeater").data = data;
                $w("#mealsRepeater").show();
            } else {
                throw ('Sorry....there are no meals available!');
            }
        }
        catch (error) {
            $w("#txtError").text = error.message || error.toString();
            $w("#txtError").show();
        } finally {
            $w("#spinner").hide();
        }
    } else {
        $w("#txtWorkInProgress").show();
        $w("#mealsRepeater").hide();
    }
}

$w.onReady(async function () {
    $w("#mealsRepeater").hide();

    $w("#mealsRepeater").onItemReady( ($item, itemData, index) => {
		$item("#txtTitle").text = itemData.name;
		$item("#txtDescription").text = itemData.description;
		$item("#imgPhoto").src = itemData.imageUrl;
	});	

    await retrieveMealsAsync();
});