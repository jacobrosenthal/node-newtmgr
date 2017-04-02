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

module.exports = function (opts) {
  return createStream(opts)
}

function createStream (opts) {
  var stream = duplexify()

  var ready = function (ch) {

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

    // sadly bl as a read stream directly closes when it thinks its consumed
    // but still handy for storing the buffer
    var bl = new BufferList()

    var output = function (size, cb) {
      if (bl.length>0) {
        var len = size > bl.length ? bl.length : size;
        var data = bl.slice(0, len);
        bl.consume(len);
        cb(null, data);
      } else {
        ch.once('data', output.bind(null, size, cb));
      }
    }

    ch.on('data', bl.append.bind(bl));

    stream.setWritable(through2(input))
    stream.setReadable(from2(output))
  }

  var onStateChange = function (state) {
    debug('onStateChange')
    if (state === 'poweredOn') {
      if(opts && opts.name){
        noble.startScanning([], false)
      }else{
        noble.startScanning([opts.serviceUuid], false)
      }
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
      if (err) return stream.destroy(err)

      var onDiscoverServices = function (err, services) {
        debug('onDiscoverServices', err)
        if (err) return stream.destroy(err)

          var onDiscoverCharacteristics = function (err, characteristics) {
            debug('onDiscoverCharacteristics', err)
            if (err) return stream.destroy(err)

            var onSubscribe = function(err){
              debug('onSubscribe', err)
              if (err) return stream.destroy(err)

              return ready(characteristics[0]);
            }

            return characteristics[0].subscribe(onSubscribe.bind(this));
          }

        return services[0].discoverCharacteristics([opts.characteristicUuid], onDiscoverCharacteristics.bind(this));
      };

      return peripheral.discoverServices([opts.serviceUuid], onDiscoverServices.bind(this));
    }

    var onDisconnect = function(err){
      debug('onDisconnect', err);
      // ch.removeListener('data', onData);
      stream.push(null)
    }

    peripheral.once('disconnect', onDisconnect.bind(this));
    peripheral.connect(onConnect.bind(this));
  }

  noble.on('stateChange', onStateChange.bind(this))
  noble.on('discover', onDiscover.bind(this))

  return stream
}