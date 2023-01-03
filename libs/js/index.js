// Set up the map interface
const map = L.map('mapid').setView([0, 0], 3);
const attribution = 
'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Implement the tiles to use
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    noWrap: true
});

tiles.addTo(map);

// Func for getting basic info for the country as well as get the Lat/Lng to center the map when the user selects a country
const centerMap = (countryCode) => {
    $.ajax({
        url: 'libs/php/findCapitalByCode.php',
        dataType: 'json',        
        type: 'GET',
        data: {
            iso_a2: countryCode,
            apiKey: 'e611932662994cc89b79eb86a317d38e'
        },
        success: (result) => {
            let coords;
            const data = result.results;
            // Loop through array to ensure that the latitude is returned for the correct country
            for (let i = 0; i < data.length; i++) {
                if (data[i].components['ISO_3166-1_alpha-2'] === countryCode) {
                    coords = data[i].geometry;
                    break;
                }
            };
            const info = getCountryInfo(countryCode);
            map.setView([coords.lat, coords.lng], 5);
            marker.setLatLng(coords);
            $('#countryInfo').html(
                `<div class='country-info'>
                    <h1 id='countryName'>${info[0].name}</h1><img class='flag' crossorigin src='https://countryflagsapi.com/png/${countryCode}'/>
                    <hr />
                    <ul>
                        <li><b>Capital City</b>: ${info[0].capital}</li>
                        <li><b>Population</b>: ${info[0].population / 1000} million</li>
                        <li><b>Land Area</b>: ${info[0].surface_area.toLocaleString('en-US')} km&#178;</li>
                        <li><b>Density</b>: ${info[0].pop_density} /km&#178;</li>
                        <li><b>Currency</b>: ${info[0].currency.code}</li>
                    </ul>
                    <div id='moreInfo'>
                        <button id='financial' onClick='displayEconomicInfo("${info[0].currency.code}")'>Economic Info</button>
                        <button id='weather' onClick='displayWeatherInfo("${info[0].capital}")'>Weather Info</button>
                    </div>
                </div>`
            );
            marker.openPopup();
        }
    })
};

let marker;

// Uses navigator to get the users current location and then makes a request to an API to get the country from the Lat/Lng returned
const findUserLocation = () => {
    const showPosition = (position) => { 
        $.ajax({
            url: 'libs/php/findUserLocation.php',
            type: 'POST',
            dataType: 'json',
            data: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            },
            success: (result) => {
                const countryCode = result.trim();
                setBorder('getCountryBorders', countryCode);
                centerMap(countryCode);
                marker = L.marker([position.coords.latitude, position.coords.longitude]).addTo(map);
            }
        });
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

// Returns a list of useful info about a country using the country code
const getCountryInfo = (countryCode) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getCountryInfo.php',
        async: false,
        dataType: 'json',        
        type: 'GET',
        data: {
            iso_a2: countryCode,
            apiKey: 'JU7S+Xei/S8WLbkghgdl/g==0UEhtMLxyRV2bwOR'
        },
        success: (result) => {
            data = result;
    }
    });
    return data;
};

// Initializes the border for the country on first load
let border = findUserLocation();

// This populates the select menu once the page is loaded
$('#document').ready(() => {
    $.ajax({
        url: 'libs/php/server.php',
        type: 'POST',
        dataType: 'json',
        data: {
            action: 'populateSelect'
        },
        success: (result) => {
            console.log(result)
            result['features'].forEach((country) => {
                $("<option>", {
                    value: country.properties.iso_a2,
                    text: country.properties.name
                }).appendTo('#countries');
            });
            // Sort the select list alphabetically
            $("#countries").append($("#countries option").remove().sort(function(a, b) {
                var at = $(a).text(), bt = $(b).text();
                return (at > bt)?1:((at < bt)?-1:0);
            }));  
            $('#countries').prepend('<option disabled selected>Select a country...</option>');
        }
    });
});

// This will set the border of the country based on the country code
const setBorder = (action, countryCode) => {
    $.ajax({
        url: 'libs/php/server.php',
        type: 'POST',
        dataType: 'json',
        data: {
            action: action,
            iso_a2: countryCode
        },
        success: (result) => {
            border = L.geoJSON(result);
            border.addTo(map);
        }
    });
}

// Helper function to remove borders
const removeBorder = () => {
    map.removeLayer(border);
}

// Handle button clicks for extra information
const getEconomicInfo = (currencyCode) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getExchangeRate.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            apiKey: '34NzIC9tuEyonUwU00QpIlmsL7AnS1ow',
            currencyCode: currencyCode
        },
        success: (result) => {
            data = result;
        }
    });
    return data;
}

// Function to display financial information for the country
const displayEconomicInfo = (currencyCode) => {
    $('#weatherInfo').css('display', 'none');
    $('#currencyResult').html('');
    // Clears the block to display new info
    $('#currencies').html('');
    const data = getEconomicInfo(currencyCode);
    $('#extraInfo').css('display', 'block');  
    $('#economicInfo').css('display', 'block');
    $('#currencies').html(
        // Populates the select with currencies for conversion
        Object.keys(data.rates).forEach((key) => {
            $('<option>', {
                value: data.rates[key],
                text: key,
                base: currencyCode
            }).appendTo('#currencies');
        })
    )
};

// Update exchange rates for economic info
$('#currencies').change(() => {
    const currency = $('#currencies option:selected').text();
    const value = $('#currencies').val();
    const base = $('#currencies option:selected').attr('base');
    $('#currencyResult').html(
        `<h3>1 ${base} = ${value} ${currency}`
    );
});

// Function to receive the weather information
const getWeatherInfo = (cityName) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getWeather.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            apiKey: '28928681a7104281b32131558222912',
            cityName: cityName
        },
        success: (result) => {
            data = result;
        }
    });
    return data;
};

// Function to display information for the weather
const displayWeatherInfo = (cityName) => {
    const data = getWeatherInfo(cityName);
    $('#extraInfo').css('display', 'block');
    $('#economicInfo').css('display', 'none');
    $('#weatherInfo').css('display', 'block');
    $('#weatherIcon').attr('src', `${data.current.condition.icon}`);
    $('#weatherInfoList').html(
        `   <h2>${cityName}</h2>
            <ul>
                <li><b>Temperature</b>: ${data.current.temp_c}&#176;C</li>
                <li><b>Condition</b>: ${data.current.condition.text} </li>
                <li><b>UV Index</b>: ${data.current.uv}</li>
                <li><b>Wind Speed</b>: ${data.current.wind_kph} km/h ${data.current.wind_dir}</li>
            </ul>
        `
    )
};

// This will update the map to display the relevant features once a new country is selected
$('#countries').change(() => {    
    removeBorder();
    $('#extraInfo').css('display', 'none');
    setBorder('getCountryBorders', $('#countries').val());
    getCountryInfo($('#countries').val());
    centerMap($('#countries').val());
});