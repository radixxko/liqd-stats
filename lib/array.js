module.exports.SparseBuckets = class SparseBuckets extends Array
{
    constructor( default_getter, starting_bucket_size = 10, max_bucket_count = 100, ...args )
    {
        super( ...args );

        this.bucket_size = starting_bucket_size;

        this._default_getter = default_getter;
        this.indexes = [];
        this.max_size = max_bucket_count;
        this.middle = undefined;
        this.recalculate_rate = 2;
    }

    index( value ) // < middle-2**31 --- middle + 2**31 > ==>> 0,2**32-2
    {
        return value >= this.middle ? 2 * Math.floor( ( value - this.middle ) / this.bucket_size ) : -2 * Math.floor( ( value - this.middle ) / this.bucket_size ) - 1 ;
    }

    init( value )
    {
        if(this.middle === undefined)
        {
            this.middle = Math.sign(value) * Math.max(this.recalculate_rate ** Math.floor( Math.log( Math.abs(value) ) / Math.log(this.recalculate_rate) ),this.bucket_size);
        }

        let index = this.index( value );
        while( index > 2**32 - 2 )
        {
            this.recalculate(); index = this.index( value );
        }

        this.indexes.push( index ); // TODO sort indexes by value to increase performance

        let range = this._get_range( index );
        this[ index ] = this._default_getter( ...range );

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

    _get_range( index )
    {
        let from = this.middle,
            to   = this.middle;
        switch ( index % 2 )
        {
            case 0:
                from += ( index / 2 ) * this.bucket_size;
                to   += ( index / 2 + 1 ) * this.bucket_size;
                break;
            case 1:
                from -= ( index + 1 ) * this.bucket_size / 2;
                to   -= ( index - 1 ) * this.bucket_size / 2;
        }
        return [from, to];
    }

    recalculate()
    {
        let old_buckets = new Array(/* this.indexes.length */), idx; this.bucket_size *= this.recalculate_rate;

        for( let index of this.indexes )
        {
            old_buckets.push( this[index] );
            this[index] = undefined; // TODO test what delete this[index] does for array
        }

        this.indexes = [];

        for( let bucket of old_buckets )
        {
            idx = this.index(( bucket.from + bucket.to ) / 2 );
            let range = this._get_range(idx);
            this[ idx ] = this._default_getter( ...range, bucket, this[idx] || !this.indexes.push( idx ));
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
