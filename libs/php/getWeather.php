<?php

  // the first two lines provide error reporting when the routine is called from a browser, eg:
  // set the return header

  header('Content-Type: application/json; charset=UTF-8');
  header('Access-Control-Allow-Origin: *'); 

  $executionStartTime = microtime(true);

  // $_REQUEST is used initially because it accepts parameters passed as both $_POST and $_GET
  // (for when the routine is called directly from the browser as per the example above).
  // Replace with $_POST once you are sure that the routine is stable.

  $url='https://api.weatherapi.com/v1/forecast.json?q=' . $_REQUEST['cityName'] . '&key=28928681a7104281b32131558222912&days=5&aqi=no';

  $ch = curl_init();

  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_URL,$url);

  $result = curl_exec($ch);

  $cURLERROR = curl_errno($ch);
  
  curl_close($ch);

  if ($cURLERROR) {

    $output['status']['code'] = $cURLERROR;
    $output['status']['name'] = "Failure - cURL";
    $output['status']['description'] = curl_strerror($cURLERROR);
    $output['status']['seconds'] = number_format((microtime(true) - $executionStartTime), 3);
    $output['data'] = null;

  } else {

    // serialise the cURL result to an associative array so that it can be
    // tested for valid content before it is appended to the output array

    $weather = json_decode($result,true);

    if (json_last_error() !== JSON_ERROR_NONE) {

      $output['status']['code'] = json_last_error();
      $output['status']['name'] = "Failure - JSON";
      $output['status']['description'] = json_last_error_msg();
      $output['status']['seconds'] = number_format((microtime(true) - $executionStartTime), 3);
      $output['data'] = null;

    } else {

      // has the api returned an error?

      if (isset($weather['error'])) {

        $output['status']['code'] = $weather['error']['code'];
        $output['status']['name'] = "Failure - API";
        $output['status']['description'] = $weather['error']['message'];
        $output['status']['seconds'] = number_format((microtime(true) - $executionStartTime), 3);
        $output['data'] = null;

      } else {

        // create array containing only the required properties

        // the API supports HTTPS and so the icon URLs are amended
        // to ensure that there are no CROSS ORIGIN errors in the client

        $finalResult['country'] = $weather['location']['country'];
        $finalResult['location'] = $weather['location']['name'];

        $finalResult['lastUpdated'] = $weather['current']['last_updated'];

        $finalResult['forecast'] = [];

        foreach ($weather['forecast']['forecastday'] as $item) {

          $temp['date'] = $item['date'];

          $temp['minC'] = intval($item['day']['mintemp_c']);
          $temp['maxC'] = intval($item['day']['maxtemp_c']);

          $temp['minF'] = intval($item['day']['mintemp_f']);
          $temp['maxF'] = intval($item['day']['maxtemp_f']);

          $temp['maxWindMPH'] = intval($item['day']['maxwind_mph']);
          $temp['maxWindKPH'] = intval($item['day']['maxwind_kph']);

          $temp['precipMM'] = intval($item['day']['totalprecip_mm']);
          $temp['precipIN'] = intval($item['day']['totalprecip_in']);

          $temp['conditionText'] = $item['day']['condition']['text'];
          $temp['conditionIcon'] = 'https:' . $item['day']['condition']['icon'];

          array_push($finalResult['forecast'], $temp);          

        }

        $output['status']['code'] = 200;
        $output['status']['name'] = "success";
        $output['status']['description'] = "all ok";
        $output['status']['seconds'] = number_format((microtime(true) - $executionStartTime), 3);
        // $output['data'] = $weather;
        $output['data'] = $finalResult;

      }

    }

  }

  echo json_encode($output, JSON_NUMERIC_CHECK); 

?>