const express = require('express');
const fs = require('fs');
const app = express();

const rawFile = fs.readFileSync(__dirname + '/data.csv', 'utf-8');
const lines = rawFile.split('\n');
const violations = [];
const infractionsByViolation = {}

let violationGroupId = 1;
lines.forEach((line, i) => {
  const isHeaderLine = i === 0;
  if (isHeaderLine || line.length === 0) {
    return;
  }

  const linePieces = line.split(',');
  const infraction = {
    date: linePieces[0],
    product: linePieces[1],
    violation: linePieces[2],
    firm: linePieces[3]
  }

  violations.push(infraction);

  if (infractionsByViolation[infraction.violation] === undefined) {
    infractionsByViolation[infraction.violation] = {
      id: violationGroupId,
      violation: infraction.violation,
      infractions: [infraction]
    };
    violationGroupId = violationGroupId + 1;
  }
  else {
    infractionsByViolation[infraction.violation].infractions.push(infraction);
  }
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
    },
    {
      url: '/api/violations',
      description: 'Return a list of all the violations'
    },
    {
      url: '/api/violation/:id',
      description: 'Return all infractions of a specific violation'
    },
    {
      url: '/api/search?q={query}',
      description: 'Runs a search using the query to check product, firm, and violation. Supports skip and take.'
    }
  ]);
});

app.get('/api/search', (req, res) => {
  let output = violations.slice();

  if (req.query.q) {
    const query = req.query.q.toLowerCase()
    output = output.filter((x) => {
      return x.product.toLowerCase().indexOf(query) > -1 ||
        x.firm.toLowerCase().indexOf(query) > -1 ||
        x.violation.toLowerCase().indexOf(query) > -1
    });
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
    infractions: output
  })
})

app.get('/api/violation/:id', (req, res) => {
  let set;
  for (let key in infractionsByViolation) {
    if (infractionsByViolation[key].id == req.params.id) {
      set = infractionsByViolation[key];
      break;
    }
  }

  if (set === undefined) {
    res.sendStatus(404);
    return;
  }

  res.send({
    count: set.infractions.length,
    id: set.id,
    violation: set.violation,
    infractions: set.infractions
  })
});

app.get('/api/violations', (req, res) => {
  const list = [];
  for (let key in infractionsByViolation) {
    list.push({
      violation: key,
      id: infractionsByViolation[key].id,
      count: infractionsByViolation[key].infractions.length
    })
  }
  res.send({
    count: list.length,
    violations: list
  });
});

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
