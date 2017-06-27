var duplexify = require('duplexify');
var through2 = require('through2');
var from2 = require('from2');
var to2 = require('flush-write-stream');
var invert = require('lodash.invert');
var debug = require('debug')('newtmgr-utility');
var CONSTANTS = require('./constants');


var hashToString = function(currentValue, index, array){
  if(currentValue.hash){
    currentValue.hash = currentValue.hash.toString('hex');
  }
  return currentValue;
};

var prettyList = function(obj){
  if (obj && obj.hasOwnProperty('images')){
    return obj.images.map(hashToString);
  }else{
    return obj;
  }
};

var prettyError = function(obj){
  if(obj && obj.hasOwnProperty('rc')){
    var lookup = invert(CONSTANTS.NMGR_ERR)[obj.rc];
    if(typeof lookup === "undefined")
      return obj;

    obj.rc = lookup;
    return obj;
  }else{
    return obj;
  }
};

var gater = function(){
  var first = true;

  var transform = function(data, enc, cb){
    if(first){
      debug("gater call");
      first = false;
      return cb(null, data);
    }else{

      var next = function(){
        debug('gater next');
        cb(null, data);
      };

      debug("gater delay", data);
      this.once('next', next.bind(this));
    }
  };
  return through2.obj(transform, function(cb){debug("gater flushing");cb();});
};

var newImageHashLookup = function(obj){
  var hash;
  obj.images.forEach(function callback(image, index, array) {
    if(!image.confirmed && !image.active){
      hash = image.hash;
    }
  });
  return hash;
};

var findBootable = function(obj){
  var img;
  obj.images.forEach(function callback(image, index, array) {
    if(image.bootable){
      img = image;
    }
  });
  return img;
};

var findApp = function(obj){
  var img;
  obj.images.forEach(function callback(image, index, array) {
    if(!image.bootable){
      img = image;
    }
  });
  return img;
};


var emitterDuplex = function(emitter, streamOptions){

  var rs = from2(streamOptions);

  var output = function(data, enc, cb){
    emitter.write(data, function(err){
      if (err) return cb(err);
      cb();
    });
  };
  var ws = to2(streamOptions ,output);

  var stream = duplexify(ws, rs, streamOptions);

  var onData = function(data){
    rs.push(data);
  };

  emitter.on('data', onData);

  stream.on('finish', function(){
    emitter.removeListener('data', onData);
    rs.push(null);
  });

  return stream;
};

var chunk = function(buffer, size){
  if (buffer.length < size)
    return [buffer];

  var chunks = [];
  var idx = 0;
  while(idx<buffer.length){
    chunks.push(buffer.slice(idx,idx+size));
    idx = idx+size;
  }
  return chunks;
};


module.exports = {
  chunk: chunk,
  emitterDuplex: emitterDuplex,
  gater: gater,
  newImageHashLookup: newImageHashLookup,
  findBootable: findBootable,
  findApp: findApp,
  prettyList: prettyList,
  prettyError: prettyError
};
