function Band(connectionPoints) {
  this.points = connectionPoints;
  this.faces = [];
  this.groups = [];
  this.sort();
}

Band.prototype.warpAround = function (pt, warps) {
  var p = this.points;
  var len = p.length;
  for (var i = 0; i < len; i++) {
    var pi = p[i];
    for (var j = 0; j < 3; j++) {
      pi.data[j] += pt.data[j];
      pi.data[j] *= warps[j];
      pi.data[j] -= pt.data[j];
    }
  }
  return this;
};

Band.prototype.transform = function (pt) {
  var p = this.points;
  var len = p.length;
  for (var i = 0; i < len; i++) {
    var pi = p[i];
    for (var j = 0; j < 3; j++) {
      pi.data[j] += pt.data[j];
    }
  }
  return this;
};

Band.prototype.makeUnitSize = function () {
  var sts = this.getCenterStats();
  var o = new Point(0, 0, 0, GROUP_END);
  for (var j = 0; j < 3; j++) {
    o.data[j] = -sts.high[j]+(sts.high[j]-sts.low[j])/2;
  }
  console.log(sts);
  this.transform(o);
  var p = this.points;
  var len = p.length;
  var max = 0;
  for (var i = 0; i < len; i++) {
    var pi = p[i];
    var length = 0;
    for (var j = 0; j < 3; j++) {
      var k = pi.data[j];
      length += k * k;
    }
    console.log("len:" + length);

    length = Math.sqrt(length);
    if (length > max) {
      max = length;
    }
  }
  console.log("max:" + max);
  max = 1 / max;
  console.log("max:" + max);
  o = new Point(0, 0, 0);
  this.warpAround(o, [max, max, max]);
  return this;
};

Band.prototype.sort = function () {
  sortPtsOnAngles(this.points);
};

Band.prototype.getPoints = function (scale, z) {
  var zp = 1;
  var p = this.points;
  var len = p.length;
  var pts = new Array(len);
  for (var i = 0; i < len; i++) {
    pts[i] = p[i].copy();
    for (var j = 0; j < 3; j++) {
      if (j % 3 != zp) {
        pts[i].data[j] *= scale;
      } else {
        pts[i].data[j] = z;
      }
    }
  }
  return pts;
};

Band.prototype.getCenter = function (scale, z) {
  var p = this.points;
  var len = p.length;
  var pt = new Point(0, 0, 0, GROUP_END);
  for (var i = 0; i < len; i++) {
    var pi = p[i];
    for (var j = 0; j < 3; j++) {
      pt.data[j] += pi.data[j];
    }
  }
  for (var j = 0; j < 3; j++) {
    pt.data[j] /= len;
  }
  return pt;
};

Band.prototype.getCenterStats = function () {
  var p = this.points;
  var len = p.length;
  var low = [0,0,0];
  var high = [0,0,0];
  
  for (var i = 0; i < len; i++) {
    var pi = p[i];
    for (var j = 0; j < 3; j++) {
      if(pi.data[j] > high[j]){
        high[j] = pi.data[j];
      }else if(pi.data[j] < low[j]){
        low[j] = pi.data[j];
      }
    }
  }
  
  return {high: high, low: low};
};

function sortPtsOnAngles(p, heuristic) {

  var zp = 1,
    xp = 0,
    yp = 2;
  var len = p.length;
  if (!heuristic)
    heuristic = len;
  var o = new Point(0, 0, 0);
  var PI2 = Math.PI * 2;
  var lastAng = undefined;
  var lessThan = undefined;
  for (var i = 0; i < len; i++) {
    var thisAng = (o.angleTo(p[i], xp, yp) + PI2) % PI2;
    if (lastAng == undefined) {
      lastAng = thisAng;
    } else {
      if (thisAng < lastAng) {
        lessThan = i;
        break;
      }
      lastAng = thisAng;
    }
    if (i > heuristic)
      break;
  }
  if (lessThan === undefined) {
    return p;
  }
  var buf = new Array(lessThan);
  var i = 0;
  for (i = 0; i < lessThan; i++) {
    buf[i] = p[i];
  }
  var a = 0;
  for (a = 0; i < len; i++, a++) {
    p[a] = p[i];
  }
  for (i = 0; i < lessThan; i++, a++) {
    p[a] = buf[i];
  }
  return p;
}

Band.prototype.getAngles = function () {
  var zp = 1,
    xp = 0,
    yp = 2;
  var p = this.points;
  var len = p.length;
  var angs = new Array(len);
  var o = new Point(0, 0, 0);
  var PI2 = Math.PI * 2;
  for (var i = 0; i < len; i++) {
    angs[i] = (o.angleTo(p[i], xp, yp) + PI2) % PI2;
  }
  return angs;
};

Band.prototype.getPointMultiple = function (m) {
  var n = m - 1; // we already have one point out of every m;
  var zp = 1;
  var p = this.points;
  var len = p.length;
  var pts = new Array(len * m);
  var a = 0;
  var s, e, v;
  if (len == 1) {
    p = p[0];
    for (var i = 0; i < len * m; i++) {
      pts[i] = p.copy();
    }
    return pts;
  }
  for (var i = 0; i < len; i++) {
    s = pts[a++] = p[i];
    e = p[(i + 1) % len];
    v = new UnitVec(s, e);
    for (var j = 0; j < n; j++) {
      pts[a++] = v.transform(s, v.length * (j + 1) / (n + 1));
    }
  }
  return pts;
};

Band.prototype.connectTo = function (band, isSafe) {
  if (isSafe)
    return this.connectToSafe(band);

  var n = this.points.length;
  var m = band.points.length;
  if (m == n)
    return this.connectToSafe(band);

  var g = gcd(m, n);
  var mg = m / g;
  var ng = n / g;
  var p1 = sortPtsOnAngles(this.getPointMultiple(mg), mg);
  var p2 = sortPtsOnAngles(band.getPointMultiple(ng), ng);
  var len = p1.length;
  var arraylen = len;
  if (m != 1 && n != 1) {
    arraylen *= 2;
  }
  var array = new AddingArray(arraylen);
  for (var i = 0; i < len; i++) {
    x = (i + 1) % len;
    if (n != 1) {
      var face = new Face([p1[i], p2[i], p1[x]], [1.0, 0.0, 0.0, 1.0]);
      array.add(face);
      var group = face.joinGroup();
      if (group)
        this.groups.push(group);
    }
    if (m != 1) {
      var face = new Face([p2[i], p2[x], p1[x]], [0.0, 1.0, 0.0, 1.0]);
      array.add(face);
      var group = face.joinGroup();
      if (group)
        this.groups.push(group);
    }
  }
  if (this.faces.length == 0)
    this.faces = array.data;
  else
    this.faces = this.faces.concat(array.data);
  array = null;
};

Band.prototype.connectToSafe = function (band) {
  var n;
  var p = this.points;
  var o = band.points;
  var len = p.length;
  var array = new AddingArray(len * 2);
  for (var i = 0; i < len; i++) {
    n = (i + 1) % len;
    var f1 = new Face([p[i], o[i], p[n]], [1.0, 0.0, 0.0, 1.0]);
    var f2 = new Face([o[i], o[n], p[n]], [0.0, 1.0, 0.0, 1.0]);
    array.add(f1);
    array.add(f2);
    var g = f1.joinGroup();
    if (g)
      this.groups.push(g);
    g = f2.joinGroup();
    if (g)
      this.groups.push(g);
  }
  if (this.faces.length == 0)
    this.faces = array.data;
  else
    this.faces = this.faces.concat(array.data);
  array = null;
};

Band.prototype.connectToPoint = function (pt) {
  var n;
  var p = this.points;
  var len = p.length;
  for (var i = 0; i < len; i++) {
    n = (i + 1) % len;
    this.faces.push(new Face([p[i], p[n], pt], [0.0, 0.0, 1.0, 1.0]));
  }
};


Band.prototype.toArray = function () {
  var arry = [];
  var f = this.faces;
  var len = f.length;

  for (var i = 0; i < len; i++) {
    arry = arry.concat(f[i].toArray());
  }
  return arry;
};

Band.prototype.toColorArray = function () {
  var arry = [];
  var f = this.faces;
  var len = f.length;

  for (var i = 0; i < len; i++) {
    arry = arry.concat(f[i].toColorArray());
  }
  return arry;
};

function AddingArray(size) {
  this.size = size;
  this.index = 0;
  this.data = new Array(size);
}

AddingArray.prototype.add = function (e) {
  this.data[this.index++] = e;
};

AddingArray.prototype.addArray = function (e) {
  var len = e.length;
  for (var j = 0; j < len; j++) {
    this.data[this.index++] = e[j];
  }
};

function Group(type) {
  this.type = type;
  this.faces = [];
  this.shouldMerge = true;
  this.dead = false;
}

Group.prototype.getCount = function () {
  return this.faces.length * 3;
};

Group.prototype.toArray = function (addingArray) {
  var f = this.faces;
  var len = f.length;

  for (var i = 0; i < len; i++) {
    f[i].toArray(addingArray);
  }
};

Group.prototype.toColorArray = function (addingArray) {
  var f = this.faces;
  var len = f.length;
  for (var i = 0; i < len; i++) {
    f[i].toColorArray(addingArray);
  }
};


Group.prototype.toNormalArray = function (addingArray) {
  var f = this.faces;
  var len = f.length;
  var normals = [];
  for (var i = 0; i < len; i++) {
    f[i].wipePointNormals();
  }
  for (var i = 0; i < len; i++) {
    f[i].addNormals();
  }
  for (var i = 0; i < len; i++) {
    f[i].normalizePoints();
  }
  for (var i = 0; i < len; i++) {
    var fi = f[i];
    fi.getNormals();
    fi.toNormalArray(addingArray);
  }
  return normals;
};

Group.prototype.recolor = function (color) {
  for (var i = 0; i < this.faces.length; i++) {
    this.faces[i].color = color;
  }
};

Group.prototype.mergeWith = function (groupOther) {
  if (this != groupOther && !groupOther.dead && this.shouldMerge && groupOther.shouldMerge) {
    for (var i = 0; i < this.faces.length; i++) {
      this.faces[i].group = groupOther;
    }
    groupOther.faces = groupOther.faces.concat(this.faces);
    this.dead = true;
    this.faces = null;
    this.type = -1;
  }
};

Group.prototype.addFace = function (face) {
  this.faces.push(face);
  face.group = this;
};

function Face(points, color) {
  this.points = points;
  this.color = color;
  this.normals = new Array(3);
  this.group = null;
  var group = 0;
  for (var i = 0; i < points.length; i++) {
    points[i].faces.push(this);
    if (points[i].group > group) {
      group = points[i].group;
    }
  }
  this.group_type = group;
  this.connections = [];
}

Face.prototype.wipePointNormals = function () {
  var p = this.points;
  var len = p.length;
  for (var i = 0; i < len; i++) {
    p[i].setNormal([0, 0, 0]);
  }
};

Face.prototype.addNormals = function () {
  var p = this.points;
  var len = p.length;
  var u = vec3.create(),
    v = vec3.create();
  vec3.subtract(p[0].data, p[2].data, u);
  vec3.subtract(p[1].data, p[0].data, v);
  vec3.cross(u, v);
  for (var i = 0; i < len; i++) {
    p[i].addNormal(u);
  }
};

Face.prototype.normalizePoints = function () {
  var p = this.points;
  var len = p.length;
  for (var i = 0; i < len; i++) {
    p[i].normalize();
  }
};

Face.prototype.getNormals = function () {
  var p = this.points,
    n = this.normals;
  var len = p.length;
  for (var i = 0; i < len; i++) {
    n[i] = p[i].normal;
  }
};


Face.prototype.toNormalArray = function (addingArray) {
  var p = this.normals;
  var len = p.length;
  for (var i = 0; i < len; i++) {
    addingArray.addArray(p[i]);
  }
};

Face.prototype.sharesPoints = function (face) {
  var matches = 0,
    p = this.points,
    q = face.points;
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (p[i].equals(q[j])) {
        p[i] = q[j];
        matches++;
        if (matches >= 2)
          break;
      }
    }
  }
  return matches >= 2;
};

Face.prototype.joinGroup = function () {
  var p = this.points;
  var len = p.length;
  var matches = [];
  for (var i = 0; i < len; i++) {
    var group = p[i].getGroups(this.group_type, this);
    matches = matches.concat(group);
  }

  if (matches.length == 0) {
    this.group = new Group(this.group_type);
    this.group.addFace(this);
    return this.group;
  }
  matches[0].addFace(this);

  for (var i = 0; i < matches.length - 1; i++) {
    matches[i].mergeWith(matches[i + 1]);
    matches[i] = null;
  }
  this.group.addFace(this);
  return null;
};

Face.prototype.setGroup = function (group) {
  this.group = group;
};

Face.prototype.toArray = function (addingArray) {
  var f = this.points;
  var len = f.length;
  for (var i = 0; i < len; i++) {
    addingArray.addArray(f[i].data);
  }
};

Face.prototype.toColorArray = function (addingArray) {
  for (var i = 0; i < 3; i++) {
    addingArray.addArray(this.color);
  }
};

Face.prototype.pointsOf = function (group) {
  var points = [];
  for (var i = 0; i < this.points.length; i++) {
    points.push(this.points[i].data);
  }
  return points;
};

function roundPt(x) {
  return Math.round(x * 1000) / 1000;
}

function Point(x, y, z, group) {
  this.data = [roundPt(x), roundPt(y), roundPt(z)];
  this.group = group;
  this.faces = [];
  this.normal = null;
  this.normalized = false;
}

Point.prototype.setNormal = function (vec) {
  this.normal = vec;
  this.normalized = false;
};

Point.prototype.addNormal = function (vec) {
  vec3.add(this.normal, vec);
  this.normalized = false;
};

Point.prototype.normalize = function () {
  if (!this.normalized) {
    this.normalized = true;
    vec3.normalize(this.normal);
  }
};

Point.prototype.getGroups = function (group_type, face) {
  var f = this.faces;
  var len = f.length;
  var groups = [];
  for (var i = 0; i < len; i++) {
    var fi = f[i];
    if (face == f[i])
      continue;
    if (fi.group && fi.group_type == group_type && !fi.group.dead && fi.sharesPoints(face)) {
      groups.push(fi.group);
    }
  }
  return groups;
};

Point.prototype.equals = function (point) {
  for (var i = 0; i < this.data.length; i++) {
    if (this.data[i] != point.data[i]) {
      return false;
    }
  }
  return true;
};

Point.prototype.copy = function (group) {
  var d = this.data;
  return new Point(d[0], d[1], d[2], group || this.group);
};

Point.prototype.angleTo = function (p, x, y) {
  var d = this.data;
  var p = p.data;
  return Math.atan2(p[y] - d[y], p[x] - d[x]);
};

Point.prototype.memberOf = function (group) {
  return group == this.group;
};

function nGonBand(n, r, z, m) {

  var points = new Array(n);
  for (var i = 0; i < n; i++) {
    var ang = i / n * Math.PI * 2;
    if (m) {
      ang += 1 / (n * 2) * Math.PI * 2;
    }
    var x = r * Math.cos(ang);
    var y = r * Math.sin(ang);
    points[i] = new Point(x, z, y, GROUP_FACE);
  }
  return points
}

function RoundedNGon(n, m) {
  this.points = nGonBand(n, 1, 0, m);
  this.cornerRadius = 0.3;
  this.cornerN = 4;
  this.n = n;
}

var GROUP_FACE = 1,
  GROUP_CORNER = 2,
  GROUP_END = 3;

RoundedNGon.prototype.getPoints = function (scale, z) {
  var xp = 0,
    yp = 2;
  var zp = 1;
  var p = this.points;
  var len = p.length;
  var pts = new Array(len + this.cornerN * this.n);
  var a = 0;
  var cr = this.cornerRadius;
  var cn = this.cornerN;
  if (cr == 0) {
    for (var i = 0; i < this.n; i++) {
      pts[i] = p[i].copy();
      pts[i].data[zp] = z;
      for (var j = 0; j < 3; j++) {
        if (j % 3 != zp) {
          pts[i].data[j] *= scale;
        }
      }
    }
  } else {
    var a = 0;
    var origin = new Point(0, 0, 0);
    var sideB = cr / Math.sin(Math.PI / 2 - Math.PI / this.n);
    var sideA = Math.sin(Math.PI / this.n) * sideB;

    for (var i = 0; i < this.n; i++) {

      var pi = p[i];
      var m = (i + 1) % len;
      var n = ((i - 1) % len + len) % len;
      var v1 = new UnitVec(pi, p[n]);
      var v2 = new UnitVec(pi, p[m]);
      var v3 = new UnitVec(pi, origin);
      var l = v1.transform(pi, sideA, GROUP_FACE);
      var r = v2.transform(pi, sideA, GROUP_FACE);
      var o = v3.transform(pi, sideB);
      var la = o.angleTo(l, xp, yp);
      var ra = (o.angleTo(r, xp, yp) - la + Math.PI * 2) % (Math.PI * 2);
      var pos = 0;

      pts[a] = l;
      pts[a].data[zp] = z;
      for (var j = 0; j < 3; j++) {
        if (j % 3 != zp) {
          pts[a].data[j] *= scale;
        }
      }
      a++;
      for (var k = 0; k < cn; k++) {
        pts[a] = new Point(0, 0, 0, GROUP_CORNER);
        var d = pts[a].data;
        for (var j = 0; j < 3; j++) {
          switch (j) {
          case xp:
            d[j] = (o.data[xp] + Math.cos(la + ra * (k + 1) / (cn + 1)) * cr) * scale;
            break;
          case yp:
            d[j] = (o.data[yp] + Math.sin(la + ra * (k + 1) / (cn + 1)) * cr) * scale;
            break;
          case zp:
            d[j] = z;
            break;
          }
        }
        a++;
      }
      pts[a] = r;
      pts[a].data[zp] = z;
      for (var j = 0; j < 3; j++) {
        if (j % 3 != zp) {
          pts[a].data[j] *= scale;
        }
      }
      a++;
    }
  }
  return pts;
};

function UnitVec(p1, p2) {
  var d = this.data = new Array(3);
  var d1 = p1.data;
  var d2 = p2.data;
  var s = 0;
  for (var i = 0; i < 3; i++) {
    var x = d[i] = d2[i] - d1[i];
    s += x * x;
  }
  s = Math.sqrt(s);
  for (var i = 0; i < 3; i++) {
    d[i] /= s;
  }
  this.length = s;
}

UnitVec.prototype.transform = function (pt, n, group) {
  var p = pt.copy(group);
  var d = this.data;
  var x = p.data;
  for (var i = 0; i < 3; i++) {
    x[i] += d[i] * n;
  }
  return p;
};

RoundedNGon.prototype.roundCorners = function (x) {
  this.cornerRadius = x;
};

var gcd = function (a, b) {
  if (!b) {
    return a;
  }

  return gcd(b, a % b);
};


function Shape(size) { //83996;//10574;//27260;//65668;//91958;//29408//21407;
  this.seed = Math.random() * 100000 >> 0;
  this.random = new LinearRandom(this.seed);
  this.z = 0;
  this.r = size;
  this.size = size;
  this.endMove = 0;
  this.r = size;
  this.bandsL = 6 //this.random.next()%5+1;
  this.points = [];
  this.bands = [];
  this.faces = [];
  this.groups = [];
  /*defineShape(this);
  /*ShapeModOpen(this);
  for (var i = 0; i < this.bandsL; i++) {
    var n = this.random.next() % 3;
    ShapeMods[n](this);
  }
  //ShapeModOpen(this);
  */

}

Shape.prototype.link = function () {
  for (var i = 0; i < this.bands.length - 1; i++) {
    this.bands[i].connectTo(this.bands[i + 1]);
  }
  for (var i = 0; i < this.bands.length - 1; i++) {
    var groups = this.bands[i].groups;
    var numberOfGroups = groups.length;
    for (var j = 0; j < groups.length; j++) {
      if (groups[j].dead)
        numberOfGroups--;
    }
    var concatGroups = new Array(numberOfGroups);
    var k = 0;
    for (var j = 0; j < groups.length; j++) {
      if (!groups[j].dead)
        concatGroups[k++] = groups[j];
    }
    this.bands[i].groups = concatGroups;
    this.groups = this.groups.concat(concatGroups);
  }
  for (var i = 0; i < this.groups.length; i++) {
    this.groups[i].recolor([this.random.range(0.5, 1.0), this.random.range(0.5, 1.0), this.random.range(0.5, 1.0), 1]);
  }
};

Shape.prototype.getCount = function () {
  var count = 0;
  var f = this.groups;
  var len = f.length;

  for (var i = 0; i < len; i++) {
    count += f[i].getCount();
  }
  return count;
};

Shape.prototype.toArray = function (count) {
  var addingArray = new AddingArray((count || this.getCount()) * 3);
  var f = this.groups;
  var len = f.length;

  for (var i = 0; i < len; i++) {
    f[i].toArray(addingArray);
  }
  return addingArray.data;
};

Shape.prototype.toColorArray = function (count) {
  var addingArray = new AddingArray((count || this.getCount()) * 4);
  var f = this.groups;
  var len = f.length;

  for (var i = 0; i < len; i++) {
    f[i].toColorArray(addingArray);
  }
  return addingArray.data;
};

Shape.prototype.toNormalArray = function (count) {
  var addingArray = new AddingArray((count || this.getCount()) * 3);
  var f = this.groups;
  var len = f.length;

  for (var i = 0; i < len; i++) {
    f[i].toNormalArray(addingArray);
  }
  return addingArray.data;
};

var ShapeMods = new Array(3);


function LinearRandom(s) {
  this.s = s;
  this.mod = Math.pow(2, 32);
}

LinearRandom.prototype.NextMachine = function () {
  return new LinearRandom(Math.abs((this.next() * this.next()) ^ this.next));
};

LinearRandom.prototype.next = function () {
  this.s = ((this.s * 1664525) + 1013904223) % this.mod;
  return this.s;
};

LinearRandom.prototype.intRange = function (min, max) {
  return (Math.round(this.float()*(max - min))) + min;
};

LinearRandom.prototype.range = function (min, max) {
  return this.float() * (max - min) + min;
};

LinearRandom.prototype.float = function () {
  return this.next() / this.mod;
};

LinearRandom.prototype.pick = function (ary) {
  return ary[(this.float()*ary.length)>>0];
};

LinearRandom.prototype.pickWeighted = function (ary) {
  var weight = 0, len = ary.length;
  for(var i = 1; i < len; i += 2){
    weight += ary[i];
  }
  weight = this.next()%weight;
  for(var i = 1; i < len; i += 2){
    if(weight < ary[i])
      return ary[i - 1];
  }
};

ShapeMods[0] = function (shape) { // round ngon
  shape.z += shape.endMove;
  var n = shape.random.next() % 6 + 3;
  var s = new RoundedNGon(n);
  s.roundCorners(shape.random.range(0.1, 0.5) * shape.size);
  s.cornerN = 4;
  console.log("rounded n-gon:" + n);

  shape.bands.push(new Band(s.getPoints(shape.size, shape.z)));
};

ShapeMods[1] = function (shape) { // ngon
  shape.z += shape.endMove;
  var n = shape.random.next() % 6 + 3;
  console.log("n-gon:" + n);

  shape.bands.push(new Band(nGonBand(n, shape.size, shape.z)));
};

ShapeMods[2] = function (shape) { // circle
  shape.z += shape.endMove;
  console.log("circle");

  shape.bands.push(new Band(nGonBand(16, shape.size, shape.z)));
};


function Aperature(shape, band, width, length, n) {
  var m1 = 1 - width;
  for (var i = 0; i <= n; i++) {
    var x = (i / n * m1 - m1);
    shape.bands.push(new Band(band.getPoints(shape.size * Math.sqrt(1 - x * x), shape.z)));
    shape.z += 1 / n * shape.size * length;

  }
}


function randomBand(shape) {
  var band;

  var opt = shape.random.next() % 3;
  var n = shape.random.next() % 6 + 3;
  switch (opt) {
  case 0:
    band = new Band(nGonBand(16, 1, 0));
    break;
  case 1:
    var s = new RoundedNGon(n, shape.random.next() % 2);
    s.roundCorners(shape.random.range(0.1, 0.9) * shape.size);
    s.cornerN = 4;
    band = new Band(s.getPoints(1, 0));
    break;
  case 2:
    band = new Band(nGonBand(shape.random.next() % 5 + 3, 1, 0, shape.random.next() % 2));
    break;
  }
  opt = shape.random.next() % 3;

  switch (opt) {
  case 0:
    band.warpAround(new Point(shape.random.range(-1, 1), 0, 0), [1 + shape.random.float(), 1, 1]);
    break;
  case 1:
    band.warpAround(new Point(shape.random.range(-1, 1), 0, 0), [1, 1, 1 + shape.random.float()]);
    break;
  case 2:
    band.warpAround(new Point(shape.random.range(-1, 1), 0, 0), [1 + shape.random.float(), 1, 1 + shape.random.float()]);
    break;
  }


  return band;
}

function ShapeModOpen(shape) { //Open / Close
  var band = randomBand(shape);
  shape.z += shape.endMove;
  var n = 10;
  ///.makeUnitSize();
  var aperatureWidth = shape.random.range(0.0001, 0.3),
    aperatureLength = 2;
  var x = 1 - aperatureWidth;
  var zInner = shape.z + aperatureLength * 0.25;
  var innerBand = new Band(band.getPoints(shape.size * Math.sqrt(1 - x * x) * 0.9, zInner));
  var outerBand = new Band(band.getPoints(shape.size * Math.sqrt(1 - x * x) * 0.9, shape.z));
  if (aperatureWidth > 0.1) {
    shape.bands.push(new Band([innerBand.getCenter()]));
    shape.bands.push(innerBand);
    shape.bands.push(outerBand);
  } else {
    shape.bands.push(new Band([outerBand.getCenter()]));
    shape.z += 1 / n * shape.size * aperatureLength;
    aperatureWidth = 0.1;
  }


  Aperature(shape, band, aperatureWidth, aperatureLength, n);

  shape.endMove = shape.size;

};



var Tween = {
  //(t)ime, (b)eginning value, (c)hange in value, (d)uration
  linear: function (t, b, c, d) {
    return t * c / d + b;
  },
  swing: function (t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  },
  easeInQuad: function (t, b, c, d) {
    return c * (t /= d) * t + b;
  },
  easeOutQuad: function (t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
  },
  easeInOutQuad: function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
  },
  easeInCubic: function (t, b, c, d) {
    return c * (t /= d) * t * t + b;
  },
  easeOutCubic: function (t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  },
  easeInOutCubic: function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t + 2) + b;
  },
  easeInQuart: function (t, b, c, d) {
    return c * (t /= d) * t * t * t + b;
  },
  easeOutQuart: function (t, b, c, d) {
    return -c * ((t = t / d - 1) * t * t * t - 1) + b;
  },
  easeInOutQuart: function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
    return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
  },
  easeInQuint: function (t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  },
  easeOutQuint: function (t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  },
  easeInOutQuint: function (t, b, c, d) {
    if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
    return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
  },
  easeInSine: function (t, b, c, d) {
    return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
  },
  easeOutSine: function (t, b, c, d) {
    return c * Math.sin(t / d * (Math.PI / 2)) + b;
  },
  easeInOutSine: function (t, b, c, d) {
    return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
  },
  easeInExpo: function (t, b, c, d) {
    return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
  },
  easeOutExpo: function (t, b, c, d) {
    return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
  },
  easeInOutExpo: function (t, b, c, d) {
    if (t == 0) return b;
    if (t == d) return b + c;
    if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
    return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
  },
  easeInCirc: function (t, b, c, d) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
  },
  easeOutCirc: function (t, b, c, d) {
    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
  },
  easeInOutCirc: function (t, b, c, d) {
    if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
    return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
  },
  easeInElastic: function (t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t == 0) return b;
    if ((t /= d) == 1) return b + c;
    if (!p) p = d * .3;
    if (a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else var s = p / (2 * Math.PI) * Math.asin(c / a);
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  },
  easeOutElastic: function (t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t == 0) return b;
    if ((t /= d) == 1) return b + c;
    if (!p) p = d * .3;
    if (a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else var s = p / (2 * Math.PI) * Math.asin(c / a);
    return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
  },
  easeInOutElastic: function (t, b, c, d) {
    var s = 1.70158;
    var p = 0;
    var a = c;
    if (t == 0) return b;
    if ((t /= d / 2) == 2) return b + c;
    if (!p) p = d * (.3 * 1.5);
    if (a < Math.abs(c)) {
      a = c;
      var s = p / 4;
    } else var s = p / (2 * Math.PI) * Math.asin(c / a);
    if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
  },
  easeInBack: function (t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
  },
  easeOutBack: function (t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
  },
  easeInOutBack: function (t, b, c, d, s) {
    if (s == undefined) s = 1.70158;
    if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
    return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
  },
  easeInBounce: function (t, b, c, d) {
    return c - Tween.eobJ(d - t, 0, c, d) + b;
  },
  eobJ: function (t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
      return c * (7.5625 * t * t) + b;
    } else if (t < (2 / 2.75)) {
      return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
    } else if (t < (2.5 / 2.75)) {
      return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
    } else {
      return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
    }
  },

  easeOutBounce: function (t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
      return c * (7.5625 * t * t) + b;
    } else if (t < (2 / 2.75)) {
      return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
    } else if (t < (2.5 / 2.75)) {
      return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
    } else {
      return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
    }
  },
  easeInOutBounce: function (t, b, c, d) {
    if (t < d / 2) return Tween.easeInBounce(t * 2, 0, c, d) * .5 + b;
    return Tween.easeOutBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
  }
};

function AddTweenedSegment(shape, band, n, start, end, length) {
  var tween = Tween.swing;
  var change = end - start;
  shape.z += shape.endMove;
  var startingZ = shape.z;
  for (var t = 0; t <= n; t++) {
    shape.bands.push(new Band(band.getPoints(tween(t, start, change, n), shape.z)));
    shape.z = startingZ + (t + 1) * length / (n + 1);
  }
  shape.endMove = shape.size;
}



function defineShape(shape) {
  var band = randomBand(shape);
  var minW = shape.size / 2;
  var maxW = shape.size * 2;
  var minWOpen = shape.size / 4;
  var minLen = shape.size,
    maxLen = shape.size * 5;
  var start_type = shape.random.next() % 3; // open/closed
  var startingWidth = shape.random.range(minWOpen, minW * 1.2);
  var startingLen = shape.random.range(minLen, maxLen);
  var nextSize = shape.random.range(minW, maxW);

  var bandsPerSec = 10;
  switch (start_type) {
  case 0:
    var zInner = shape.z + startingWidth;
    var innerBand = new Band(band.getPoints(startingWidth * 0.9, zInner));
    var outerBand = new Band(band.getPoints(startingWidth * 0.9, shape.z));
    nextSize = Math.max(nextSize, startingWidth);
    var cen = innerBand.getCenter();
    cen.group = GROUP_END;
    shape.bands.push(new Band([cen]));
    shape.bands.push(innerBand);
    shape.bands.push(outerBand);
    break;
  case 1:
    startingWidth = minWOpen;
    var outerBand = new Band(band.getPoints(startingWidth, shape.z));
    shape.bands.push(new Band([outerBand.getCenter()]));
    shape.endMove = 1 * startingLen / (10 + 1);
    break;
  case 2:
    startingWidth = minWOpen;
    var outerBand = new Band(band.getPoints(minWOpen / 3, shape.z));
    shape.bands.push(new Band([outerBand.getCenter()]));
    shape.bands.push(outerBand);
    shape.endMove = 1 * startingLen / (10 + 1) / 2;
    break;
  }
  for (var i = 0; i < 40; i++) {
    AddTweenedSegment(shape, band, bandsPerSec, startingWidth, nextSize, startingLen);
    startingWidth = nextSize;
    startingLen = shape.random.range(minLen, maxLen);
    nextSize = shape.random.range(minW, maxW);
  }


}