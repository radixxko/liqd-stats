const assert = require('assert');
const Stats = require('../../lib/stats');

const INTERVALS =
[
    100 + Math.ceil( Math.random() * 60 * 1000 ),
    200 + Math.ceil( Math.random() * 60 * 10000 ),
    50 + Math.ceil( Math.random() * 60 * 100 )
];
describe("Push to stats", () =>
{

  const RUNS = 100;
  it('not expired', function()
  {
      for( let run = 0; run < RUNS; ++run )
      {
          let stats = new Stats( INTERVALS ),
              start = Date.now(), time;

          for( time = start; time < start + INTERVALS[0]; time += Math.ceil( Math.random() * INTERVALS[0] / 10000 ))
          {
              let value = Math.random() * 100;

              stats.push( value, time );
          }
      }
  });

  it('expired', function()
  {
      for( let run = 0; run < RUNS; ++run )
      {
          let stats = new Stats( INTERVALS ),
              start = Date.now(), time;

          for( time = start; time < start + 5 * INTERVALS[0]; time += Math.ceil( Math.random() * INTERVALS[0] / 1000 ))
          {
              let value = Math.random() * 100;

              stats.push( value, time );
          }
      }
  });

  it('history', function()
  {
      for( let run = 0; run < RUNS; ++run )
      {
          let stats = new Stats( INTERVALS ),
              start = Date.now(), time;

          for( time = start; time < start + 5 * INTERVALS[0];
             time += Math.ceil( ( Math.random() - 0.3 ) * INTERVALS[0] / 100 ))
          {
              let value = Math.random() * 100;

              stats.push( value, time );
          }
      }
  });

});
