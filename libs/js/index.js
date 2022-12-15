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
            const coords = result.results[0].geometry;
            const info = getCountryInfo(countryCode);
            map.setView([coords.lat, coords.lng], 5);
            marker.setLatLng(coords);
            $('#countryInfo').html(
                `<div class='country-info'>
                    <h1>${info[0].name}</h1><img class='flag' src='https://countryflagsapi.com/png/${countryCode}'/>
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
                        <button id='weather' onClick='getWeatherInfo()'>Weather Info</button>
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
            // Sort alphabetically
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

const displayEconomicInfo = (currencyCode) => {
    console.log('This is executing');
    $('#currencies').html('');
    $('#currencyResult').html('')
    const data = getEconomicInfo(currencyCode);
    $('#currencies').html(
        Object.keys(data.rates).forEach((key) => {
            $('<option>', {
                value: data.rates[key],
                text: key,
                base: currencyCode
            }).appendTo('#currencies');
        })
    )

    $('#extraInfo').css('display', 'block');
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

const getWeatherInfo = () => {
    $('#extraInfo').css('display', 'block');
    $('#extraInfo').html(
        `
            <h1>Weather Information</h1>
            <hr />
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