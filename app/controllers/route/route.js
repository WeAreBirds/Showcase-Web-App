angular.module('MapsIndoors')

.controller('route', function ($scope, $location, $routeParams, locations, mapsIndoors, googleMap, routeService, directionsRenderer, state) {
    var predefined,
        myPosition,
        destinationId = $location.search().destination,
        directions = new mapsindoors.DirectionsService(),
        autocomplete = new google.maps.places.AutocompleteService({ type: 'geocode' }),
        places = new google.maps.places.PlacesService(googleMap),
        animatedPolyline = new google.maps.Polyline({
            geodesic: true,
            strokeColor: '#2196F3',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            map: googleMap,
            zIndex: 200
        }),
        animatePath,
        animation;

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
    };

    $scope.isFirstLeg = function () {
        return directionsRenderer.getLegIndex() === 0;
    };

    $scope.isLastLeg = function () {
        return directionsRenderer.getLegIndex() === $scope.legs.length - 1;
    };

    $scope.prevLeg = function () {
        directionsRenderer.previousLeg();
    };

    $scope.nextLeg = function () {
        directionsRenderer.nextLeg();
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

    $scope.$on("$locationChangeStart", function (event) {
        directionsRenderer.setDirections(null);
        animatedPolyline.setMap(null);
        animatePath.stop();
        $scope.legs = [];
    });


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
                    $scope.legs = result.routes[0].legs;
                    animatePath = new AnimatePath({ route: result.routes, legIndex: 0, polyline: animatedPolyline, fps: 60, duration: 5 });
                    directionsRenderer.setDirections(result);
                    directionsRenderer.setLegIndex(0);

                });

            });
        }
    }

    google.maps.event.addListener(directionsRenderer, 'legindex_changed', function () {
        var i = this.getLegIndex();

        animatePath.setLegIndex(i);
        animatedPolyline.setPath([]);
        animatedPolyline.setMap(googleMap);
    });

    AnimatePath = function (args) {
        var path = [],
            polyline = args.polyline,
            duration = args.duration,
            fps = args.fps || 30,
            legs = args.route[0].legs,
            legIndex = args.legIndex || 0,
            steps, animation,
            loop = args.loop || false;

        function init() {
            var steps = legs[legIndex].steps,
                speed = 0,
                distance = 0,
                p0;
            path.length = 0;

            p0 = steps[0].start_location instanceof google.maps.LatLng ? steps[0].start_location : new google.maps.LatLng(steps[0].start_location);
            p0.distance = 0;
            path.push(p0);

            steps.forEach(function (step) {
                (step.geometry || step.lat_lngs).forEach(function (geometry) {
                    var p0 = path[path.length - 1],
                        p1 = geometry instanceof google.maps.LatLng ? geometry : new google.maps.LatLng(geometry);
                    if (!p0.equals(p1)) {
                        p1.distance = p0.distance + google.maps.geometry.spherical.computeDistanceBetween(p0, p1);
                        path.push(p1);
                    }
                });
            });

            clearInterval(animation);
            speed = path[path.length - 1].distance / duration;
            animation = setInterval(function () {
                if (loop && distance > path[path.length - 1].distance) {
                    distance = 0;
                }

                distance += speed / fps;
                polyline.setPath(getPath(distance));
            }, (1000 / fps));
        }


        function findIndex(distance) {
            if (distance <= 0) {
                return 0;
            }

            for (var i = 0; i < path.length; i++) {

                if (path[i].distance > distance) {
                    return i - 1;
                }
            }

            return path.length - 1;
        }

        function getPath(distance) {
            if (distance <= 0) {
                return [];
            } else if (distance >= path[path.length - 1].distance) {
                return path;
            } else {
                var i = findIndex(distance),
                    p0 = path[i],
                    p1 = path[i + 1],
                    heading = google.maps.geometry.spherical.computeHeading(p0, p1),
                    delta = distance - p0.distance,
                    p = google.maps.geometry.spherical.computeOffset(p0, delta, heading),
                    result = path.slice(0, i + 1);

                result.push(p);

                return result;
            }
        }

        this.setLegIndex = function (index) {
            if (legIndex != index) {
                index = index > 0 ? index : 0;
                index = index < legs.length ? index : legs.length - 1;

                legIndex = index;
                init();
            }
        };

        this.stop = function () {
            clearInterval(animation);
        };

        init();

    };

    function clearRoute() {
        directionsRenderer.setDirections(null);
        animatedPolyline.setMap(null);
        animatePath.stop();
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
