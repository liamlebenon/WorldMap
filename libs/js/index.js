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

const closeCountryInfo = () => {
    $('#countryInfoModal').fadeOut(300);
}

$('.closeExtraInfo').click(closeInfoBox);
$('#closeCountryInfo').click(closeCountryInfo);


// Main country info card
L.easyButton('<i class="fa-solid fa-globe"></i>', function(){
    $('#countryInfoModal').toggle(200);
}).addTo(map);

// Extra info for wikipedia card
L.easyButton('<i class="fa-solid fa-book"></i>', function(){
    const formattedCountry = countryInfo.name.replace(' ', '+');
    $('#extraInfo').fadeIn(300);
    displayWikipediaInfo(formattedCountry);
}).addTo(map);

// Extra info for economics card
L.easyButton('<i class="fa-solid fa-dollar"></i>', function(){  
    $('#extraInfo').fadeIn(300);
    displayEconomicInfo(countryInfo.currencyCode);
}).addTo(map);

// Extra info for weather card    
L.easyButton('<i class="fa-solid fa-cloud"></i>', function() {   
    $('#extraInfo').fadeIn(300);
    displayWeatherInfo(countryInfo.capital);    
    $('#countryInfoModal').hide();
    $('#extraInfoModal').hide();
    $("#weatherModal").modal("show");

}).addTo(map);

// Extra info for covid card
L.easyButton('<i class="fa-solid fa-virus-covid"></i>', function() {   
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
    capitalCoords: {},
    currency: '',
};

// Initialize variables for cluster markers
let layerControl;
let aoiGroup;
let parkGroup;

// This creates the layers for marker clusters
const createLayerData = () => {
    markers = L.markerClusterGroup();
    const data = getAreasOfInterest(countryInfo.countryCode);
    const airportData = getAirports(countryInfo.countryCode);
    const areasOfInterest = [];
    const airports = [];

    airportData.geonames.forEach(airport => {
        airports.push({
            coords: {
                lat: airport.lat,
                lng: airport.lng
            },
            name: airport.name
        })
    });

    data.geonames.forEach(poi => {
        // Create an object of data needed for the areas of interest
        areasOfInterest.push({
            coords: {
                lat: poi.lat,
                lng: poi.lng
            },
            name: poi.name,
        });
    });
    
    const airportList = [];
    for (let i = 0; i < airports.length; i++) {
        let airport = airports[i];
        const customIcons = L.ExtraMarkers.icon({
            icon: 'fa-plane',
            markerColor: 'yellow',
            shape: 'circle',
            prefix: 'fa'
        });

        let marker = L.marker(new L.LatLng(airport.coords.lat, airport.coords.lng), { title: airport.name, icon: customIcons });
        marker.bindPopup(`
            <h3>${airport.name}</h3>
        `)
        airportList.push(marker);
    }

    const cities = [];
    
    // For loop to check each AOI and assign a custom icon based on the areas type
	for (let i = 0; i < areasOfInterest.length; i++) {
		let aoi = areasOfInterest[i];
        // Uses the getIcon function to get the correct marker icon
        const customIcons = L.ExtraMarkers.icon({
            icon: 'fa-city',
            markerColor: 'red',
            shape: 'square',
            prefix: 'fa'
        });
        if (aoi.name !== countryInfo.name) {
           	let marker = L.marker(new L.LatLng(aoi.coords.lat, aoi.coords.lng), { title: aoi.name, icon: customIcons });
            
            // Gets wikidata
            const wikiData = getWikipedia(aoi.name.replace(' ', '+'));
            let wikiDataPages;
            if (wikiData !== null) {
                wikiDataPages = wikiData.query.pages;
                const extract = wikiDataPages[Object.keys(wikiDataPages)[0]];
                marker.bindPopup(`
                <h3>${aoi.name}</h3>
                <p>${extract.extract === undefined ? 'No Wikipedia data available...' : extract.extract}</p>
                <p>Read more at <a href='https://en.wikipedia.org/?curid=${extract.pageid}'>Wikipedia</a></p>
                `);   

            }
            cities.push(marker); 
        }

    }    

    // Creating the layer group
    aoiGroup = L.layerGroup(cities);
    airportGroup = L.layerGroup(airportList);
    map.addLayer(markers);

    const overlayAois = {
        "Cities": aoiGroup,
        "Airports": airportGroup
    };

    layerControl = L.control.layers(null, overlayAois).addTo(map);
}

let marker
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
            const info = getCountryInfo(countryCode);
            const capitalCoords = getCoordsForCapital(info[0].capital);            

            // Adds all the basic info to the country store object (countryInfo)
            countryInfo.name = info[0].name;
            countryInfo.currencyCode = info[0].currency.code;
            countryInfo.countryCode = countryCode;
            countryInfo.capital = info[0].capital;
            countryInfo.capitalCoords = {
                latitude: capitalCoords[0].lat,
                longitude: capitalCoords[0].lon
            };
            countryInfo.population = info[0].population;
            countryInfo.currency = info[0].currency.code;
            countryInfo.landArea = info[0].surface_area.toLocaleString('en-US');

            $('#countryName').html(countryInfo.name);
            $('#countryFlag').attr('src', `https://countryflagsapi.com/png/${countryCode}`)
            $('#modalInfo').css('display: block');
            $('#modalInfo').html(`
                <table class="table">
                    <tbody>
                      <tr>
                        <th><i class="fa-solid fa-landmark-flag"></i> Capital City</th>
                        <td>${countryInfo.capital}</td>
                      </tr>
                      <tr>
                        <th><i class="fa-solid fa-people-line"></i> Population</th>
                        <td>${countryInfo.population / 1000} million</td>
                      </tr>
                      <tr>
                        <th><i class="fa-solid fa-sack-dollar"></i> Currency</th>
                        <td>${countryInfo.currency}</td>
                      </tr>
                      <tr>
                        <th><i class="fa-solid fa-ruler-combined"></i> Land Area</th>
                        <td>${countryInfo.landArea} km&#178;</td>
                    </tr>
                    </tbody>
                </table>`
            )
            createLayerData();
        }
    });
    
};



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
                $('#countries').val(countryCode).change();
                
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
            border = L.geoJSON(result).setStyle({ fillColor: 'white', color: 'blue'}).addTo(map)
            map.fitBounds(border.getBounds());
            
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
    map.removeLayer(airportGroup)
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
    $('#covidInfo').css('display', 'none');
    $('#wikipediaInfo').css('display', 'none');
    // Clears block to display new info
    $('#currencies').html('');
    $('#extraInfoModal').css('display', 'block');

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
    const forecast = data.data.forecast;
    $('#weatherLocation').html(
        `${data.data.location} Forecast`
    );
    $('#todayConditions').html(forecast[0].conditionText);
    $('#todayIcon').attr('src', forecast[0].conditionIcon);
    $('#todayMaxTemp').html(forecast[0].maxC);
    $('#todayMinTemp').html(forecast[0].minC);

    $('#day1Date').html(forecast[1].date);
    $('#day1MaxTemp').html(forecast[1].maxC);
    $('#day1MinTemp').html(forecast[1].minC);
    $('#day1Icon').attr('src', forecast[1].conditionIcon);

    $('#day2Date').html(forecast[2].date);
    $('#day2MaxTemp').html(forecast[2].maxC);
    $('#day2MinTemp').html(forecast[2].minC);
    $('#day2Icon').attr('src', forecast[2].conditionIcon);
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
    $('#extraInfoModal').css('display', 'block');
    $('#economicInfo').css('display', 'none');
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

    $('#extraInfoBody').html(
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
        `<table class="table">
            <tbody>
              <tr>
                <th><i class="fa-solid fa-virus-covid"></i> Confirmed Cases</th>
                <td>${data.confirmed}</td>
              </tr>
              <tr>
                <th><i class="fa-solid fa-cross"></i> Deaths</th>
                <td>${data.deaths}</td>
              </tr>
              <tr>
                <th><i class="fa-solid fa-calendar-days"></i> Last Updated</th>
                <td>${data.lastUpdated}</td>
              </tr>
            </tbody>
        </table>
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
    removeBorder();
    removeLayer();
    $('#extraInfo').css('display', 'none');
    setBorder('getCountryBorders', $('#countries').val());
    centerMap($('#countries').val());
    getCountryInfo($('#countries').val());
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
const getAreasOfInterest = (countryCode) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getAreasOfInterest.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            countryCode: countryCode
        },
        success: (result) => {
            data = result;
        }
    });
    return data;
};

const getAirports = (countryCode) => {
    let data = '';
    $.ajax({
        url: 'libs/php/getAirports.php',
        type: 'POST',
        async: false,
        dataType: 'json',
        data: {
            countryCode: countryCode
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
    $('#economicInfo').css('display', 'none');
    $('#covidInfo').css('display', 'none');
    $('#wikipediaInfo').css('display', 'block');
    $('#extraInfoModal').css('display', 'block');
    $('#wikipediaResult').html(
        `${extract.extract}
        <p>Read more at: <a href=https://en.wikipedia.org/?curid=${extract.pageid}>Wikipedia</a></p>`
    )
};