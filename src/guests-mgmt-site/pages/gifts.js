import {getGiftsHeaderMessage} from 'backend/settings';

$w.onReady(async function () {
    $w("#txtHeaderMessage").text = await getGiftsHeaderMessage();
    $w("#tblGiftMethods").hide();
    $w("#giftCreditCards").hide();
	$w("#btnToggleGiftMethods").onClick( async (event) =>  {
        $w("#tblGiftMethods").isVisible ? $w("#tblGiftMethods").hide() : $w("#tblGiftMethods").show();
        $w("#giftCreditCards").isVisible ? $w("#giftCreditCards").hide() : $w("#giftCreditCards").show();
    });
});