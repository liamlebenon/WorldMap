<?php

    $url = 'https://api.api-ninjas.com/v1/country?name=' . $_REQUEST['iso_a2'];  

    $headers = [
        'X-Api-Key: JU7S+Xei/S8WLbkghgdl/g==0UEhtMLxyRV2bwOR',
        'Content-Type: application/json'
    ];
    $curl = curl_init($url);
    
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_URL,$url);

    $response = curl_exec($curl);
    curl_close($curl);

    $response = json_decode($response, true);

    header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($response);

?>
