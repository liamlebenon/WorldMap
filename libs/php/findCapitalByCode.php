<?php

    $url = 'https://api.opencagedata.com/geocode/v1/json?key=e611932662994cc89b79eb86a317d38e' . '&q=' . $_REQUEST['iso_a2'] .'&pretty=1';

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
