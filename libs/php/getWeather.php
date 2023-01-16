<?php

$url = 'http://api.weatherapi.com/v1/current.json?key=28928681a7104281b32131558222912' . '&q=' . $_REQUEST['cityName'];  

$headers = [
    'apikey:  28928681a7104281b32131558222912',
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
