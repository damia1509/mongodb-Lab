const { MongoClient } = require('mongodb');

// Task 1 Define Drivers
const drivers = [
    {
        name: "john doe",
        vehicleType: "Sedan",
        isAvailable: true,
        rating: 4.8
    },
    {
        name: "alice smith",
        vehicleType: "SUV",
        isAvailable: false,
        rating: 4.5
    }
];

// Show data in console
console.log("Drivers Array:");
console.log(drivers);

// Optional print the array
console.log("\nFormatted Drivers Data:");
console.log(JSON.stringify(drivers, null, 2));

async function main() {
  // Replace <connection-string> with your MongoDB URI
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db("testDB");
    const collection = db.collection("users");

    // Insert a document
    await collection.insertOne({ name: "Damia", age: 23 });
    console.log("Document inserted!");

    // Query the document
    const result = await collection.findOne({ name: "Damia" });
    console.log("Query result:", result);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

main();