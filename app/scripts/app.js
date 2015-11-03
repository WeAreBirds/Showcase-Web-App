angular.module('MapsIndoors', [
    'ngMaterial',
    'ngRoute'
])

.config(function ($routeProvider, $locationProvider, $mdThemingProvider) {
    $mdThemingProvider.theme('default')
          .primaryPalette('blue')
          .accentPalette('red');

    $routeProvider
      .when('/', {
          templateUrl: 'controllers/search/search.tpl.html',
          controller: 'search'
      })
      .when('/search/:type', {
          templateUrl: 'controllers/search/search.tpl.html',
          controller: 'search'
      })
      .when('/details/:id', {
          templateUrl: 'controllers/details/details.tpl.html',
          controller: 'details'
      })
       .when('/route/', {
           templateUrl: 'controllers/route/route.tpl.html',
           controller: 'route'
       })
      .otherwise({
          redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
})

.run(function run($rootScope, $route) {
})

.controller('main', ['$scope', '$mdSidenav','mapsIndoors', function ($scope, $mdSidenav, mapsIndoors) {
    $scope.toggle = function (mdId) {
        $mdSidenav(mdId).toggle();
    };

    $scope.title = "MapsIndoors";
    $scope.showSidenav = true;

}]);
