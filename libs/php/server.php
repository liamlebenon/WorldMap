<?php
	if(isset($_POST['action']) && !empty($_POST['action'])) {
		$action = $_POST['action'];
		if(isset($_POST['iso_a2'])) {
			$iso_a2 = $_POST['iso_a2'];
		}

		switch($action) {
			case 'populateSelect' : populateSelect();break;
			case 'getCountryBorders' : getCountryBorders($iso_a2);break;
		};
	};


	function getCountriesArray() {
		$data = file_get_contents('../../data.json');
		$data = json_decode($data, true);
		$countries = array();
		for($i = 0; $i < count($data['features']); $i++) {
			$countries[$data['features'][$i]['properties']['iso_a2']] = $data['features'][$i]['geometry'];
		}
		return $countries;
	}


	function getCountryBorders($iso_a2) {
		$countries = getCountriesArray();
		echo json_encode($countries[$iso_a2]);
	}

	function populateSelect() {
		$data = file_get_contents('../../data.json');
		echo $data;
	};

?>
