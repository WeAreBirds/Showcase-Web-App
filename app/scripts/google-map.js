angular.module('MapsIndoors')

.factory('googleMap', function () {
    var element = document.getElementById('google-map'),
        map = new google.maps.Map(element, {
            center: { lat: 57.086154, lng: 9.959267 },
            zoom: 17
        });


    return map;
});