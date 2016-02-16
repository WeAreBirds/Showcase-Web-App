angular.module('MapsIndoors')

.controller('route', function ($scope, $location, $routeParams, locations, mapsIndoors, directionsRenderer) {
    var locId = $location.search().destination,
        directions = new mapsindoors.DirectionsService(),
        deffered = $.Deferred();

    getRoute = function (start) {
        if (start.code) {
            console.log(start);
        } else {
            var origin = { lat: start.coords.latitude, lng: start.coords.longitude, floor: mapsIndoors.getFloor() };
            if (locId) {
                locations.getLocation(locId).then(function (obj) {
                    var destLoc = { lat: obj.geometry.coordinates[1], lng: obj.geometry.coordinates[0], floor: obj.properties.floor };
                    directions.route({ origin: origin, destination: destLoc, travelMode: "DRIVING" }).then(function (result) {
                        $scope.$apply(function () {
                            $scope.destination = obj;
                            $scope.legs = result.routes[0].legs;
                            directionsRenderer.setDirections(result);
                            directionsRenderer.setLegIndex(0);
                            deffered.resolve();
                        });

                    });
                });
            }
        }
    };

    $scope.legs = [];

    $scope.ready = function () {
        return deffered.promise();
    };

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
        history.back();
    };

    if ($routeParams.from && $routeParams.to) {
        var from = $routeParams.from,
            to = $routeParams.to;

        locations.getLocation(from).then(function (from) {
            if (location) {
                locations.getLocation(to).then(function (to) {
                    if (from) {
                        var origin = {
                            lat: from.geometry.coordinates[1],
                            lng: from.geometry.coordinates[0],
                            floor: from.properties.floor
                        }, destination = {
                            lat: to.geometry.coordinates[1],
                            lng: to.geometry.coordinates[0],
                            floor: to.properties.floor
                        };

                        directions.route({
                            origin: origin,
                            destination: destination,
                            travelMode: "WALKING"
                        }).then(function (result) {
                            $scope.$apply(function () {
                                $scope.destination = to,
                                $scope.legs = result.routes[0].legs,
                                directionsRenderer.setDirections(result),
                                directionsRenderer.setLegIndex(0),
                                deffered.resolve();
                            });
                        });
                    }
                });

            } else {
                window.navigator.geolocation.getCurrentPosition(getRoute, getRoute);
            }
        })
    }

})

.directive('routeLeg', function (locations, directionsRenderer, mapsIndoors) {
    var _cache = {
        types: {}
    };
    function getType(type) {
        if (_cache.types) {
            return _cache.types[type];
        }
    }

    locations.getTypes().then(function (types) {
        types.sort(function (a, b) {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        }).forEach(function (type) {
            _cache.types[type.name] = type;
        });
    });

    var colors = {
        primary: 'rgb(33,150,243)',
        accent: 'rgb(255,82,82)'
    };

    function Draw(context, legs) {
        var ctx = context,
            icons = {
                base: function (ctx, cx, cy) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, cy, 13, 0, 2 * Math.PI, false);
                    ctx.shadowBlur = 2;
                    ctx.shadowColor = '#a9a9a9';
                    ctx.shadowOffsetX = 0.5;
                    ctx.shadowOffsetY = 0.5;
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.restore();
                },
                elevator: function (ctx, cx, cy) {
                    this.base(ctx, cx, cy);
                    var icon = new Image();

                    icon.onload = function () {
                        ctx.save();
                        ctx.translate(cx - 9, cy - 9);
                        ctx.drawImage(icon, 0, 0, 24, 24, 0, 0, 18, 18);
                        ctx.restore();
                    };
                    icon.src = 'https://materialdesignicons.com/api/download/icon/svg/8A9045D4-D6AC-4660-8C55-D622156A1B8C';
                },
                venue: function (ctx, cx, cy) {
                    this.base(ctx, cx, cy);
                    ctx.save();
                    ctx.fillStyle = colors.primary;
                    ctx.font = '18px "Material Icons"';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = "middle";
                    ctx.fillText(String.fromCharCode('0xE0AF'), cx, cy);
                    ctx.restore();
                },
                stairs: function (ctx, cx, cy) {
                    this.base(ctx, cx, cy);
                    var icon = new Image();

                    icon.onload = function () {
                        ctx.save();
                        ctx.translate(cx - 6, cy - 6);
                        ctx.drawImage(icon, 0, 80, 360, 285, 0, 0, 12, 12);
                        ctx.restore();
                    };
                    icon.src = 'http://www.clipartsfree.net/svg/15761-aiga-stairs-download.svg';
                },
                start: function (ctx, cx, cy) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx, cy, 10.5, 0, 2 * Math.PI, false);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = colors.primary;
                    ctx.stroke();

                    //ctx.save();
                    //ctx.beginPath();
                    //ctx.arc(cx, cy, 12.5, 0, 2 * Math.PI, false);
                    //ctx.fillStyle = '#fff';
                    //ctx.fill();
                    //ctx.lineWidth = 3;
                    //ctx.strokeStyle = 'rgba(233,30,99, 0.2)';
                    //ctx.stroke();

                    //ctx.beginPath();
                    //ctx.arc(cx, cy, 7, 0, 2 * Math.PI, false);
                    //ctx.fillStyle = colors.primary;
                    //ctx.fill();
                    ctx.restore();
                },
                image: function (ctx, cx, cy, url) {
                    var icon = new Image();
                    //this.base(ctx, cx, cy);
                    icon.onload = function () {
                        var height = this.width > 33 ? (this.height / this.width * 33) : this.height;
                        var width = this.width > 33 ? 33 : this.width;
                        ctx.save();
                        ctx.drawImage(icon, 0, 0, this.width, this.height, cx - (width / 2), cy - (height / 2), width, height);
                        ctx.restore();
                    };
                    icon.src = url;
                }

            };

        return {
            icon: function (icon, cx, cy) {
                var args = [].slice.call(arguments);
                args[0] = ctx;
                icons[icon].apply(icons, args);
            },
            start: function (i, cx, cy) {
                if (i === 0) {
                    this.icon('start', cx, cy);
                } else if (legs[i - 1]._mi.type === 'google.maps.DirectionsLeg') {
                    this.icon('venue', cx, cy);
                } else {
                    switch (legs[i].steps[0].highway) {
                        case 'steps':
                            this.icon('stairs', cx, cy);
                            break;
                        case 'elevator':
                            this.icon('elevator', cx, cy);
                            break;
                        default:
                            break;

                    }
                }
            },
            end: function (i, cx, cy) {
                if (legs[i]._mi.type === 'google.maps.DirectionsLeg') {
                    this.icon('venue', cx, cy);
                } else {
                    switch (legs[i + 1].steps[0].highway) {
                        case 'steps':
                            this.icon('stairs', cx, cy);
                            break;
                        case 'elevator':
                            this.icon('elevator', cx, cy);
                            break;
                        default:
                            break;

                    }
                }
            },
        };
    }

    var stroke = (function () {
        var canvas = document.createElement('canvas');
        canvas.height = '12';
        canvas.width = '1';

        var ctx = canvas.getContext('2d');
        ctx.moveTo(0, 4);
        ctx.lineTo(0, 9);
        ctx.strokeStyle = colors.primary;
        ctx.stroke();

        return ctx.createPattern(canvas, 'repeat');
    })();

    function Labels(element, legs) {
        var el = element;

        return {
            start: function (i) {
                switch (legs[i].steps[0].highway) {
                    case 'steps':
                        return 'Stairs level ' + legs[i].end_location.zLevel;
                    case 'elevator':
                        return 'Elevator level ' + legs[i].end_location.zLevel;
                    default:
                        return '';
                }
            },
            end: function (i) {
                switch (legs[i + 1].steps[0].highway) {
                    case 'steps':
                        return 'Stairs level ' + legs[i].end_location.zLevel;
                    case 'elevator':
                        return 'Elevator level ' + legs[i].end_location.zLevel;
                    default:
                        return '';
                }
            }
        };
    }

    var endMarker = new google.maps.Marker();

    google.maps.event.addListener(endMarker, 'click', function () {
        directionsRenderer.nextLeg();
    });

    google.maps.event.addListener(directionsRenderer, 'legindex_changed', function () {
        var i = this.getLegIndex(),
            legs = this.getDirections().routes[0].legs;

        if (i < legs.length - 1 && (legs[i].end_location.zLevel !== undefined && legs[i].end_location.zLevel !== legs[i + 1].end_location.zLevel)) {
            var type = legs[i + 1].steps[0].highway,
                icon = document.createElement('canvas'),
                ctx = icon.getContext('2d'),
                start = legs[i + 1].start_location,
                end = legs[i + 1].end_location;

            icon.height = 32;
            icon.width = 128;

            ctx.save();

            ctx.beginPath();
            ctx.fillStyle = colors.accent;
            ctx.arc(72, 16, 9.5, 0, 2 * Math.PI, false);
            ctx.rect(16, 6.5, 56, 19);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(16, 16, 11.5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = colors.primary;
            ctx.stroke();
            ctx.save();
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.font = '12px Roboto';
            ctx.fillText(start.zLevel + ' → ' + end.zLevel, 36, 16);


            var imgData = icon.toDataURL('image/png');

            endMarker.setOptions({
                icon: { url: imgData, anchor: new google.maps.Point(16, 16) },
                position: { lat: start.lat, lng: start.lng },
                map: this.getMap(),
                floor: start.zLevel,
                visible: true
            });
        } else {
            endMarker.setOptions({
                visible: false
            });
        }
    });

    function link(scope, element, locations) {
        var i = scope.$index,
            legs = scope.legs,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            draw = new Draw(ctx, legs),
            labels = new Labels(element, legs),
            img = getType(scope.destination.properties.type).icon,
            x = 14;

        if (scope.getLeg() === i) {
            element.focus();
        }



        canvas.style.position = 'fixed';
        canvas.width = '284';
        canvas.height = '144';
        ctx.lineWidth = 2;

        element.append(canvas);

        if (legs.length === 1) {
            ctx.beginPath();
            ctx.moveTo(x, 36);
            ctx.lineTo(x, 120);
            ctx.strokeStyle = colors.primary;
            ctx.stroke();

            draw.start(i, x, 24);
            draw.icon('image', x, 120, img);

            element.append($('<label>Start</label>'));
            element.append($('<label>' + scope.destination.properties.name + '</label>'));
        }
        else if (i > 0 && i < legs.length - 1) {
            ctx.moveTo(x, 36);
            ctx.lineTo(x, 120);
            ctx.strokeStyle = colors.primary;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 36);
            ctx.moveTo(x, 120);
            ctx.lineTo(x, 144);
            ctx.strokeStyle = stroke;
            ctx.stroke();

            draw.start(i, x, 24);
            draw.end(i, x, 120);

            (function () {
                var index = i;
                var type = legs[i + 1].steps[0].highway,
                icon = document.createElement('canvas'),
                ctx = icon.getContext('2d'),
                start = legs[i + 1].start_location,
                end = legs[i + 1].end_location;

                icon.height = 32;
                icon.width = 128;

                ctx.save();

                ctx.beginPath();
                ctx.fillStyle = colors.accent;
                ctx.arc(72, 16, 9.5, 0, 2 * Math.PI, false);
                ctx.rect(16, 6.5, 56, 19);
                ctx.fill();
                ctx.beginPath();
                ctx.fillStyle = '#fff';
                ctx.arc(16, 16, 11.5, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = colors.primary;
                ctx.stroke();
                ctx.save();
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#000';
                ctx.font = '12px Roboto';
                ctx.fillText(start.zLevel + ' → ' + end.zLevel, 36, 16);


                var imgData = icon.toDataURL('image/png');

                var marker = new google.maps.Marker({
                    icon: { url: imgData, anchor: new google.maps.Point(16, 16) },
                    position: { lat: start.lat, lng: start.lng },
                    map: directionsRenderer.getMap(),
                    floor: start.zLevel,
                    visible: false
                });



            })();


            element.append($('<label>' + labels.start(i) + '</label>'));
            element.append($('<label>' + labels.end(i) + '</label>'));

            console.log(labels.end(i));
        } else if (i === 0) {
            ctx.beginPath();
            ctx.moveTo(x, 36);
            ctx.lineTo(x, 120);
            ctx.strokeStyle = colors.primary;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, 120);
            ctx.lineTo(x, 144);
            ctx.strokeStyle = stroke;
            ctx.stroke();

            draw.start(i, x, 24);
            draw.end(i, x, 120);

            element.append($('<label>Start</label>'));
            element.append($('<label>' + labels.end(i) + '</label>'));
        } else if (i === legs.length - 1) {
            ctx.moveTo(x, 29);
            ctx.lineTo(x, 0);
            ctx.strokeStyle = stroke;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, 36);
            ctx.lineTo(x, 120);
            ctx.strokeStyle = colors.primary;
            ctx.stroke();

            draw.start(i, x, 24);
            draw.icon('image', x, 120, img);
            element.append($('<label>' + labels.start(i) + '</label>'));
            element.append($('<label>' + scope.destination.properties.name + '</label>'));
        }

    }

    return {
        restrict: 'E',
        scope: true,
        link: link
    };
});