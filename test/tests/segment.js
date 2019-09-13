const assert = require('assert');
const ArraySegment = require('../../lib/array_segment');

it('should return default initializer value on expired index', function()
{
    function initializer( index )
    {
        return (
        {
            start  :   index,
            min    :   Infinity,
            max    :   -Infinity,
            cnt    :   0,
            sum    :   0,
            sub    :   []
        });
    }

    let segment = new ArraySegment( 10, initializer );

    segment[0].cnt = 5;
    //segment[100];

    console.log( initializer(0), segment[0] );

    assert.deepStrictEqual( initializer(0), segment[0] );
});
