module.exports = new Proxy( function(){},
{
    construct( target, args )
    {
        return new Proxy(
        {
            segment     : new Array( args[0] ),
            initializer : args[1],
            index       : -1
        },
        {
            get: function( target, property )
            {
                let index = parseInt( property );

                if( index < target.index - target.segment.length )
                {
                    return target.initializer( index );
                }
                else
                {
                    if( index > target.index )
                    {
                        for( let i = Math.max( index - target.segment.length, target.index + 1 ); i <= index; ++i )
                        {
                            target.segment[ i % target.segment.length ] = target.initializer( i );
                        }
                    }

                    return target.segment[ index % target.segment.length ];
                }
            }
        });
    }
});
