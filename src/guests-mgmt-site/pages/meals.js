
import {isMeals} from 'backend/settings';

$w.onReady(async function () {
    if ((await isMeals()) === 'true') {
        $w("#txtWorkInProgress").hide();
        $w("#mealsRepeater").show();
    } else {
        $w("#txtWorkInProgress").show();
        $w("#mealsRepeater").hide();
    }
});