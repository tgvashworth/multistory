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
// Clean up a string
// ==================================
.filter('parseCapitalize', function () {
  return function (text) {
    return text.replace(/\b([a-z]{2,}|i)\b/g, function (match) {
      return match.substr(0, 1).toUpperCase() + match.substr(1);
    });
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
        groupname = 'icebox';

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
        groups[groupname].$key = $filter('parseCapitalize')(groupname);
        sections.push(groups[groupname]);
      }

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
      var story = {
        who: cleaned[0],
        what: cleaned[1],
        why: cleaned[2],
        sizes: cleanedSizes,
        raw: line
      };

      groups[groupname].push(story);

    });

    return sections;

  };

})

;