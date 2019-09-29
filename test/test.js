'use strict';

const fs = require('fs');

global.almostEqual = function( a, b, epsilon )
{
    return Math.abs( a - b ) < epsilon;
}

describe( 'Tests', ( done ) =>
{
    var files = fs.readdirSync( __dirname + '/tests' );

    for( let file of files )
    {
        //if( !file.match(/.js$/) || ![ 'max.js', 'min.js', 'cnt.js', 'sum.js', 'avg.js', 'mdn.js' ].includes( file )){ continue; }
        //if( !file.match(/.js$/) || ![ 'mdn.js' ].includes( file )){ continue; }
        if( !file.match(/.js$/) || [ 'performance.js' ].includes( file )){ continue; }
        //if( !file.match(/.js$/)){ continue; }

        describe( file, () =>
        {
            require( __dirname + '/tests/' + file );
        });
    }
});
