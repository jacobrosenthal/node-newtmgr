var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var from2 = require('from2');
var concat = require('concat-stream');
var Stream = require('stream');

var serial = require('../serial');

var resetCommand = new Buffer([0x02, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x05, 0x7b, 0x7d]);
var resetEncoded = new Buffer([0x41, 0x41, 0x77, 0x43, 0x41, 0x41, 0x41, 0x43, 0x41, 0x41, 0x41, 0x41, 0x42, 0x58, 0x74, 0x39, 0x4c, 0x67, 0x41, 0x3d]);
var resetWritten = new Buffer([0x06, 0x09, 0x41, 0x41, 0x77, 0x43, 0x41, 0x41, 0x41, 0x43, 0x41, 0x41, 0x41, 0x41, 0x42, 0x58, 0x74, 0x39, 0x4c, 0x67, 0x41, 0x3d, 0x0a]);
var listResponse1 = new Buffer([6, 9, 65, 80, 52, 66, 65, 65, 68, 48, 65, 65, 69, 65, 65, 76, 57, 109, 97, 87, 49, 104, 90, 50, 86, 122, 110, 55, 57, 107, 99, 50, 120, 118, 100, 65, 66, 110, 100, 109, 86, 121, 99, 50, 108, 118, 98, 109, 85, 119, 76, 106, 65, 117, 77, 71, 82, 111, 89, 88, 78, 111, 87, 67, 65, 69, 87, 110, 84, 118, 120, 57, 108, 82, 102, 102, 72, 119, 119, 86, 102, 122, 71, 65, 66, 67, 122, 53, 99, 98, 43, 51, 107, 119, 54, 51, 69, 82, 67, 72, 113, 67, 56, 72, 76, 78, 101, 109, 104, 105, 98, 50, 57, 48, 89, 87, 74, 115, 90, 102, 86, 110, 99, 71, 86, 117, 90, 71, 108, 117]);
var listResponse2 = new Buffer([4, 20, 90, 47, 82, 112, 89, 50, 57, 117, 90, 109, 108, 121, 98, 87, 86, 107, 57, 87, 90, 104, 89, 51, 82, 112, 100, 109, 88, 49, 97, 88, 66, 108, 99, 109, 49, 104, 98, 109, 86, 117, 100, 80, 84, 47, 118, 50, 82, 122, 98, 71, 57, 48, 65, 87, 100, 50, 90, 88, 74, 122, 97, 87, 57, 117, 90, 84, 65, 117, 77, 67, 52, 119, 90, 71, 104, 104, 99, 50, 104, 89, 73, 69, 69, 88, 51, 51, 119, 100, 120, 65, 57, 85, 56, 43, 54, 47, 104, 82, 70, 122, 43, 82, 70, 66, 122, 109, 43, 83, 73, 80, 111, 101, 103, 43, 75, 84, 89, 106, 84, 84, 111, 70, 114, 75, 97, 71, 74, 118]);
var listResponse3 = new Buffer([4, 20, 98, 51, 82, 104, 89, 109, 120, 108, 57, 71, 100, 119, 90, 87, 53, 107, 97, 87, 53, 110, 57, 71, 108, 106, 98, 50, 53, 109, 97, 88, 74, 116, 90, 87, 84, 48, 90, 109, 70, 106, 100, 71, 108, 50, 90, 102, 82, 112, 99, 71, 86, 121, 98, 87, 70, 117, 90, 87, 53, 48, 57, 80, 47, 47, 97, 51, 78, 119, 98, 71, 108, 48, 85, 51, 82, 104, 100, 72, 86, 122, 65, 118, 56, 66, 67, 119, 61, 61]);
var listResponseAccumulated = new Buffer([0x01, 0x00, 0x00, 0xf4, 0x00, 0x01, 0x00, 0x00, 0xbf, 0x66, 0x69, 0x6d, 0x61, 0x67, 0x65, 0x73, 0x9f, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x00, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x04, 0x5a, 0x74, 0xef, 0xc7, 0xd9, 0x51, 0x7d, 0xf1, 0xf0, 0xc1, 0x57, 0xf3, 0x18, 0x00, 0x42, 0xcf, 0x97, 0x1b, 0xfb, 0x79, 0x30, 0xeb, 0x71, 0x11, 0x08, 0x7a, 0x82, 0xf0, 0x72, 0xcd, 0x7a, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf5, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf5, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf5, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x01, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x41, 0x17, 0xdf, 0x7c, 0x1d, 0xc4, 0x0f, 0x54, 0xf3, 0xee, 0xbf, 0x85, 0x11, 0x73, 0xf9, 0x11, 0x41, 0xce, 0x6f, 0x92, 0x20, 0xfa, 0x1e, 0x83, 0xe2, 0x93, 0x62, 0x34, 0xd3, 0xa0, 0x5a, 0xca, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf4, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf4, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf4, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xff, 0x6b, 0x73, 0x70, 0x6c, 0x69, 0x74, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x02, 0xff, 0x01, 0x0b]);
var listResponseDecoded     = new Buffer([0x01, 0x00, 0x00, 0xf4, 0x00, 0x01, 0x00, 0x00, 0xbf, 0x66, 0x69, 0x6d, 0x61, 0x67, 0x65, 0x73, 0x9f, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x00, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x04, 0x5a, 0x74, 0xef, 0xc7, 0xd9, 0x51, 0x7d, 0xf1, 0xf0, 0xc1, 0x57, 0xf3, 0x18, 0x00, 0x42, 0xcf, 0x97, 0x1b, 0xfb, 0x79, 0x30, 0xeb, 0x71, 0x11, 0x08, 0x7a, 0x82, 0xf0, 0x72, 0xcd, 0x7a, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf5, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf5, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf5, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x01, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x41, 0x17, 0xdf, 0x7c, 0x1d, 0xc4, 0x0f, 0x54, 0xf3, 0xee, 0xbf, 0x85, 0x11, 0x73, 0xf9, 0x11, 0x41, 0xce, 0x6f, 0x92, 0x20, 0xfa, 0x1e, 0x83, 0xe2, 0x93, 0x62, 0x34, 0xd3, 0xa0, 0x5a, 0xca, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf4, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf4, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf4, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xff, 0x6b, 0x73, 0x70, 0x6c, 0x69, 0x74, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x02, 0xff]);

var resetResponse1 = new Buffer([0x06, 0x09, 0x41, 0x41, 0x77, 0x43, 0x41, 0x41, 0x41, 0x43, 0x41, 0x41, 0x41, 0x41, 0x42, 0x58, 0x74, 0x39, 0x4c, 0x67, 0x41, 0x3d])
var resetResponse2 = new Buffer([0x06, 0x09, 0x41, 0x42, 0x41, 0x44, 0x41, 0x41, 0x41, 0x47, 0x41, 0x41, 0x41, 0x41, 0x42, 0x62, 0x39, 0x69, 0x63, 0x6d, 0x4d, 0x41, 0x2f, 0x78, 0x58, 0x57]);
var resetResponseAccumulated = new Buffer([0x02, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x05, 0x7b, 0x7d, 0x2e, 0x00, 0x03, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00, 0x05, 0xbf, 0x62, 0x72, 0x63, 0x00, 0xff, 0x15, 0xd6]);


describe('serial', function () {

  it('should encode', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(resetEncoded);
      done();
    };

    from2([resetCommand])
      .pipe(serial._encode())
      .pipe(concat(complete));
  });


  it('should fragment', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(resetWritten);
      done();
    };

    from2([resetEncoded])
      .pipe(serial._fragmentPacket())
      .pipe(concat(complete));
  });


  it('should both encode and fragment', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(resetWritten);
      done();
    };

    from2([resetCommand])
      .pipe(serial.encode())
      .pipe(concat(complete));
  });


  it('should accumulate fragmented reset response packet data', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(resetResponseAccumulated);
      done();
    };

    var stream = function(){
      function listResponse(size, next){
        this.push(resetResponse1);
        this.push(resetResponse2);
        next(null, null);
      }

      return from2(listResponse)
    }

    stream()
      .pipe(serial._accumulatePacket())
      .pipe(concat(complete));

  });



  it('should accumulate fragmented list response packet data', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(listResponseAccumulated);
      done();
    };

    var stream = function(){
      function listResponse(size, next){
        this.push(listResponse1);
        this.push(listResponse2);
        this.push(listResponse3);
        next(null, null);
      }

      return from2(listResponse)
    }

    stream()
      .pipe(serial._accumulatePacket())
      .pipe(concat(complete));
  });


  it('should decode', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(listResponseDecoded);
      done();
    };

    from2([listResponseAccumulated])
      .pipe(serial._decode())
      .pipe(concat(complete));
  });


  it('should read fragmented packet data', function (done) {

    var complete = function(data){
      expect(data).to.deep.equal(listResponseDecoded);
      done();
    }

    var stream = function(){
      function listResponse(size, next){
        this.push(listResponse1);
        this.push(listResponse2);
        this.push(listResponse3);
        next(null, null);
      }

      return from2(listResponse)
    }

    stream()
      .pipe(serial.decode())
      .pipe(concat(complete))
  });

});
