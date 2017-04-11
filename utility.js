var through2 = require('through2');
var from2 = require('from2');
var through = require('pull-through')
var debug = require('debug')('newtmgr-utility')

var hashToString = function(currentValue, index, array){
  if(currentValue.hash){
    currentValue.hash = currentValue.hash.toString('hex')
  }
  return currentValue;
}

var hashToStringTransform = function() {

  function transform(chunk, enc, cb){
    if(chunk && chunk.images){
      chunk.images = chunk.images.map(hashToString)
    }
    return cb(null, chunk);
  }

  return through2.obj(transform);
}

function throughLogPull(){
  function transform(data) {
    console.log(data)
    this.queue(data)
  }

  function flush(end) {
    debug("throughLogPull ending");
    this.queue(null)
  }

  return through(transform,flush);
}


function gater(){
  var first = true;

  var transform = function(data, enc, cb){
    if(first){
      debug("gater call");
      first = false;
      return cb(null, data);
    }else{

      var dogs = function(){
        debug('gater next');
        cb(null, data);
      };

      debug("gater delay", data);
      this.once('next', dogs.bind(this))
    }
  };
  return through2(transform, function(cb){debug("gater flushing");cb()});
}


module.exports = {hashToStringTransform, throughLogPull, gater}
