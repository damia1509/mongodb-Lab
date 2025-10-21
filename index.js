const { MongoClient } = require('mongodb');

//TASK 1 Define Drivers as a JavaScript Variable
console.log("TASK 1 Define Drivers Array");

const drivers = [
    {
        name: "John Doe",
        vehicleType: "Sedan",
        isAvailable: true,
        rating: 4.8
    },
    {
        name: "Alice Smith",
        vehicleType: "SUV",
        isAvailable: false,
        rating: 4.5
    }
];

// Show data in console
console.log("Drivers Array:");
console.log(drivers);

//TASK 2 JSON Data Operations
console.log("\nTASK 2 JSON Data Operations");

// 1. Read and display all drivers' names using forEach
console.log("All drivers names:");
drivers.forEach((driver) => {
    console.log(`- {driver.name}`);
});

// 2. Add a new driver directly in the array using push
console.log("\nAdding new driver");
drivers.push({
    name: "Bob Johnson",
    vehicleType: "Van",
    isAvailable: true,
    rating: 4.9
});

console.log("Updated Drivers Array after adding Bob Johnson:");
console.log(drivers);

console.log("\nAll drivers names after update:");
drivers.forEach((driver) => {
    console.log(`- {driver.name}`);
});

//TASK 3, 4, 5 MongoDB Operations
async function main() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("\nConnected to MongoDB!");

        const db = client.db("testDB");
        const driversCollection = db.collection("drivers");

        // Clear existing data for clean testing
        await driversCollection.deleteMany({});
        console.log("Cleared existing drivers collection");

        //TASK 3 Insert Drivers into MongoDB
        console.log("\nTASK 3 Insert Drivers into MongoDB");
        
        console.log("Inserting drivers into MongoDB");
        
        // Insert each driver one by one
        for (const driver of drivers) {
            const result = await driversCollection.insertOne(driver);
            console.log(`New driver created: ${driver.name} with ID: ${result.insertedId}`);
        }

        // Verify insertion by counting documents
        const totalDrivers = await driversCollection.countDocuments();
        console.log(`Total drivers in database: {totalDrivers}`);

        // Display all inserted drivers
        const allDrivers = await driversCollection.find({}).toArray();
        console.log("\nAll drivers in MongoDB:");
        allDrivers.forEach(driver => {
            console.log(` - {driver.name} ({driver.vehicleType}): Rating {driver.rating}, Available: {driver.isAvailable}`);
        });

        //TASK 4 Query Available Drivers
        console.log("\nTASK 4 Query Available Drivers");
        
        // Find all available drivers with rating >= 4.5
        const availableDrivers = await driversCollection.find({
            isAvailable: true,
            rating: { $gte: 4.5 }
        }).toArray();
        
        console.log("Available drivers with rating >= 4.5:");
        if (availableDrivers.length > 0) {
            availableDrivers.forEach(driver => {
                console.log(`   - {driver.name} ({driver.vehicleType}): Rating {driver.rating}, Available: {driver.isAvailable}`);
            });
        } else {
            console.log("No available drivers found");
        }

        console.log(`\nQuery Results: Found {availableDrivers.length} available driver(s) with rating >= 4.5`);

        //TASK 5: Update John Doe's Rating
        console.log("\n TASK 5: Update John Doe's Rating");
        
        // Show current state before update
        console.log("Current state - John Doe's rating:");
        const johnBefore = await driversCollection.findOne({ name: "John Doe" });
        console.log(`   - Before: {johnBefore.rating}`);

        // Increase John Doe's rating by 0.1
        const updateResult = await driversCollection.updateOne(
            { name: "John Doe" },
            { $inc: { rating: 0.1 } }
        );
        
        console.log(` Update result: {updateResult.matchedCount} matched, {updateResult.modifiedCount} modified`);

        // Verify the update
        const johnAfter = await driversCollection.findOne({ name: "John Doe" });
        console.log(`   - After: {johnAfter.rating}`);

        console.log(`John Doe's rating updated: {johnBefore.rating} → {johnAfter.rating}`);

        // Show final state of all drivers
        console.log("\nFinal drivers state after Task 5:");
        const finalDrivers = await driversCollection.find({}).toArray();
        finalDrivers.forEach(driver => {
            console.log(`   - {driver.name}: Rating {driver.rating}, Available: {driver.isAvailable}`);
        });

        console.log("\nALL TASKS COMPLETED SUCCESSFULLY!");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
        console.log("MongoDB connection closed");
    }
}

// Run the main function
main().catch(console.error);