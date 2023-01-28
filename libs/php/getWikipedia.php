<?php

$url = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&exchars=500&titles=' . $_REQUEST['countryName'] . '&format=json';

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
