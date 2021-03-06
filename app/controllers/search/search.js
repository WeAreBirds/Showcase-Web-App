angular.module('MapsIndoors')

.controller('search', function ($scope, $location, $routeParams, $mdSidenav, search, locations, googleMap, mapsIndoors, state) {
    $scope.types = [];
    $scope.categories = {};
    $scope.query = search.latestQuery || { take: 50 };
    $scope.result = search.latestSearchResult || [];
    $scope.loading = false;
    var delay = 200;
    var timer = null;

    function setTypes(data) {
        data.sort(function (a, b) {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        }).forEach(function (type) {
            $scope.types[type.name] = type;
        });
    }

    $scope.clear = function () {
        if ($scope.query.q !== undefined && $scope.query.q.length > 0) {
            $scope.query.q = '';
        } else {
            $location.path('/' + $routeParams.venue + '/search/');
        }
        mapsIndoors.clear();
    };

    $scope.getLocations = function () {
        $scope.loading = true;
        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(function () {
            state.getVenue().then(function (venue) {
                $scope.query.venue = venue.name;
                locations.getLocations($scope.query).then(function (data) {
                    var bounds = new google.maps.LatLngBounds();
                    data.forEach(function (item) {
                        bounds.extend(new google.maps.LatLng(item.geometry.coordinates[1], item.geometry.coordinates[0]));
                    });
                    //googleMap.fitBounds(bounds);

                    $scope.result = data;
                    $scope.loading = false;
                    $scope.$apply();
                });
            });
        }, delay);

        var locateQuery = angular.copy($scope.query);
        delete locateQuery.take;
        if (locateQuery.q || locateQuery.types) {
            state.getVenue().then(function (venue) {
                mapsIndoors.locate({ locations: locateQuery, venue: venue.name, suppressOthers: true });
            });
        }
        else {
            mapsIndoors.clear();
        }
    };

    $scope.getIcon = function (item) {
        var icon = null;
        icon = item.icon || $scope.types[item.properties.type].icon;
        return icon;
    };


    $scope.query.types = $routeParams.type;

    if ($routeParams.type) {
        $scope.getLocations();
        $mdSidenav('left').open();
    } else {
        locations.getCategories().then(function (data) {
            $scope.categories = data;
            $scope.$apply();
        });

    }

    locations.getTypes().then(setTypes);

    $scope.keyUp = function (e) {

    };

    $scope.items = function () {
        if ($scope.query.q || $scope.query.types) {
            return $scope.result;
        } else {
            return Object.keys($scope.types).map(function (key) {
                return $scope.types[key];
            });
        }
    };

    $scope.select = function (item) {
        mapsIndoors.clear();
        item = Object(item);
        if (item.hasOwnProperty('properties')) {
            $location.path($routeParams.venue + '/details/' + item.id);
        } else {
            $location.path($routeParams.venue + '/search/' + item.name);
        }
    };
})

.service('search', function () {

});

