import {isWeddingAlbum} from 'backend/settings';

$w.onReady(async function () {
    $w("#txtWeddingAlbum").hide();
    $w("#galleryWedding").hide();
    if ((await isWeddingAlbum()) === 'true') {
        $w("#txtWeddingAlbum").show();
        $w("#galleryWedding").show();
    }
    
});