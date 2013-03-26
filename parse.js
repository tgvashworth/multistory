var fs = require('fs');

var file = fs.readFileSync(process.argv[2], {encoding: 'utf8'});

var lines = file.split('\n');

lines.forEach(function (line) {

  var res = line.match(/([A-Z\s_.,!"'\/$]{2,})[A-Za-z\s_.,!"'\/$]([A-Z\s_.,!"'\/$]{2,})[A-Za-z\s_.,!"'\/$]([A-Z\s_.,!"'\/$]{2,})/g);

  if (!res) return;

  var cleaned = res.map(function (segment, index) {
    var str = (segment || '').trim().replace(',', '');
    if (index === 0) str = str.replace(' I', '');
    return str.toLowerCase();
  });

  console.log(cleaned.join(' : '));

});