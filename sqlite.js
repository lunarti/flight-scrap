// database.js

import sqlite3 from "sqlite3";

// Connect to the SQLite database
function dbConn() {
  const db = new sqlite3.Database('flights.db');
  return db;
}

// Function to create flights table if it doesn't exist
function createFlightsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS flights (
      id INTEGER PRIMARY KEY,
      pricePerPassenger INT,
      totalCost INT,
      outboundAirline TEXT,
      outboundDepartureAirport TEXT,
      outboundDepartureTime TEXT,
      outboundArrivalAirport TEXT,
      outboundArrivalTime TEXT,
      outboundDuration TEXT,
      returnAirline TEXT,
      returnDepartureAirport TEXT,
      returnDepartureTime TEXT,
      returnArrivalAirport TEXT,
      returnArrivalTime TEXT,
      returnDuration TEXT
    )
  `;

  const db = dbConn();
  return new Promise((resolve, reject) => {
    db.run(sql, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
    });
  });
}

// Function to insert flight data into the database
const insertFlight = (flightData) => {
  const {
    pricePerPassenger, totalCost, outboundAirline, outboundDepartureAirport,
    outboundDepartureTime, outboundArrivalAirport, outboundArrivalTime,
    outboundDuration, returnAirline, returnDepartureAirport, returnDepartureTime,
    returnArrivalAirport, returnArrivalTime, returnDuration
  } = flightData;

  const sql = `
    INSERT INTO flights (
      pricePerPassenger, totalCost, outboundAirline, outboundDepartureAirport,
      outboundDepartureTime, outboundArrivalAirport, outboundArrivalTime,
      outboundDuration, returnAirline, returnDepartureAirport, returnDepartureTime,
      returnArrivalAirport, returnArrivalTime, returnDuration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    pricePerPassenger, totalCost, outboundAirline, outboundDepartureAirport,
    outboundDepartureTime, outboundArrivalAirport, outboundArrivalTime,
    outboundDuration, returnAirline, returnDepartureAirport, returnDepartureTime,
    returnArrivalAirport, returnArrivalTime, returnDuration
  ];

  const db = dbConn();
  return new Promise((resolve, reject) => {
    db.run(sql, values, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve({ id: this.lastID });
      }
    });
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
    });
  });
}

const getFlightWithMinTotalValueForDepartures = (outboundDepartureAirport, returnDepartureAirport) => {

  const query = `
  SELECT * FROM flights 
  WHERE outboundDepartureAirport = ? AND returnDepartureAirport = ?
  ORDER BY totalCost LIMIT 1;
  `;
  
  const db = dbConn();
  return new Promise((resolve, reject) => {
    db.get(query, [outboundDepartureAirport, returnDepartureAirport], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
    });
  });
};

const getAverageTotalCostForDepartures = (outboundDepartureAirport, returnDepartureAirport) => {
  // Prepare SQL query to calculate average total cost
  const sql = `
    SELECT AVG(totalCost) AS averageTotalCost
    FROM flights
    WHERE outboundDepartureAirport = ? AND returnDepartureAirport = ?
  `;

  const db = dbConn();
  return new Promise((resolve, reject) => {
    // Execute the SQL query with the provided parameters
    db.get(sql, [outboundDepartureAirport, returnDepartureAirport], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.averageTotalCost);
      }
    });

    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
    });
  });
}

export { createFlightsTable, insertFlight, getFlightWithMinTotalValueForDepartures, getAverageTotalCostForDepartures };
