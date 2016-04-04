angular.module('MapsIndoors')

.controller('details', function ($scope, $location, $timeout, $routeParams, $route, $mdSidenav, $mdDialog, routeService, locations, googleMap, mapsIndoors, directionsRenderer) {
    var _id = $routeParams.id,
        highlightIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            strokeColor: '#2196F3',
            fillOpacity: 0,
            strokeWeight: 5,
            strokeOpacity: 0.3
        };

    var getById = function (id) {
        locations.getLocation(id).then(function (location) {
            $timeout(function () {
                if (location) {
                    if (location.properties.fields && location.properties.fields.website && location.properties.fields.website.value) {
                        var pattern = /^https?:\/\//;
                        if (!pattern.test(location.properties.fields.website.value)) {
                            location.properties.fields.website.value = 'http://' + location.properties.fields.website.value;
                        }
                    }
                    $scope.location = location;
                    mapsIndoors.setFloor($scope.location.properties.floor);
                    mapsIndoors.setLocationsVisible(false);
                    googleMap.setCenter({ lat: $scope.location.geometry.coordinates[1], lng: $scope.location.geometry.coordinates[0] });
                    googleMap.setZoom(21);
                    mapsIndoors.find(location.id);

                }
            }, 0);
        });
    };

    if (_id && _id.length === 24) {
        $mdSidenav('left').open();
        getById(_id);
    } else if (_id) {
        $mdSidenav('left').open();
        locations.getLocations({ roomId: _id }).then(function (locations) {
            if (locations[0]) {
                getById(locations[0].id);
            }
        });
    }

    $scope.back = function () {
        mapsIndoors.clear();
        mapsIndoors.setLocationsVisible(true);
        console.log($location);
        console.log($route);
        //Make sure we don't back out of app
        if (history.length > 2) {
            history.back();
            //$location.path($routeParams.venue + '/search/' + $scope.location.properties.type);
        } else {
            $location.path($routeParams.venue + '/search/');
        }
    };

    $scope.share = function (e) {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, poi) {
                $scope.location = poi;
                $scope.hide = function () {
                    $mdDialog.hide();
                };

                $scope.url = $location.absUrl();

                $scope.copy = function () {
                    try {
                        var link = document.getElementById('share-location-link');
                        link.focus();
                        link.select();

                        document.execCommand('copy');
                    } catch (err) {

                    }
                };
            },
            locals: {
                poi: $scope.location
            },
            templateUrl: 'controllers/details/share.tpl.html',
            parent: angular.element(document.body),
            targetEvent: e,

            clickOutsideToClose: true
        });
    };

    $scope.getRoute = function () {
        console.log($scope.location);
        routeService.destination = $scope.location;
        routeService.direction = 'to';
        $location.path('/route/').search('destination', $scope.location.id);
    };

    $scope.getRoute = function () {
        routeService.destination = $scope.location;
        routeService.direction = 'to';
        $location.path($routeParams.venue + '/route/').search('destination', $scope.location.id);
    };

    $scope.showOnMap = function () {
        mapsIndoors.locate({ fitBounds: true, locationId: $scope.location.id, locations: { q: $scope.location.properties.roomId, take: 1 }, highlightIcon: highlightIcon, suppressOthers: true });
    };
});