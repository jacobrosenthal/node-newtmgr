'use strict';

var crc = require('crc');
var pipeline = require('pumpify');
var split2 = require("split2");
var duplexify = require('duplexify')
var from2 = require('from2');
var to2 = require('flush-write-stream');
var through2 = require('through2');

var CONSTANTS = require('./constants');
var debug = require('debug')('newtmgr-serial')


var decode = function(){
  return pipeline(split2('\n'), _accumulatePacket(), _decode());
}


var _accumulatePacket = function() {
  var pktLen;
  var buffer = Buffer.alloc(0);

  function transform(data, enc, cb) {
    debug("_accumulatePacket", data.toString('hex'));

    var type = data.readUInt16BE(0);
    var base64DataString = data.slice(2).toString('ascii');
    var msgData = new Buffer(base64DataString, 'base64');

    if(type === CONSTANTS.START ){
      pktLen =  msgData.readUInt16BE(0);
      msgData = msgData.slice(2);
    }

    buffer = Buffer.concat([buffer, msgData]);

    if(pktLen === buffer.length){
      this.push(buffer)
      //I think we should just close to clear?
      pktLen = undefined;
      buffer = Buffer.alloc(0);
    }
    return cb();
  }

  return through2(transform);
}


var _decode = function() {

  function transform(data, enc, cb) {
    debug("_decode", data.toString('hex'));

    var crcIndex = data.length-2;
    var crcValue = data.readUInt16BE(crcIndex);
    var finalData = data.slice(0,crcIndex);

    if(crcValue === crc.crc16xmodem(finalData)){
      return cb(null, finalData);
    }else{
      return cb(new Error("CRC error"));
    }
  }

  return through2(transform);
}


var encode = function(){
  return pipeline(_encode(), _fragmentPacket());
}


var _fragmentPacket = function() {

  function transform(data, enc, cb) {
    debug("_fragmentPacket", data.toString('hex'));

    var written = 0;
    var totlen = data.length;
    var START = new Buffer([0x6, 0x9])
    var CONTINUE = new Buffer([0x4, 0x14]);
    var END = new Buffer('\n');

    while (written < totlen) {
      var buffer = Buffer.alloc(0);

      /* write the packet stat designators. They are
      * different whether we are starting a new packet or continuing one */
      if (written == 0) {
        buffer = Buffer.concat([buffer, START]);
      } else {
        /* slower platforms take some time to process each segment
         * and have very small receive buffers.  Give them a bit of
         * time here */
        // time.Sleep(20 * time.Millisecond)
        buffer = Buffer.concat([buffer, CONTINUE]);
      }

      /* ensure that the total frame fits into 128 bytes.
       * base 64 is 3 ascii to 4 base 64 byte encoding.  so
       * the number below should be a multiple of 4.  Also,
       * we need to save room for the header (2 byte) and
       * carriage return (and possibly LF 2 bytes), */

      /* all totaled, 124 bytes should work */
      var writeLen = Math.min(124, totlen-written);

      var writeBytes = data.slice(written, written+writeLen);
      buffer = Buffer.concat([buffer, writeBytes]);
      buffer = Buffer.concat([buffer, END]);

      written += writeLen;

      this.push(buffer);
    }
    return cb();
  }

  return through2(transform);
}


var _encode = function() {

  function transform(data, enc, cb) {
    debug("_encode", data.toString('hex'));

    var crcValue = crc.crc16xmodem(data);
    var crcBuffer = Buffer.alloc(2);
    crcBuffer.writeUInt16BE(crcValue);
    
    //prefill length with zeros for allocation speed
    var lenBuffer = new Buffer([0x00,0x00]);
    
    var outBuffer = Buffer.concat([lenBuffer, data, crcBuffer]);
    
    //write length of data+crc to first 2 bytes
    outBuffer.writeUInt16BE(data.length+crcBuffer.length)
    
    var base64DataString = outBuffer.toString('base64');

    return cb(null, new Buffer(base64DataString));
  }

  return through2(transform);
}

var duplex = function(port){

  var rs = from2();

  var output = function(data, enc, cb){
    port.write(data, function(err){
      if (err) return cb(err)
      cb()
    });
  };
  var ws = to2(output)

  var dup = duplexify(ws, rs);

  var onData = function(data){
    rs.push(data);
  }

  port.on('data', onData);

  dup.on('finish', function(){
    port.removeListener('data', onData);
    rs.push(null);
  });

  return dup;
}


module.exports = {encode, decode, _accumulatePacket, _decode, _encode, _fragmentPacket, duplex};
