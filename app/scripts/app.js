angular.module('MapsIndoors', [
    'ngMaterial',
    'ngRoute'
])

.config(function ($routeProvider, $locationProvider, $mdThemingProvider) {
    $mdThemingProvider.theme('default')
          .primaryPalette('blue')
          .accentPalette('red');

    $routeProvider
        .when('/:venue', {
            templateUrl: 'controllers/search/search.tpl.html',
            controller: 'search'
        })
        .when('/:venue/search', {
            templateUrl: 'controllers/search/search.tpl.html',
            controller: 'search'
        })
        .when('/:venue/search/:type', {
            templateUrl: 'controllers/search/search.tpl.html',
            controller: 'search'
        })
        .when('/:venue/details/:id/', {
            templateUrl: 'controllers/details/details.tpl.html',
            controller: 'details'
        })
        .when('/:venue/route/', {
            templateUrl: 'controllers/route/route.tpl.html',
            controller: 'route'
        })
        .when('/:venue/route/from/:from/to/:to', {
            templateUrl: 'controllers/route/route.tpl.html',
            controller: 'route'
        })
        .otherwise({
            redirectTo: '/550c286964617400a4100000'
        });
   
    $locationProvider.html5Mode(true);
})

.controller('main', function ($scope, $location, $timeout, $mdSidenav, $routeParams, mapsIndoors, googleMap, locations, venues, state) {
    $scope.title = "MapsIndoors";
    $scope.showSidenav = true;

    $scope.toggle = function (mdId) {
        $mdSidenav(mdId).toggle();
    };

    //google.maps.event.addListener(googleMap, 'idle', function () {
    //    var coords = '@' + googleMap.getCenter().lat().toFixed(12) + ',' + googleMap.getCenter().lng().toFixed(12) + ',' + googleMap.getZoom() + 'z',
    //        path = $location.path();

    //    if (path.indexOf(coords) < 0) {
    //        if (path.indexOf('@') > -1) {
    //            path = path.replace(/@(.*?)$/, coords);
    //        } else {
    //            path += !path.match(/\/$/) ? '/' + coords : coords;
    //        }
    //        $timeout(function () {
    //            console.log(path);
    //            $location.path(path);
    //        }, 0);
    //    }
    //});

    $scope.$on('$routeChangeSuccess', function (e, current, previous) {
        //if (current && previous) {
        //    var reload = Object.keys(current.params).map(function (key) {
        //        if (key !== 'coordinates') {
        //            return current.params[key] !== previous.params[key];
        //        } else {
        //            return false;
        //        }
        //    }).reduce(function (result, changed) {
        //        return changed ? changed : result;
        //    }, false);

        //    if (!reload) {
        //        e.preventDefault();
        //    }
        //}

        if ($scope.venueId !== (current.pathParams ? current.pathParams.venue : '')) {
            $scope.venueId = $routeParams.venue;
            venues.getVenue($scope.venueId).then(function (venue) {
                if (venue) {
                    if (!$routeParams.coordinates) {
                        var bounds = new google.maps.LatLngBounds(),
                            bbox = [-180, -90, 180, 90],
                            sort = function (a, b) {
                                return a === b ? 0 : a > b ? 1 : -1;
                            };
                        //this is a workaround for invalid data from MapToWeb.GeoJSON 
                        venue.geometry.coordinates.forEach(function (ring) {
                            var lng = ring.map(function (coords) {
                                return coords[0];
                            }).sort(sort);

                            var lat = ring.map(function (coords) {
                                return coords[1];
                            }).sort(sort);

                            bbox[0] = lng.last() >= bbox[0] ? lng.last() : bbox[0];
                            bbox[2] = lng[0] <= bbox[2] ? lng[0] : bbox[2];

                            bbox[1] = lat.last() >= bbox[1] ? lat.last() : bbox[1];
                            bbox[3] = lat[0] <= bbox[3] ? lat[0] : bbox[3];
                        });
                        //----------------------------------------------------------//
                        bounds.extend(new google.maps.LatLng(bbox[1], bbox[0]));
                        bounds.extend(new google.maps.LatLng(bbox[3], bbox[2]));

                        googleMap.fitBounds(bounds);
                    }
                    mapsIndoors.setVenue($scope.venueId);
                }
            });
        }

        //if ($routeParams.coordinates) {
        //    var matches = $routeParams.coordinates.match(/^(.*?),(.*?),(.*?)z$/),
        //        lat = parseFloat(Number(matches[1]).toFixed(12)),
        //        lng = parseFloat(Number(matches[2]).toFixed(12)),
        //        z = parseFloat(matches[3]);

        //    googleMap.panTo({ lat: lat, lng: lng });
        //    googleMap.setZoom(z);
        //}



    });

    locations.getTypes().then(function setTypes(data) {
        state.types = {};
        data.sort(function (a, b) {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        }).forEach(function (type) {
            state.types[type.name.toLowerCase()] = type;
        });
    });

});
