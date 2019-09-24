module.exports.SparseBuckets = class SparseBuckets extends Array
{
    constructor( default_getter, ...args )
    {
        super( ...args );

        this._default_getter = default_getter;
        this.indexes = [];
    }

    index( value ) // 0 - 2**32-2
    {
        return Math.floor( value / 10 );
    }

    init( value )
    {
        let index = this.index( value );

        this.indexes.push( index ); // TODO sort indexes by value to increase performance

        return this[ index ] = this._default_getter( index * 10, ( index + 1 ) * 10 );
    }

    values()
    {
        return this.indexes.map( i => this[ i ]);
    }
};

module.exports.ArraySegment = new Proxy( function(){},
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
                if( target.index == property )
                {
                    return target.segment[ target.index % target.segment.length ];
                }
                else
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

                            target.index = index;
                        }

                        return target.segment[ index % target.segment.length ];
                    }
                }
            }
        });
    }
});
