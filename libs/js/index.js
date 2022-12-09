// Set up the map interface
const map = L.map('mapid').setView([0, 0], 3);
const attribution = 
'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Implement the tiles to use
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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
            console.log(info[0])
            marker.bindPopup(
                `<div>
                    <h1>${info[0].name}</h1>
                    <ul>
                        <li>Capital City: ${info[0].capital}</li>
                    </ul>
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
            result['features'].forEach((country) => {
                $("<option>", {
                    value: country.properties.iso_a2,
                    text: country.properties.name
                }).appendTo('#countries');
            });
        }
    });
});

// This will set the boarder of the country based on the country code
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

// This will update the map to display the relevant features once a new country is selected
$('#countries').change(() => {    
    removeBorder();
    setBorder('getCountryBorders', $('#countries').val());
    getCountryInfo($('#countries').val());
    centerMap($('#countries').val());
});