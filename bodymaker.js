Body = {};

Body.allEasings = ["linear", "swing", "easeInQuad", "easeOutQuad", "easeInOutQuad", "easeInCubic", "easeOutCubic", "easeInOutCubic", "easeInQuart", "easeOutQuart", "easeInOutQuart", "easeInQuint", "easeOutQuint", "easeInOutQuint", "easeInSine", "easeOutSine", "easeInOutSine", "easeInExpo", "easeOutExpo", "easeInOutExpo", "easeInCirc", "easeOutCirc", "easeInOutCirc", "easeInElastic", "easeOutElastic", "easeInOutElastic", "easeInBack", "easeOutBack", "easeInOutBack", "easeInBounce", "eobJ", "easeOutBounce", "easeInOutBounce"];

Body.easein = ["easeInQuad", "easeInCubic", "easeInQuart", "easeInQuint", "easeInSine", "easeInExpo", "easeInCirc"];

Body.easeout = ["easeOutQuad", "easeOutCubic", "easeOutQuart", "easeOutQuint", "easeOutSine", "easeOutExpo", "easeOutCirc"];

Body.create = function () {
  b = {};
  b.reqs = {};
  b.stats = {
    size: 1,
    z:0
  };
  b.shape = new Shape(1);
  b.r = b.shape.random;
  this.decideThings(b);
  return b;
};

Body.getTailSize = function (b) {
  var x = {
    small: b.r.range(b.stats.size / 5, b.stats.size / 2),
    big: 0
  };
  if (b.r.float() < 0.5)
    x.big = x.small + b.r.range(0, b.stats.size / 5);
  else
    x = x.small;
  return x;
};

Body.getMidsectionSize = function (b) {
  var x = {
    small: b.r.range(b.stats.size * 0.8, b.stats.size * 1.2),
    big: 0
  };
  if (b.r.float() < 0.5)
    x.big = x.small + b.r.range(0, b.stats.size * 0.2);
  else
    x = x.small;
  return x;
};

Body.addBandsForStepUp = function(b, n, start, end){
  var ease = start < end ? Tween.easeOutQuad : Tween.easeInQuad;
  b.band = new Band(nGonBand(b.r.intRange(3,8),1,0));
  b.band.makeUnitSize();
  var center = b.band.getCenterStats();
  n+=2;
  for(var i = 0; i < n; i++){
    var at = i/(n-1);
    var z = at + b.stats.z;
    if((i == 0  && start == 0) || (i == n - 1 && end == 0)){
      b.shape.bands.push(new Band([new Point(0,z,0)]));
    }else{
      b.shape.bands.push(new Band(b.band.getPoints(ease(at,start,end-start,1), z)));
    }
  }
  return b;
};

Body.decideThings = function (b) {
  if (b.r.float() < 0.5) {
    b.reqs.front_tail = {};
    var x = this.getTailSize(b);
    b.reqs.front_tail.front = b.small;
    b.reqs.front_tail.rear = b.big;
  }
  if (b.r.float() < 0.5) {
    b.reqs.back_tail = {};
    var x = this.getTailSize(b);
    b.reqs.back_tail.front = b.big;
    b.reqs.back_tail.rear = b.small;
  };
      var x = this.getMidsectionSize(b);
  b.reqs.mid_section = {};
  if(b.r.float() < 0.5){
    b.reqs.mid_section.front = x.small;
    b.reqs.mid_section.rear = x.big;
  }else{
    b.reqs.mid_section.front = x.big;
    b.reqs.mid_section.rear = x.small;
  }
  var possible_cockpits = ["on_midsection"];
  if(!b.reqs.front_tail){
    possible_cockpits.push("on_nose");
    possible_cockpits.push("as_nose");
  }else{
    possible_cockpits.push("on_increase");
  }
  b.reqs.cockpit = {};
  b.reqs.cockpit[b.r.pick(possible_cockpits)] = true;
  if(b.reqs.cockpit.as_nose){
    b.reqs.cockpit.step_up = true;
  }
  if(b.reqs.cockpit.as_nose){
    b.reqs.cockpit.step_up = true;
  }else{
    if(b.r.float() < 0.5)
      b.reqs.cockpit.step_up = true;
  }
};