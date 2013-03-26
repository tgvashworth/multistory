var fs = require('fs'),
    _ = require('underscore');

var file = fs.readFileSync(process.argv[2], {encoding: 'utf8'});

var lines = file.split('\n'),
    groups = {},
    groupname = 'icebox';

lines.forEach(function (line, index) {

  if (line.match('---')) {
    groupname = lines[index - 1].trim().toLowerCase();
    if (!groups[groupname]) groups[groupname] = [];
  }

  var res = line.match(/([A-Z\s']+)[A-Za-z\s.,!']([A-Z\s']+)[A-Za-z\s.,!']([A-Z\s']+)/g);

  if (!res) return;

  var cleaned = res.map(function (segment, index) {
    var str = (segment || '')
                .replace(',', '')
                .replace(/as a/i, '')
                .trim();
    if (index === 0) str = str.replace(' I', '').trim();
    return str.toLowerCase();
  });


  cleaned = cleaned.slice(0,2).concat(cleaned.slice(2).join(' '));

  groups[groupname].push(_.object(['who', 'what', 'why'], cleaned));

});

console.log(groups);