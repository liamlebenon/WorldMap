<?php

    $url = 'http://api.openweathermap.org/geo/1.0/direct?q=' . $_REQUEST['capital'] . '&appid=2cf4a969f68e72fef2fff6d2ee8c0d83';  
    
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
