angular.module('MapsIndoors')

.controller('details', function ($scope, $location, $timeout, $routeParams, $route, $mdSidenav, locations, googleMap, mapsIndoors, directionsRenderer) {
    var _id = $routeParams.id;
    if (_id) {
        $mdSidenav('left').open();
        locations.getLocation(_id).then(function (location) {
            $timeout(function () {
                if (location) {
                    $scope.location = location;
                    mapsIndoors.setFloor(location.properties.floor);
                    googleMap.setCenter({ lat: location.geometry.coordinates[1], lng: location.geometry.coordinates[0] });
                    googleMap.setZoom(19);
                }
            }, 0);
        });
    }

    directionsRenderer.setDirections(null);

    $scope.back = function () {
        console.log($location);
        console.log($route);
        history.back();
    };

    $scope.getRoute = function () {
        console.log($scope.location);
        $location.path('/route/').search('destination', $scope.location.id);
    };
});