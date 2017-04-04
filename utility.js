var through2 = require('through2');
var from2 = require('from2');

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

//so we have a huge issue here mapping something like ble with listeners to streams
//in that we dont know when we're done receiving data.. In fact we wont know until read finishes processing
//so its your job to hold this return and push(null) to it to close
function emitterStream(emitter) {
  return from2.obj(function(size, cb) {
    emitter.once('data', function(data){
      cb(null, data);
    });
  });
}

module.exports = {hashToStringTransform, emitterStream}
