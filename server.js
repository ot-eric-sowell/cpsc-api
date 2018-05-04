const express = require('express');
const fs = require('fs');
const app = express();

const rawFile = fs.readFileSync(__dirname + '/data.csv', 'utf-8');
const lines = rawFile.split('\n');
const violations = [];

lines.forEach((line, i) => {
  const isHeaderLine = i === 0;
  if (isHeaderLine || line.length === 0) {
    return;
  }

  const linePieces = line.split(',');
  violations.push({
    date: linePieces[0],
    product: linePieces[1],
    violation: linePieces[2],
    firm: linePieces[3]
  });
});

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(allowCrossDomain);

app.get('/', (req, res) => {
  res.send([
    {
      url: '/api',
      description: 'Return all violations.'
    },
    {
      url: '/api?product=xyz',
      description: 'Return violations whose product names contain the text "xyz".'
    },
    {
      url: '/api?skip=10&take=5',
      description: 'Skip 10 violations and return the next 5.'
    }
  ]);
})

app.get('/api', (req, res) => {

  let output = violations.slice();

  if (req.query.product) {
    output = output.filter((x) => x.product.toLowerCase().indexOf(req.query.product.toLowerCase()) > -1);
  }

  const total = output.length;

  if (req.query.skip) {
    output.splice(0, req.query.skip)
  }

  if (req.query.take) {
    output = output.splice(0, req.query.take)
  }

  res.send({
    total: total,
    violations: output
  })
})




const port = process.env.PORT || 4001;
app.listen(port, () => console.log(`Listening on port ${port}`))
