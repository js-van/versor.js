var parse = C2parser.parse;

var points = [];
var objectFunctions = [];

objects = {};

var addPoint = function () {
  points.push(C2.Ro.point(0.5, 0.5));
  rerender();
}

document.getElementById('new-point').addEventListener('click', addPoint, false);

var canvas = document.getElementById("c");
var canvasTop = canvas.offsetTop;
var canvasLeft = canvas.offsetLeft;
var draw = C2Canvas(canvas)
  .bounds({
    x: [-10, 10],
    y: [-5, 5]
  });

var rerender = function () {
  draw(points);
};

var closestPointToEvt = function (evt) {

  var x = draw.inversemapx(evt.pageX - canvasLeft);
  var y = draw.inversemapy(evt.pageY - canvasTop);

  var dst;
  var closestIndex;
  var closestPoint;
  var closestDistance = Infinity;
  for (var i = 0; i < points.length; i++) {
    dst = draw.scale(C2.Ro.dst(points[i], C2.Ro.point(x, y)));
    if (dst < closestDistance) {
      closestIndex = i;
      closestPoint = points[i];
      closestDistance = dst;
    }
  }

  return {
    index: closestIndex,
    point: closestPoint,
    distance: closestDistance
  }
}

;(function () {
  var dragIndex;
  var dragging = false;
  var startDrag = function (evt) {
    var closest = closestPointToEvt(evt);

    if (closest.distance < 20) {
      dragIndex = closest.index;
      dragging = true;
    }
  };
  var updateDrag = function (evt) {
    if (!dragging) return;

    var x = draw.inversemapx(evt.pageX - canvasLeft);
    var y = draw.inversemapy(evt.pageY - canvasTop);

    points[dragIndex] = C2.Ro.point(x, y);
    rerender();
  };
  var finishDrag = function (evt) {
    dragging = false;
    dragIndex = undefined;
  };

  canvas.addEventListener('mousedown', startDrag, false);
  canvas.addEventListener('mousemove', updateDrag, false);
  document.addEventListener('mouseup', finishDrag, false);
})();

;(function () {
  var p1index, p2index;

  var startWedge = function (evt) {
    p1index = closestPointToEvt(evt).index;
    canvas.addEventListener('click', finishWedge, false);
    canvas.removeEventListener('click', startWedge);
  }

  var finishWedge = function (evt) {
    p2index = closestPointToEvt(evt).index;
    canvas.removeEventListener('click', finishWedge);

    // Outer function is to make a function with the current values of p1index
    // and p2index that won't change when these values get updated.
    objectFunctions.push((function (p1index, p2index) {
      return function (points) {
        return points[p1index].op(points[p2index]);
      }
    })(p1index, p2index));

    rerender();
  }

  document.getElementById('wedge').addEventListener('click', function () {
    canvas.addEventListener('click', startWedge, false);
  }, false);
})();


var assignmentLine = /([a-zA-Z])\s*=\s*(.*)/
function inputChanged (evt) {
  objects = {};

  var text = input.value;
  var lines = text.split('\n');
  
  var assignmentMatch;
  var wedgeMatch;
  var id;
  for (var i = 0; i < lines.length; i++) {
    assignmentMatch = lines[i].match(assignmentLine);

    if (assignmentMatch) {
      id = assignmentMatch[1];
      fn = new Function('env', 'return ' + parse(assignmentMatch[2]));
      objects[id] = fn(objects);
    }
    
  }

  objectsToPoints();
  rerender();

}

function objectsToPoints () {
  points = []
  for (var id in objects) {
    if (!objects.hasOwnProperty(id)) continue;
    points.push(objects[id]);
  }
}

var input = document.getElementById('input');
input.addEventListener('change', inputChanged, false);
input.addEventListener('keyup', inputChanged, false);

inputChanged();