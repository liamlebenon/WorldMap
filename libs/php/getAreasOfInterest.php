<?php

    $url = 'https://api.opentripmap.com/0.1/en/places/geoname?name=' . 'london' . '&apikey=' . $_REQUEST['apiKey'];

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
