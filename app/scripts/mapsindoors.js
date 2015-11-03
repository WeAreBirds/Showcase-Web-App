angular.module('MapsIndoors')
 .factory('mapsIndoors', function (googleMap) {
     var mapsIndoors = new mapsindoors.MapsIndoors({ map: googleMap });
     var div = document.createElement('div');
     var control = new mapsindoors.FloorSelector(div, mapsIndoors);
     googleMap.controls[google.maps.ControlPosition.RIGHT_CENTER].push(div);

     return mapsIndoors;

 })
 .factory('directionsRenderer', function (mapsIndoors) {
     var dr = new mapsindoors.DirectionsRenderer({ mapsindoors: mapsIndoors, suppressMarkers: false });
     dr.setStyle('default', {
         strokeOpacity: 1,
         strokeColor: 'rgb(33,150,243)'
     });

     dr.setStyle('hidden', {
         strokeOpacity: 0.1875,
         strokeColor: 'rgb(33,150,243)'
     });

     dr.setStyle('inactive', {
         visible: false
     });

     return dr;
 })

.service('locations', function () { return new mapsindoors.LocationsService(); });
