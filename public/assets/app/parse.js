angular.module('ms-parse', [])

// ==================================
// Clean up a string
// ==================================
.factory('parseClean', function () {
  return function (text) {
    text = text || '';
    return text.trim().toLowerCase();
  };
})

// ==================================
// The big daddy regex
// ==================================
.factory('parseRegex', function () {
  return (/([A-Z\s'\(\)\&]+)[A-Za-z\s.,!']([A-Z\s'\(\)\&]+)[A-Za-z\s.,!']([A-Z\s'\(\)\&]+)/g);
})

// ==================================
// Parse the raw user stories file
// ==================================
.factory('parse', function (parseClean, parseRegex, $filter) {

  return function (raw) {
    raw = raw || '';

    var lines = raw.split('\n'),
        sections = [],
        groups = {},
        groupname = 'icebox',
        lastStory = {};

    // Iterate over the lines, extracting stories as we go
    lines.forEach(function (line, index) {

      var cleanedSizes = [];

      // Extract group headings
      if (line.match('---')) {
        groupname = parseClean(lines[index - 1]);
      } else if (line.match(/^#+\s/)) {
        groupname = parseClean(line);
      }

      // If this a new group create it, and push a reference onto the sections
      // array so we maintain the order in the storied file
      if (!groups[groupname]) {
        groups[groupname] = [];
        groups[groupname].$key = $filter('capitalize')(groupname);
        sections.push(groups[groupname]);
      }


      // Extract subitems
      if (line.match(/^\s+/)) {
        var subitem = line.trim().replace(/^-/, '');
        return lastStory.subitems.push(subitem);
      }

      line = line.trim().replace(/^-/, '');

      // Match the line!
      var res = line.match(parseRegex),
          sizes = line.match(/\[.+?\]/g);

      if (!res) return;

      if (sizes) {
        cleanedSizes = sizes.map(function (segment) {
          return segment
                  .replace('[', '')
                  .replace(']', '');
        });
      }

      // Clean the segments up, to account for a poorish regex
      var cleaned = res.map(function (segment, index) {
        var str = (segment || '')
                    .replace(',', '')
                    .replace(/as a/i, '')
                    .trim();
        if (index === 0) str = str.replace(/ i/i, '');
        return parseClean(str);
      });

      cleaned = cleaned.slice(0,2).concat(cleaned.slice(2).join(' '));

      // Build the story object
      lastStory = {
        who: cleaned[0],
        what: cleaned[1],
        why: cleaned[2],
        sizes: cleanedSizes,
        raw: line,
        subitems: []
      };

      groups[groupname].push(lastStory);

    });

    return sections;

  };

})

;