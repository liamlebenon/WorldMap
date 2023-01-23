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

// Close extra info button
const closeInfoBox = () => {
    $('#extraInfo').fadeOut(300);
};

$('.closeExtraInfo').click(closeInfoBox);

// Main country info card
L.easyButton('<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Globe_icon.svg/2048px-Globe_icon.svg.png" width="16px">', function(){
    $('#countryInfo').toggle(200);
}).addTo(map);

L.easyButton('<img src="https://cdn-icons-png.flaticon.com/512/152/152814.png" width="16px">', function(){
    const formattedCountry = countryInfo.name.replace(' ', '+');
    $('#extraInfo').fadeIn(300);
    displayWikipediaInfo(formattedCountry);
}).addTo(map);

// Extra info for economics card
L.easyButton('&dollar;', function(){  
    $('#extraInfo').fadeIn(300);
    displayEconomicInfo(countryInfo.currencyCode);
}).addTo(map);

// Extra info for weather card    
L.easyButton('<img src="https://cdn-icons-png.flaticon.com/512/218/218706.png" width="18px">', function() {   
    $('#extraInfo').fadeIn(300);
    displayWeatherInfo(countryInfo.capital);
}).addTo(map);

// Extra info for covid card
L.easyButton('<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Coronavirus_icon.svg/240px-Coronavirus_icon.svg.png" width="22px">', function() {   
    $('#extraInfo').fadeIn(300);
    displayCovidInfo(countryInfo.name);
}).addTo(map);

let markers;

// The country store to contain all country data for easier use
let countryInfo = {
    name: '',
    capital: '',
    currencyCode: '',
    countryCode: '',
    capitalCoords: {}
};

// Initialize variables for cluster markers
let layerControl;
let aoiGroup;

// This creates the layers for marker clusters
const createLayerData = () => {
    markers = L.markerClusterGroup();
    const data = getAreasOfInterest(countryInfo.capitalCoords.latitude, countryInfo.capitalCoords.longitude);
    const areasOfInterest = [];
    data.features.forEach(poi => {
        let aoiType = poi.properties.kinds.split(',');
        // Create an object of data needed for the areas of interest
        if (poi.properties.name !== '') {
            areasOfInterest.push({
                coords: poi.geometry.coordinates,
                name: poi.properties.name,
                rate: poi.properties.rate,
                wikiId: poi.id,
                type: aoiType[0]
            });
        }
    });

    const aoiList = [];
    // For loop to check each AOI and assign a custom icon based on the areas type
	for (let i = 0; i < areasOfInterest.length; i++) {
		let aoi = areasOfInterest[i];
        const getIcon = (buildingType) => {
            switch (buildingType) {
                case 'historic':
                    return 'https://simpsonandhill.co.uk/wp-content/uploads/2019/08/bank-building.png';

                case 'architecture':
                    return 'https://claremontinteriors.com/wp-content/uploads/2020/11/whitearchitectsplans.png';

                case 'cultural':
                    return 'https://www.seekpng.com/png/full/394-3949007_our-team-transparent-people-white-icon.png';

                case 'sport':
                    return 'https://iconsplace.com/wp-content/uploads/_icons/ffffff/256/png/football-icon-18-256.png'

                case 'fortifications':
                    return 'https://flaticons.net/icon.php?slug_category=network-security&slug_icon=castle';

                default:
                    return 'https://www.pngkey.com/png/full/323-3232484_black-building-icon-png-building-white-icon-png.png';   
            }
        }
        const customIcons = L.icon({
            iconUrl: getIcon(aoi.type),
            markerColor: 'blue',
            iconSize: [80, 80]
        });
		let marker = L.marker(new L.LatLng(aoi.coords[1], aoi.coords[0]), { title: aoi.name, icon: customIcons });
		marker.bindPopup(
            `<h3>${aoi.name}</h3>
            <p>${aoi.type.charAt(0).toUpperCase() + aoi.type.slice(1)} site`
        );
        aoiList.push(marker);
    }    

    // Creating the layer group
    aoiGroup = L.layerGroup(aoiList);
    map.addLayer(markers);

    const overlayAois = {
        "Areas of Interest": aoiGroup
    };

    layerControl = L.control.layers(overlayAois).addTo(map);
    map.on('baselayerchange', () => {
        markers.addLayer(aoiGroup);
    })
}

// Func for getting basic info for the country as well as get the Lat/Lng to center the map when the user selects a country
const centerMap = (countryCode) => {
    $.ajax({
        url: 'libs/php/findCapitalByCode.php',
        dataType: 'json',        
        type: 'GET',
        data: {
            iso_a2: countryCode,
        },
        success: (result) => {
            let coords;
            const info = getCountryInfo(countryCode);

            const capitalCoords = getCoordsForCapital(info[0].capital);
            map.setView([capitalCoords[0].lat, capitalCoords[0].lon], 5);
            coords = {
                lat: capitalCoords[0].lat,
                lng: capitalCoords[0].lon
            }
            marker.setLatLng(coords);

            // Get coords for the capital city
            

            // Adds all the basic info to the country store object (countryInfo)
            countryInfo.name = info[0].name;
            countryInfo.currencyCode = info[0].currency.code;
            countryInfo.countryCode = countryCode;
            countryInfo.capital = info[0].capital;
            countryInfo.capitalCoords = {
                latitude: capitalCoords[0].lat,
                longitude: capitalCoords[0].lon
            };
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
                </div>`
            );
            $('#countryInfo').css('display: block');
            const formattedCountry = countryInfo.name.replace(' ', '+');
            displayWikipediaInfo(formattedCountry);
            marker.openPopup();

            createLayerData();
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

const removeLayer = () => {
    // Clear the layers of markers on the map
    map.removeControl(layerControl);
    map.removeLayer(markers);
    map.removeLayer(aoiGroup);
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
    $('#currencyResult').html('');
    $('#weatherInfo').css('display', 'none');
    $('#covidInfo').css('display', 'none');
    $('#wikipediaInfo').css('display', 'none');
    // Clears the block to display new info
    $('#currencies').html('');
    const data = getEconomicInfo(currencyCode);
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
    const spaceIndex = cityName.indexOf(' ');
    const formattedName = cityName.slice(0, spaceIndex);
    const data = getWeatherInfo(formattedName);
    $('#extraInfo').css('display', 'block');
    $('#economicInfo').css('display', 'none');
    $('#covidInfo').css('display', 'none');    
    $('#wikipediaInfo').css('display', 'none');
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

const displayCovidInfo = (country) => {
    // Change country names for few exceptions:
    if (country === 'United States') {
        country = 'US';
    }
    if (country === 'Russian Federation') {
        country = 'Russia'
    }
    const data = getCovidInfo(country);
    // Clears the card for the new covid information to be displayed
    $('#extraInfo').css('display', 'block');
    $('#economicInfo').css('display', 'none');
    $('#weatherInfo').css('display', 'none');
    $('#wikipediaInfo').css('display', 'none');
    $('#covidInfo').css('display', 'block');
    $('#provinces').html('');
    $('#provinceResult').html('');

    const provinceData = {};
    // Taking the returned data and assigning it to an object containing all data for provinces with the province as the key and another object as the value
    data.data.covid19Stats.forEach(province => {
        // If statement checks to see if theere is data for each province or if the data is for the entire country
        if (province.province === null) {
            provinceData[province.country] = {
                confirmed: province.confirmed,
                deaths: province.deaths,
                lastUpdate: province.lastUpdate
            }
        } else {
            provinceData[province.province] = {
                confirmed: province.confirmed,
                deaths: province.deaths,
                lastUpdate: province.lastUpdate
        }
        }

    });

    $('#provinces').html(
        // Populates the select with currencies for conversion
        Object.keys(provinceData).forEach((key) => {
                $('<option>', {
                    value: key,
                    text: key,
                    confirmed: provinceData[key].confirmed,
                    deaths: provinceData[key].deaths,
                    lastUpdate: provinceData[key].lastUpdate
                }).appendTo('#provinces');
        }),
        $('#provinces').prepend('<option disabled selected>Select a province...</option>')
    )
    getAreasOfInterest(countryInfo.capitalCoords.latitude, countryInfo.capitalCoords.longitude);
}

// Update the Covid Information when there is a change to the province selector
$('#provinces').change(() => {
    const selected = $('#provinces option:selected');
    const data = {
        confirmed: Number(selected.attr('confirmed')).toLocaleString('en-US'),
        deaths: Number(selected.attr('deaths')).toLocaleString('en-US'),
        lastUpdated: selected.attr('lastupdate')
    };
    $('#provinceResult').html(
        `   <ul>
                <li><b>Total Confirmed</b>: ${data.confirmed}</li>
                <li><b>Total Deaths</b>: ${data.deaths}</li>
                <li><b>Last Updated</b>: ${data.lastUpdated}</li>
            </ul>
        
        `
    );
});

//Function to receive COVID information
const getCovidInfo = (country) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getCovid.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            country: country
        },
        success: (result) => {
            data = result;
        }
    });
    return data;
};

// This will update the map to display the relevant features once a new country is selected
$('#countries').change(() => {    
    extraInfoIsOpen = false;
    removeBorder();
    removeLayer();
    $('#extraInfo').css('display', 'none');
    setBorder('getCountryBorders', $('#countries').val());
    getCountryInfo($('#countries').val());
    centerMap($('#countries').val());
});

// Gets the coordinates for the capital city to be used for other functions
const getCoordsForCapital = (capital) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getCoordsForCapital.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            capital: capital
        },
        success: (result) => {
            data = result;
        }
    });
    return data;
};

// Function to fetch the areas of interest 
const getAreasOfInterest = (lat, long) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getAreasOfInterest.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            latitude: lat,
            longitude: long
        },
        success: (result) => {
            data = result;
        }
    });
    return data;
};

// Function to return the wikipedia excerpt
const getWikipedia = (countryName) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getWikipedia.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            countryName: countryName
        },
        success: (result) => {
            data = result;
        }
    });
    return data;
}

// Function to display the wikipedia information for the selected country
const displayWikipediaInfo = (countryName) => {
    const data = getWikipedia(countryName);
    const wikiArticle = data.query.pages;
    const extract = wikiArticle[Object.keys(wikiArticle)[0]];
    $('#extraInfo').css('display', 'block');
    $('#economicInfo').css('display', 'none');
    $('#covidInfo').css('display', 'none');    
    $('#weatherInfo').css('display', 'none');
    $('#wikipediaInfo').css('display', 'block');
    $('#wikipediaResult').html(
        `   ${extract.extract}...
        <p>Read more at: <a href=http://en.wikipedia.org/?curid=${extract.pageid}>Wikipedia</a></p>
        `
    )
};