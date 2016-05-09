﻿angular.module('MapsIndoors')

.controller('route', function ($scope, $location, $routeParams, $mdSidenav, $mdBottomSheet, $mdMedia, locations, mapsIndoors, googleMap, routeService, directionsRenderer, state) {
    var predefined,
        myPosition,
        destinationId = $location.search().destination,
        directions = new mapsindoors.DirectionsService(),
        autocomplete = new google.maps.places.AutocompleteService({ type: 'geocode' }),
        places = new google.maps.places.PlacesService(googleMap);

    $scope.fields = {
        destination: '',
        origin: ''
    };

    $scope.travelMode = 'WALKING';
    $scope.network = 'VENUE';
    $scope.avoidStairs = false;

    $scope.destination = {};

    $scope.reversed = false;

    $scope.select = function (location) {
        if ($scope.reversed) {
            $scope.fields.destination = location.properties.name;
        } else {
            $scope.fields.origin = location.properties.name;
        }

        if (location.properties.type === 'google_places') {
            places.getDetails({ placeId: location.properties.placeId }, function (place) {
                location.geometry = {
                    type: 'point',
                    coordinates: [place.geometry.location.lng(), place.geometry.location.lat()]
                };

                if ($scope.reversed) {
                    $scope.destination = location;
                } else {
                    $scope.origin = location;
                }

                getRoute();
            });
        } else {
            if ($scope.reversed) {
                $scope.destination = location;
            } else {
                $scope.origin = location;
            }

            getRoute();
        }
    };

    $scope.find = utils.debounce(function () {
        var query = $scope.reversed ? $scope.fields.destination : $scope.fields.origin;
        if ((query || '').length > 0) {
            search(query).then(function (results) {
                $scope.locations = results;
                $scope.$apply();
            });
        } else {
            $scope.reset();
            $scope.$apply();
        }
    }, 250);

    $scope.reverse = function () {
        $scope.reversed = !$scope.reversed;
        var tmp = $scope.fields.destination;
        $scope.fields.destination = $scope.fields.origin;
        $scope.fields.origin = tmp;
        tmp = $scope.destination;
        $scope.destination = $scope.origin;
        $scope.origin = tmp;

        if ($scope.origin && $scope.destination) {
            getRoute();
        }
    };

    $scope.switchNetwork = function (network) {
        $scope.network = network;
        $scope.find();
    };

    $scope.closeHorizontalDirections = function () {
        $scope.reset();
        $mdBottomSheet.cancel();
        $mdSidenav('left').open();
    };

    $scope.setTravelmode = function (mode) {
        $scope.travelMode = mode;
        getRoute();
    };

    $scope.legs = [];

    $scope.getLeg = function () {
        return directionsRenderer.getLegIndex();
    };

    $scope.setLeg = function (index) {
        directionsRenderer.setLegIndex(index);
        updateHorizontalView(index);
    };

    $scope.isFirstLeg = function () {
        return directionsRenderer.getLegIndex() === 0;
    };

    $scope.isLastLeg = function () {
        return directionsRenderer.getLegIndex() === $scope.legs.length - 1;
    };

    $scope.prevLeg = function () {
        directionsRenderer.previousLeg();
        updateHorizontalView(directionsRenderer.getLegIndex());
    };

    $scope.nextLeg = function () {
        directionsRenderer.nextLeg();
        updateHorizontalView(directionsRenderer.getLegIndex());
    };

    $scope.back = function () {
        clearRoute();
        history.back();
    };


    $scope.reset = function () {
        if ($scope.reversed) {
            $scope.destination = null;
            $scope.fields.destination = '';
        } else {
            $scope.origin = null;
            $scope.fields.origin = '';
        }
        if ($scope.network === 'VENUE') {
            $scope.locations = [myPosition].concat(predefined);
        } else {
            $scope.locations = [myPosition];
        }
        clearRoute();
    };

    function updateHorizontalView(index) {
        if ($scope.horizontalView) {
            var legElem = $('route-leg').get(index);
            $(legElem).parent().animate({
                scrollLeft: $(legElem).offset().left
            }, 300);

            google.maps.event.addListenerOnce(googleMap, 'idle', function() {
                googleMap.panBy(
                    0, 150
                );
            });

        }
    }

    function init(destination) {
        $scope.$apply(function () {
            $scope.destination = destination;
            $scope.fields.destination = destination.properties.name;
        });
    }

    function search(query) {
        var deffered = $.Deferred();
        switch ($scope.network) {
            case 'VENUE':
                state.getVenue().then(function (venue) {
                    locations.getLocations({ q: query, take: 10, venue: venue.name }).then(deffered.resolve);
                });
                break;
            case 'WORLD':
                autocomplete.getQueryPredictions({ input: query }, function (results) {
                    var floor = mapsIndoors.getFloor();
                    results = results.map(function (result) {
                        return {
                            type: 'Feature',
                            properties: {
                                type: 'google_places',
                                placeId: result.place_id,
                                name: result.description,
                                floor: floor
                            }
                        };
                    });
                    deffered.resolve(results);
                });
                break;
        }
        return deffered.promise();
    }

    function getMyPosition() {
        var deffered = $.Deferred();
        window.navigator.geolocation.getCurrentPosition(function (position) {
            var coords = position.coords,
            feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [coords.longitude, coords.latitude]
                },
                properties: {
                    name: 'My Position',
                    type: 'myposition'
                }
            };

            deffered.resolve(feature);
        }, function () {
            deffered.resolve();
        });

        return deffered.promise();
    }

    function getPredefined(venue) {
        return locations.getLocations({ categories: 'startpoint', venue: venue.name });
    }

    function getRoute() {
        if ($scope.origin && $scope.destination) {
            var origin = $scope.origin,
                destination = $scope.destination;

            var args = {
                origin: {
                    lat: origin.geometry.coordinates[1],
                    lng: origin.geometry.coordinates[0],
                    floor: origin.properties.floor
                },
                destination: {
                    lat: destination.geometry.coordinates[1],
                    lng: destination.geometry.coordinates[0],
                    floor: destination.properties.floor
                },
                travelMode: $scope.travelMode,
                avoidStairs: $scope.avoidStairs
            };

            directions.route(args).then(function (result) {
                $scope.$apply(function () {
                    if ($mdMedia('xs')) { 
                        $mdSidenav('left').close();
                        $scope.horizontalView = true;
                        $mdBottomSheet.show({
                            scope: $scope,
                            preserveScope:true,
                            controller: function () {},
                            templateUrl: 'controllers/route/route-bottom-sheet.tpl.html',
                            clickOutsideToClose: false,
                            disableBackdrop: true
                        }).then(function () {
                            $scope.closeHorizontalDirections();
                        }, function () {
                            $scope.closeHorizontalDirections();
                        });
                    }

                    $scope.legs = result.routes[0].legs;
                    directionsRenderer.setDirections(result);
                    directionsRenderer.setLegIndex(0);
                    google.maps.event.addListenerOnce(googleMap, 'idle', function () {
                        googleMap.panBy(
                            0, 120
                        );
                    });
                });

            });
        }
    }

    function clearRoute() {
        directionsRenderer.setDirections(null);
        $scope.legs = [];
    }

    state.getVenue().then(function (venue) {
        $.when(getMyPosition(), getPredefined(venue)).then(function () {
            myPosition = arguments[0];
            predefined = arguments[1][0];

            if ($scope.network === 'VENUE') {
                $scope.locations = [myPosition].concat(predefined);
            } else {
                $scope.locations = [myPosition];
            }

            $scope.$apply();
        });
    });

    if (routeService.destination) {
        $scope.destination = routeService.destination;
        $scope.fields.destination = routeService.destination.properties.name;
    } else if (destinationId) {
        locations.getLocation(destinationId).then(function (feature) {
            $scope.$apply(function () {
                $scope.destination = feature;
                $scope.fields.destination = feature.properties.name;
            });
        });
    } else if ($routeParams.from && $routeParams.to) {
        $.when(locations.getLocation($routeParams.from), locations.getLocation($routeParams.to)).then(function (origin, destination) {
            $scope.$apply(function () {
                $scope.destination = destination[0];
                $scope.fields.destination = destination[0].properties.name;

                $scope.origin = origin[0];
                $scope.fields.origin = origin[0].properties.name;
                getRoute();
            });
        });
    } else {
        $location.path('/search/');
    }
});
