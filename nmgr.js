var through2 = require('through2');
var async = require('async');

var CONSTANTS = require('./constants');


function reset(transport, cb)
{
  var command = _resetCommand();

  var tasks = [
    _writeReq,
    _readResp,
  ];

  async.applyEachSeries(tasks, transport, command, function(err, returnArray){
    if(err){ return cb(err); }

    if(returnArray && returnArray[1]){
      return cb(null, returnArray[1])
    }else{
      return cb();
    }
  });
}


function _resetCommand()
{

  nmr = {};
  nmr.Data = Buffer.from("{}");
  nmr.Op = CONSTANTS.NMGR_OP_WRITE;
  nmr.Flags = 0;
  nmr.Len = nmr.Data.length;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_DEFAULT;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.NMGR_ID_RESET;

  return nmr;
}


function _writeReq(transport, nmr, cb) {
  var command = _serialize(nmr);

  transport.writePacket(command);
  return cb();
}


function _serialize(nmr){

  const buf = Buffer.alloc(8);

  buf.writeUInt8(nmr.Op, 0);
  buf.writeUInt8(nmr.Flags, 1);

  buf.writeUInt16BE(nmr.Len, 2);
  buf.writeUInt16BE(nmr.Group, 4);

  buf.writeUInt8(nmr.Seq, 6);
  buf.writeUInt8(nmr.Id, 7);

  return Buffer.concat([buf, nmr.Data]);
}


function _readResp(transport, nmr, cb){
  var stream = transport.readPacket()
    .pipe(_accumulate());
    // .pipe(concat(cb))

    stream.once('data', function(data){
      return cb(null, data);
    });
}


function _accumulate() {
  var header;
  var nonmgrhdr = false;

  function transform(data, enc, cb) {

    if (!nonmgrhdr) {

      if(data.length < 8){
        return cb(new Error("Newtmgr request buffer too small"));
      }
      var _header = _deserialize(data);
      if(_header && (_header.Op === CONSTANTS.NMGR_OP_READ_RSP || _header.Op ===CONSTANTS.NMGR_OP_WRITE_RSP)){
        header = _header;
      }
    }

    if(typeof header !== 'undefined'){
      if(nonmgrhdr){
        header.Data = Buffer.concat([header.Data, data])
      }

      if(header.Len >= header.Data.length){
        this.push(header);
        header = undefined;
        nonmgrhdr = false;
      }else{
        nonmgrhdr = true;
      }
    }
    return cb();
  }

  return through2.obj(transform);
}


function _deserialize(serializedBuffer){
  nmr = {};
  nmr.Op = serializedBuffer.readUInt8(0);
  nmr.Flags = serializedBuffer.readUInt8(1);
  nmr.Len = serializedBuffer.readUInt16BE(2);
  nmr.Group = serializedBuffer.readUInt16BE(4);
  nmr.Seq = serializedBuffer.readUInt8(6);
  nmr.Id = serializedBuffer.readUInt8(7);
  nmr.Data = serializedBuffer.slice(8);
  return nmr;
}


module.exports = {reset, _readResp, _resetCommand, _serialize, _deserialize, _accumulate};
