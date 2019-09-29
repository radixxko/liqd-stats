module.exports.SparseBuckets = class SparseBuckets extends Array
{
    constructor( default_getter, merge_func, ...args )
    {
        super( ...args );

        this.bucket_size = 10;

        this._default_getter = default_getter;
        this.indexes = [];
        this.max_size = 100;

        this._merge_func = merge_func;


    }

    index( value ) // 0 - 2**32-2
    {
        return Math.floor( value / this.bucket_size );
    }

    init( value )
    {

        if(this.indexes.length > this.max_size)
        {
          this.recalculate()
        }

        let index = this.index( value );

        this.indexes.push( index ); // TODO sort indexes by value to increase performance

        return this[ index ] = this._default_getter( index * this.bucket_size, ( index + 1 ) * this.bucket_size );
    }

    values()
    {
        return this.indexes.map( i => this[ i ]);
    }

    recalculate()
    {
        let indexes = this.indexes;
        indexes.sort( (a,b) => a - b );
        for(let i = 0; i < indexes.length - 1; i++)
        {
            if( indexes[ i ] + 1 === indexes[ i+1 ] && this[ indexes[ i+1 ] ] !== undefined)
            {
              //console.log(i);
              //console.log(this[ indexes[ i ] ], this[ indexes[ i+1 ] ]);
              this[ indexes[ i ] ] = this._merge_func( this[ indexes[ i ] ], this[ indexes[ i+1 ] ]);
              delete this[ indexes[ i+1 ] ];
              indexes.splice( i+1, 1 );
            }
        }
        this.bucket_size *= 2
    }
};

module.exports.ArraySegment = new Proxy( Object,
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
