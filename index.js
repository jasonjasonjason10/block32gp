require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(require("morgan")("dev"));
app.use(express.json());

//READ
app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        select * from notes ORDER BY created_at DESC
        `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//CREATE
app.post("/api/notes", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
            INSERT INTO notes(txt, ranking)
            VALUES($1, $2)
            RETURNING *
        `;

    const response = await client.query(SQL, [req.body.txt, req.body.ranking]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//UPDATE
app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        UPDATE notes
        SET txt=$1, ranking=$2, updated_at=now()
        WHERE id = $3
        RETURNING *
        `;

    const response = await client.query(SQL, [req.body.txt, req.body.ranking, req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE
app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE FROM notes WHERE id = $1
        `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to database");

  let SQL = /* sql */ `
    DROP TABLE IF EXISTS notes;
    CREATE TABLE notes(
        id SERIAL PRIMARY KEY,
        txt VARCHAR(255) NOT NULL,
        ranking INTEGER DEFAULT 3 NOT NULL, 
        created_at TIMESTAMP DEFAULT now(), 
        updated_at TIMESTAMP DEFAULT now()
    );
  `;
  await client.query(SQL);
  console.log("tables created");

  SQL = /* sql*/ `
        INSERT INTO notes(txt, ranking) VALUES('walk arthur', 4);
        INSERT INTO notes(txt) VALUES('learn SQL');    
        INSERT INTO notes(txt) VALUES('learn express routes');
        
        `;

  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();


//test