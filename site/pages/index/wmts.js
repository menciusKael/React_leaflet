var fs = require("fs");
var express = require("express");
var app = express();
var router = express.Router();

var Bagpipe = require("bagpipe");
var bagpipe = new Bagpipe(10);

router.get("/wmts", function(req, res) {
  var query = req.query;
  var dir =
    "E:\\arcgisserver\\directories\\arcgiscache\\map\\Layers\\_alllayers";
  var l = query.l;
  var r = query.r;
  var c = query.c;

  //参数判断
  if (isNaN(parseInt(c))) {
    fs.createReadStream(dir + "\\" + "none.png").pipe(res);
  }

  if (isNaN(parseInt(r))) {
    fs.createReadStream(dir + "\\" + "none.png").pipe(res);
  }

  if (isNaN(parseInt(l))) {
    fs.createReadStream(dir + "\\" + "none.png").pipe(res);
  }

  if (l.length == 1) {
    l = "0" + l;
  }

  r = "00000000" + parseInt(r).toString(16);
  c = "00000000" + parseInt(c).toString(16);

  r = r.substring(r.length - 8, r.length);
  c = c.substring(c.length - 8, c.length);

  var path = dir + "\\L" + l + "\\R" + r + "\\C" + c + ".png";

  fs.exists(path, function(exists) {
    if (exists) {
      fs.createReadStream(path).pipe(res);
    } else {
      fs.createReadStream(dir + "\\" + "none.png").pipe(res);
    }
  });
});

function getTile(layer, req, res) {
  var query = req.query;
  var none = "E:\\arcgisserver\\directories\\arcgiscache";
  var l = query.l;
  var r = query.r;
  var c = query.c;
  var tilePath =
    "E:\\arcgisserver\\directories\\arcgiscache\\" +
    layer +
    "\\Layers\\_alllayers";

  if (isNaN(parseInt(c))) {
    fs.createReadStream(none + "\\" + "none.png").pipe(res);
  }

  if (isNaN(parseInt(r))) {
    fs.createReadStream(none + "\\" + "none.png").pipe(res);
  }

  if (isNaN(parseInt(l))) {
    fs.createReadStream(none + "\\" + "none.png").pipe(res);
  }

  if (l.length == 1) {
    L = "L0" + l;
  } else {
    L = "L" + l;
  }

  var row = parseInt(r);
  var col = parseInt(c);

  var rGroup = parseInt(row / 128) * 128;
  r = "0000" + rGroup.toString(16);
  r = r.substring(r.length - 4, r.length);
  R = "R" + r;

  var cGroup = parseInt(col / 128) * 128;
  c = "0000" + cGroup.toString(16);
  c = c.substring(c.length - 4, c.length);
  C = "C" + c;

  var BundleBase = tilePath + "\\" + L + "\\" + R + C;
  var bundleFile = BundleBase + ".bundle";
  var bundlxFile = BundleBase + ".bundlx";
  //读取文件
  fs.exists(bundleFile, function(exists) {
    if (exists) {
      var index = 128 * (col - cGroup) + (row - rGroup);
      var offset = 0;
      fs.open(bundlxFile, "r", function(err, fdx) {
        var buffer = new Buffer(5);
        //读取fd文件内容到buf缓存区
        var filepos = 16 + 5 * index;

        fs.read(fdx, buffer, 0, 5, filepos, function(err, bytesRead, buffer) {
          offset =
            parseInt(buffer[0] & 0xff) +
            parseInt(buffer[1] & 0xff) * 256 +
            parseInt(buffer[2] & 0xff) * 65536 +
            parseInt(buffer[3] & 0xff) * 16777216 +
            parseInt(buffer[4] & 0xff) * 4294967296;
          fs.open(bundleFile, "r", function(err, fde) {
            if (!(err === null)) {
              console.log(err);
            }
            var buf = new Buffer(4);
            //读取fd文件内容到buf缓存区
            var length = 0;
            fs.read(fde, buf, 0, 4, offset, function(err, bytesRead, buf) {
              if (!(err === null)) {
                console.log(err);
              }
              length =
                parseInt(buf[0] & 0xff) +
                parseInt(buf[1] & 0xff) * 256 +
                parseInt(buf[2] & 0xff) * 65536 +
                parseInt(buf[3] & 0xff) * 16777216;
              if (length > 0) {
                var opt = {
                  flags: "r",
                  encoding: null,
                  fd: null,
                  mode: 0666,
                  autoClose: true,
                  start: offset + 4,
                  end: offset + 4 + length
                };
                fs.createReadStream(bundleFile, opt).pipe(res);
              } else {
                fs.createReadStream(none + "\\" + "none.png").pipe(res);
              }
            });
          });
        });
      });
    } else {
      fs.createReadStream(none + "\\" + "none.png").pipe(res);
    }
  });
}

router.get("/river", function(req, res) {
  getTile("map_river", req, res);
});

for (var i = 0; i < 100; i++) {
  bagpipe.push(getTile, function() {
    // 异步回调执行
    //
  });
}

router.get("/point", function(req, res) {
  getTile("map_point", req, res);
});

router.get("/road", function(req, res) {
  bagpipe.push(getTile, "map_road", req, res, function() {});
});

router.get("/dt", function(req, res) {
  getTile("map_dt", req, res);
});

app.use(router);
var server = app.listen(8081, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log(" http://%s:%s", host, port);
});
