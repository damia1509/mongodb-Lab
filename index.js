const { MongoClient } = require('mongodb');

// Task 5: Update John Doe's Rating
async function task5() {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB for Task 5!");

        const db = client.db("testDB");
        const driversCollection = db.collection("drivers");

        // TASK 5 Update John Doe's Rating
        console.log("\nTASK 5: Update John Doe's Rating");
        
        // Show current state before update
        console.log("Current state - John Doe's rating:");
        const johnBefore = await driversCollection.findOne({ name: "John Doe" });
        console.log(`   - Before: ${johnBefore.rating}`);

        // Increase John Doe's rating by 0.1
        const updateResult = await driversCollection.updateOne(
            { name: "John Doe" },
            { $inc: { rating: 0.1 } }
        );
        
        console.log(`Update result: ${updateResult.matchedCount} matched, ${updateResult.modifiedCount} modified`);

        // Verify update
        const johnAfter = await driversCollection.findOne({ name: "John Doe" });
        console.log(`   - After: ${johnAfter.rating}`);

        console.log(`John Doe's rating updated: ${johnBefore.rating} → ${johnAfter.rating}`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.close();
        console.log("MongoDB connection closed for Task 5");
    }
}

// Run Task 5
task5().catch(console.error);