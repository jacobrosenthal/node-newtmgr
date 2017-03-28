var SerialPort = require('serialport');
var through2 = require('through2');
var concat = require('concat-stream');
var from2 = require('from2');

var nmgr = require('./nmgr');
var serial = require('./serial');

var stream = new SerialPort('/dev/tty.usbmodem1411', {
  baudRate: 115200
});

if (process.argv.indexOf('--reset') !== -1) {

    var listen = through2.obj(function (chunk, enc, callback) {
      console.log(chunk)
      process.exit(0)
    });

    // from2 will close transport on you, so only use if you only want to do one operation
    from2([nmgr.generateResetBuffer()])
      .pipe(serial.encode())
      .pipe(stream);

    stream
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(listen);
}

