var debug = require('debug')('sourcer')

// pull(source(),
//      duplex(),
//      sink());
// duplex in the middle of a stream means our source is talking to our duplex's sink
// which can either take more bytes or not depending on the transports ability, not the protocols ability
// so sadly we need a pushable that we can throttle on the sink side
// where we know when weve gotten a full command response and want to send the next command
// usage ex:
// var sourcer = Sourcer([nmgr.generateListBuffer(), nmgr.generateListBuffer()]);
// pull(
//   sourcer.source(),
//   duplex(),
//   utility.throughLog(),
//   pull.drain(sourcer.next.bind(sourcer), function(){
//   process.exit(0)
//   })

var Sourcer = function(array) {
  if (!(this instanceof Sourcer)) 
  return new Sourcer(array);

  this.array = array;
  this.cb = null;
  this.first = true;
};

Sourcer.prototype.source = function () {
  return function (end, cb) {
    debug("Sourcer read request")
    if(end) debug("Sourcer return end")
    if(end) return cb(end)

    if(this.first){
      this.first = false;
      debug("Sourcer write first data");
      return cb(null, this.array.shift())
    }

    debug("Sourcer delay");
    this.cb = cb;

  }.bind(this)
}

Sourcer.prototype.next = function(){
  debug("Sourcer next")
  if(this.cb){
    if(this.array && this.array.length){
      debug("Sourcer manual write data");
      this.cb(null, this.array.shift())
      return true;
    }else{
      debug("Sourcer manual return end")
      this.cb(true)
      return false;
    }
  }
}

module.exports = Sourcer;