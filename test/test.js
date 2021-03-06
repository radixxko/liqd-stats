'use strict';

const fs = require('fs');

global.almostEqual = function( a, b, epsilon = 0.000001 )
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
        //if( !file.match(/.js$/) || ['empty.js', 'performance.js', 'not_expired.js', 'expired.js'].includes( file )){ continue; }
        if( !file.match(/.js$/)){ continue; }

        describe( file, () =>
        {
            require( __dirname + '/tests/' + file );
        });
    }
});
