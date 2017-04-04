//stolen from https://github.com/maxogden/ble-stream
var noble = require('noble')
var from2 = require('from2')
var through2 = require('through2')
var duplexify = require('duplexify')
var hasIn = require('lodash.hasin');
var has = require('lodash.has');
var BufferList = require('bl')
var debug = require('debug')('newtmgr-ble')


var MAX = 256


var createStream = function (ch, buffer) {
  // sadly bl as a read stream directly closes when it thinks its consumed
  // but still handy for storing the buffer
  var bl = new BufferList()
  var stream = duplexify()

  var onData = function(data){
    debug('onData', {length: data.length})
    return bl.append(data);
  }

  var writable = function() {

    var input = function (data, enc, cb) {
      debug('onwrite', {length: data.length})

      var offset = -MAX
      var loop = function (err) {
        if (err) return cb(err)
        if (offset + MAX >= data.length) return cb()
        offset += MAX
        ch.write(data.slice(offset, offset + MAX), true, loop.bind(this))
      }

      loop()
    };

    return through2(input);
  }

  var readable = function() {
    var open = false;

    var output = function (size, cb) {
      if(!open){
        debug('first onread', {size})
        ch.on('data', onData);
        open = true;
      }

      if (bl.length>0) {
        var len = size > bl.length ? bl.length : size;
        var data = bl.slice(0, len);
        bl.consume(len);
        cb(null, data);
      } else {
        ch.once('data', output.bind(null, size, cb));
      }
    }

    return from2(output);
  }

  ch.once('notify', function(state){
    debug('characteristic notification', state);
    stream.destroy();
  });

  stream.once('close', function(){
    debug('duplex onClose');
    ch.removeListener('data', onData);
  });

  stream.setWritable(writable())
  stream.setReadable(readable())

  if(buffer){
    stream.write(buffer)
  }

  return stream;
}

var connect = function(opts, cb) {

  var onStateChange = function (state) {
    debug('onStateChange')
    if (state === 'poweredOn') {
      noble.startScanning(opts, false)
    } else {
      noble.stopScanning()
    }
  }

  var onDiscover = function (peripheral) {
    if(hasIn(peripheral, 'advertisement.localName') && has(opts, 'name') && (peripheral.advertisement.localName !== opts.name))
    {
      return;
    }
    debug('onDiscover', peripheral.advertisement.localName)

    noble.removeListener('stateChange', onStateChange)
    noble.removeListener('discover', onDiscover)
    noble.stopScanning()

    var onConnect = function (err) {
      debug('onConnect', err)
      if (err) return cb(err)

      var onDiscoverServices = function (err, services) {
        debug('onDiscoverServices', err)
        if (err) return cb(err)

          var onDiscoverCharacteristics = function (err, characteristics) {
            debug('onDiscoverCharacteristics', err)
            if (err) return cb(err)

            var onSubscribe = function(err){
              debug('onSubscribe', err)
              if (err) return cb(err)

              return cb(null, characteristics[0]);
            }

            return characteristics[0].subscribe(onSubscribe);
          }

        return services[0].discoverCharacteristics(opts.characteristics, onDiscoverCharacteristics);
      };

      return peripheral.discoverServices(opts.services, onDiscoverServices);
    }

   var onDisconnect = function(err){
    debug('onDisconnect', err);
   }

    peripheral.once('disconnect', onDisconnect);
    peripheral.connect(onConnect);
  }

  noble.on('stateChange', onStateChange)
  noble.on('discover', onDiscover)

  //hack for webble, whose statechange isnt good yet
  if(opts && opts.nowait){
    noble.emit('stateChange', 'poweredOn');
  }
}

module.exports = { createStream, connect };
