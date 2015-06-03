module.exports = function(grunt) {
    grunt.initConfig({
      nggettext_extract: {
        pot: {
          files: {
            ' www/translations/source/application.pot': ['www/templates/*.html']
          }
        },
      },
        'nggettext_compile': {
            all: {
                files: {
                    ' www/translations/scripts/translations.js': ['www/translations/lang/*.po']
                }
            }
        },
    })
    grunt.loadNpmTasks('grunt-angular-gettext');

    grunt.registerTask('extract', ['nggettext_extract']);
    grunt.registerTask('compile', ['nggettext_compile']);
}
