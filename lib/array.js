module.exports.SparseBuckets = class SparseBuckets extends Array
{
    constructor( default_getter, starting_bucket_size = 10, max_bucket_count = 100, ...args )
    {
        super( ...args );

        this.bucket_size = starting_bucket_size;

        this._default_getter = default_getter;
        this.indexes = [];
        this.max_size = max_bucket_count;
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

        if( this.indexes.length > this.max_size )
        {
            this.recalculate(); index = this.index( value );
        }

        return this[ index ];
    }

    values( )
    {
        return this.indexes.map( i => this[ i ]);
    }

    recalculate()
    {
        let old_buckets = new Array(/* this.indexes.length */), idx; this.bucket_size *= 2;

        for( let index of this.indexes )
        {
            old_buckets.push( this[index] );
            this[index] = undefined; // TODO test what delete this[index] does for array
        }

        this.indexes = [];

        for( let bucket of old_buckets )
        {
            this[ idx = this.index(( bucket.from + bucket.to ) / 2 )] = this._default_getter( idx * this.bucket_size, ( idx + 1 ) * this.bucket_size, bucket, this[idx] || !this.indexes.push( idx ));
        }
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
