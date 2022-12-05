import data from './data.json' assert { type: "json" };
const countries = $('#countries');
$.each(data.features, function() {
    countries.append(new Option(this.properties.name, this.properties.iso_a2));
});
