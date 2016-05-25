angular.module('MapsIndoors')
 .factory('mapsIndoors', function ($routeParams, $location, $rootScope, googleMap, $http) {
     mapsindoors.locale.setLanguage('da');
     var mapsIndoors = new mapsindoors.MapsIndoors({ map: googleMap, buildingOutlineOptions: { visible: false } });
     var div = document.createElement('div');
     var control = new mapsindoors.FloorSelector(div, mapsIndoors);
     var level = {
         '18': ['assemblypoint', 'bikeshed', 'parking', 'reception', 'smokingarea'],
         '19': ['elevator', 'stairs', 'toilet'],
     },
     halo = {
         path: google.maps.SymbolPath.CIRCLE,
         scale: 12,
         strokeColor: '#1976D2',
         fillOpacity: 0,
         strokeWeight: 5,
         strokeOpacity: 0.5
     };

     googleMap.controls[google.maps.ControlPosition.RIGHT_CENTER].push(div);

     google.maps.event.addListener(mapsIndoors, 'location_click', function (location) {
         mapsIndoors.clear();
         $location.path($routeParams.venue + '/details/' + location.id);
         $rootScope.$apply();
     });

     mapsIndoors.setHighlightOptions({ halo: halo });

     //debugger;
     //$.getJSON('//api.mapsindoors.com/api/solutions/details/55cdde212a91e0049824fe86').then(function(solution) {
     //    solution.types.forEach(function (type) {
     //        if (level['18'].indexOf(type.name.toLowerCase()) >= 0 ) {
     //            mapsIndoors.setDisplayRule(type.name, { from: 18 });
     //        } else if (level['19'].indexOf(type.name.toLowerCase()) >= 0) {
     //            mapsIndoors.setDisplayRule(type.name, { from: 19 });
     //        } else {
     //            mapsIndoors.setDisplayRule(type.name, { from: 20 });
     //        }
     //    });
     //});
     return mapsIndoors;

 })
 .factory('directionsRenderer', function (mapsIndoors) {
     var dr = new mapsindoors.DirectionsRenderer({ mapsindoors: mapsIndoors, suppressMarkers: false });
     dr.setStyle('default', {
         strokeOpacity: 1,
         strokeWeight: 6,
         strokeColor: '#90CAF9'
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

.service('locations', function () { return new mapsindoors.LocationsService(); })
.service('venues', function () { return new mapsindoors.VenuesService(); })
.service('state', function (venues, $routeParams) {
    var venue;
    return {
        getVenue: function () {
            return $.when(venue || venues.getVenue($routeParams.venue).then(function (result) {
                venue = result;
                return result;
            }));
        }
    };
})
.service('routeService', function () { });

var utils = utils || {};
if (!utils.debounce) {
    utils.debounce = function (fn, delay) {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    };
}