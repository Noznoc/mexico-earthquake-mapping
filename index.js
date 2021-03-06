var mobile = document.documentElement.clientWidth <= 700;

mapboxgl.accessToken = 'pk.eyJ1IjoianVsY29ueiIsImEiOiJjaWo1eHJqd2YwMDFkMXdtM3piZndjNzlxIn0.3fMbo8z3SxitKnkoNkZ2jw';
window.map = new mapboxgl.Map({
  container: "map", // container id
  style: "mapbox://styles/julconz/cj7m8ugs590wz2rmqit19y4ki", //stylesheet location mapbox://styles/julconz/cj7kpn3fd7n182rn3nf0mzurf mapbox://styles/lukasmartinelli/cj1rztb6o000g2st2zlb7mp7t
  center: [-95.990, 17.451], // starting position
  zoom: 7,
  maxZoom: 11,
  minZoom: 5,
  hash: true
});


var sidebar = document.getElementById('sidebar');
if (!mobile) {
  window.map.addControl(new mapboxgl.NavigationControl());
  sidebar.className += " pin-bottomleft";
} else {
  window.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
}

var playControl = document.getElementById('play-control');
var range = document.getElementById('range');
var time = document.getElementById('time');
var buildings = document.getElementById('buildings');

var startDate = new Date(2017, 8, 7);
var playback = false;

var dayStats = {};
var layer = 'mexico-building-shape';

var styleByDay = throttle(function (day) {
  var layers = ['mexico-building-glow', 'mexico-building-point', 'mexico-building-shape'];
  var filter = ["<=", "@day", day * 24];
  if (map.loaded()) {
    layers.forEach(function(layer) {
      map.setFilter(layer, filter);
    });
  }
}, 400);

var updateCounts = throttle(function(total, date) {
  //buildings.innerHTML = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  time.innerHTML = date.format('MMM D, YYYY');
}, 150);

function play(v) {
  range.value = v;
  var date = moment(startDate).add(range.value, 'days');
  var sum = 0;
  for(var d = 0; d <= v; d++) {
    sum += dayStats[d] || 0;
  }
  updateCounts(sum, date);
  styleByDay(v);

  range.max = 10; // change range.max for number of days to show in slider

  // If range hit's the end show play button again
  if (parseInt(range.value) >= parseInt(range.max)) {
    clearPlayback();
  }
}

playControl.addEventListener('click', setPlay);

loadBuildingStats(function(stats) {
  dayStats = stats;
  map.on('load', function() {
    // TODO: The query string parsing could be done nicer
    var minDay = isNaN(parseInt(getQueryVariable('minday'))) ? 160 : parseInt(getQueryVariable('minday'));
    var day = isNaN(parseInt(getQueryVariable('day'))) ? 160 : parseInt(getQueryVariable('day'));
    var speed = parseInt(getQueryVariable('speed')) || 130;
    range.min = minDay;

    styleByDay(day);
    playControl.addEventListener('click', setPlay);
    setTimeout(function() {
      range.value = day;
      setPlay(speed);
    }, 500);
  });
});

map.on('zoomend', function() {
  var zoom = map.getZoom();
  if(zoom <= 5) {
    setSpeed(50);
  }
});

// Add events.
range.addEventListener('input', function() {
  if (playback) clearPlayback();
  play(parseInt(range.value, 10));
});


/*function loadBuildingStats(callback) {
  var xmlhttp;
  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
      callback(JSON.parse(xmlhttp.responseText));
    }
  }
  xmlhttp.open("GET", "mexico_buildings_by_day.json", true);
  xmlhttp.send();
}*/

function clearPlayback() {
  window.clearInterval(playback);
  playControl.classList.remove('pause');
  playControl.classList.add('play');
  playback = false;
}

function setSpeed(speed) {
  console.log('Set speed', speed);
  clearPlayback();
  playback = window.setInterval(function() {
    var value = parseInt(range.value, 10);
    play(value + 1);
  }, speed);
}

function setPlay(speed) {
  if (parseInt(range.value) >= parseInt(range.max)) {
    range.value = parseInt(range.min);
  }

  speed = parseInt(speed) || 600; // change speed of visualization
  if (playback) return clearPlayback();
  playControl.classList.remove('play');
  playControl.classList.add('pause');
  playback = window.setInterval(function() {
    var value = parseInt(range.value, 10);
    play(value + 1);
  }, speed);
}

function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

function flyHandler(id, options) {
  var button = document.getElementById(id);
  if(!button) return;
  button.addEventListener('click', function() {
    map.flyTo({
      center: options.center,
      zoom: options.zoom || 5
    });
    if (options.startDay) {
      console.log('Play from day', options.startDay);
      play(options.startDay);
    }
    if (options.speed) {
      setSpeed(options.speed);
    }
  });
}

function getQueryVariable(variable) {
    console.log(window.location.search)
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}

