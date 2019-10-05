module.exports.SparseBuckets = class SparseBuckets extends Array
{
    constructor( default_getter, merge_func, starting_bucket_size = 10, max_bucket_count = 100, ...args )
    {
        super( ...args );

        this.bucket_size = starting_bucket_size;

        this._default_getter = default_getter;
        this.indexes = [];
        this.max_size = max_bucket_count;

        this._merge_func = merge_func;


    }

    index( value ) // 0 - 2**32-2
    {
        return Math.floor( value / this.bucket_size );
    }

    init( value )
    {
        let index = this.index( value );

        this.indexes.push( index ); // TODO sort indexes by value to increase performance

        this[ index ] = this._default_getter( index * this.bucket_size, ( index + 1 ) * this.bucket_size );

        if(this.indexes.length > this.max_size)
        {
            this.recalculate()
            index = Math.floor( index / 2 );
        }

        return this[ index ];
    }

    values()
    {
        return this.indexes.map( i => this[ i ]);
    }

    recalculate()
    {
        let new_array = [];

        for(let index of this.indexes)
        {
            if( new_array[ Math.floor( index / 2 ) ] )
            {
                new_array[ Math.floor( index / 2 ) ] = this._merge_func( new_array[ Math.floor( index / 2 ) ], this[index] )
            }
            else
            {
                let from = this[index].from,
                    to   = this[index].to;

                new_array[ Math.floor( index / 2 ) ] = this._merge_func( this[index],
                    {
                        from :  (index % 2 === 0) ? to : from - this.bucket_size,
                        to   :  (index % 2 === 0) ? to + this.bucket_size : from,
                        min  :  Infinity,
                        max  : -Infinity,
                        cnt  :  0,
                        sum  :  0
                    });
            }
            delete this[index];
        }

        for(let i = 0; i < this.indexes.length; ++i)
        {
            this.indexes[i] = Math.floor( this.indexes[i] / 2 );
        }

        this.indexes = this.indexes.filter( (item, index) => this.indexes.indexOf(item) === index );

        for(let index of this.indexes)
        {
            this[index] = new_array[index];
        }

        this.bucket_size *= 2;
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

                    if( index <= target.index - target.segment.length )
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
