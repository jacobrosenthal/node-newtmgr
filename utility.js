var through2 = require('through2');
var from2 = require('from2');
var through = require('pull-through')

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

module.exports = {hashToStringTransform, throughLogPull}
