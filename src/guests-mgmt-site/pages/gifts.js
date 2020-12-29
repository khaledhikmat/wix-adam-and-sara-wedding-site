import {getGiftsHeaderMessage} from 'backend/settings';

$w.onReady(async function () {
    $w("#txtHeaderMessage").text = await getGiftsHeaderMessage();
    $w("#creditCardGift").hide();
	$w("#btnCreditCard").onClick( async (event) =>  {
        $w("#creditCardGift").isVisible ? $w("#creditCardGift").hide() : $w("#creditCardGift").show();
    });
});