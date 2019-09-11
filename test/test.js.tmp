'use strict';
const fs = require('fs');

describe( 'Tests', ( done ) =>
{
    var files = fs.readdirSync( dirname + '/tests' );

    for( let file of files )
    {
        if( !file.match(/.js$/) ){ continue; }

        describe( file, () =>
        {
            require( dirname + '/tests/' + file );
        });
    }
});
