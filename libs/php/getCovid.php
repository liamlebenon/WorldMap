<?php

$url = 'https://covid-19-coronavirus-statistics.p.rapidapi.com/v1/stats?country=' . $_REQUEST['country'];  

$headers = [
    "X-RapidAPI-Key: 78b5333e8fmshba819757cc97b0cp16e6fcjsndc3029b3d2ef",
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
