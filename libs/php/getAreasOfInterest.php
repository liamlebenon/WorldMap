<?php

    $url = 'https://api.opentripmap.com/0.1/en/places/radius?radius=100000&lon=' . $_REQUEST['longitude'] . '&lat=' . $_REQUEST['latitude'] . '&formate=json&limit=15&rate=3h&apikey=5ae2e3f221c38a28845f05b636450e0f3469078a46d900f87c76e8b6';
    
    $curl = curl_init($url);

    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_URL,$url);

    $response = curl_exec($curl);
    curl_close($curl);

    $response = json_decode($response, true);

    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($response);

?>
