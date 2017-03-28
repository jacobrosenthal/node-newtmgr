var SerialPort = require('serialport');
var through2 = require('through2');
// var concat = require('concat-stream');

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

  // var complete = function(data){
  //   console.log(data)
  //   process.exit(0)
  // }

  nmgr.reset()
  .pipe(serial.encode())
  .pipe(stream)

  stream
  .pipe(serial.decode())
  .pipe(nmgr.decode())
  .pipe(listen)
  // .pipe(concat(complete));

}

