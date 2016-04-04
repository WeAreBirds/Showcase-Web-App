angular.module('MapsIndoors')

.factory('googleMap', function ($location) {
    var element = document.getElementById('google-map'),
        map = new google.maps.Map(element, {
            zoom: 17
        });

    return map;
});