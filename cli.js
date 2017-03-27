var SerialPort = require('serialport');
var Readline = SerialPort.parsers.Readline;
var Stream = require('stream');
var through2 = require('through2');

var nmgrProtocol = require('./nmgr');
var serialProtocol = require('./serial');

if (process.argv.indexOf('--reset') !== -1) {

  var stream = new SerialPort('/dev/tty.usbmodem1411', {
    baudRate: 115200
  });

  var readable = new Stream.Readable();
  readable._read = function(size) { /* do nothing */ };

  var nmr = nmgrProtocol.resetCommand();
  var cmd = nmgrProtocol.serialize(nmr);

  readable
    .pipe(serialProtocol.encode())
    .pipe(serialProtocol.fragmentPacket())
    .pipe(stream);

  readable.emit('data', cmd);

  var listen = through2.obj(function (chunk, enc, callback) {

    console.log(chunk)
    callback();
    process.exit(0);

  });

  stream
    .pipe(Readline({delimiter: '\r\n'}))
    .pipe(serialProtocol.accumulatePacket())
    .pipe(serialProtocol.decode())
    .pipe(nmgrProtocol.accumulate())
    .pipe(listen)
}
