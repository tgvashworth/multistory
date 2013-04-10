/*global module:false*/
module.exports = function(grunt) {

  grunt.initConfig({
    // CSS concatenation
    concat: {
      options: {
        stripBanners: true
      },
      css: {
        src: 'public/assets/css/**/**.css',
        dest: 'public/assets/build/build.css'
      }
    },
    // CSS minification
    cssmin: {
      css: {
        src: '<%= concat.css.dest %>',
        dest: '<%= concat.css.dest %>'
      }
    },
    // Prepare Angular code for minification
    ngmin: {
      ng: {
        src: 'public/assets/app/**/*.js',
        dest: 'public/assets/build/build.js'
      }
    },
    // Minify JS. No mangling. Right now, Angular no likey
    uglify: {
      ng: {
        options: {
          mangle: false
        },
        src: '<%= ngmin.ng.dest %>',
        dest: '<%= ngmin.ng.dest %>'
      }
    },
    // Tests, if we had em
    qunit: {
      files: ['test/**/*.html']
    },
    // Watch task
    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['default']
      },
      ng: {
        files: '<%= ngmin.ng.src %>',
        tasks: ['ngmin']
      },
      css: {
        files: '<%= concat.css.src %>',
        tasks: ['concat']
      }
    }
  });

  // Task plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-ngmin');

  // Tasks
  grunt.registerTask('default', ['ngmin', 'concat']);
  grunt.registerTask('heroku', ['ngmin', 'uglify', 'concat', 'cssmin']);

};
