/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        stripBanners: true
      },
      css: {
        src: 'public/assets/css/**/**.css',
        dest: 'public/assets/build/pre-build.css'
      }
    },
    cssmin: {
      css: {
        src: '<%= concat.css.dest %>',
        dest: 'public/assets/build/build.css'
      }
    },
    ngmin: {
      ng: {
        src: 'public/assets/app/**/*.js',
        dest: 'public/assets/build/pre-build.js'
      }
    },
    uglify: {
      ng: {
        options: {
          mangle: false
        },
        src: '<%= ngmin.ng.dest %>',
        dest: 'public/assets/build/build.js'
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['default']
      },
      ng: {
        files: '<%= ngmin.ng.src %>',
        tasks: ['ngmin', 'uglify']
      },
      css: {
        files: '<%= concat.css.src %>',
        tasks: ['concat', 'cssmin']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-ngmin');

  // Default task.
  grunt.registerTask('default', ['ngmin', 'uglify', 'concat', 'cssmin']);

};
