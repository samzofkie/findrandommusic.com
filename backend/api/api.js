import express from 'express';

const app = express();

app.get('/songs', (_, res) => {
  return res.status(200).json({
    status: 'OK'
  });
});

const port = 8080;
app.listen(port, () =>
  console.log(`Example app listening on port ${port}`)
);