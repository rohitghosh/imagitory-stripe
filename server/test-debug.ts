#!/usr/bin/env node

/**
 * Test script to debug book retrieval and imageJobs issue
 * Run with: npm run build && node dist/test-book-debug.js
 */

import { getFirestore } from "firebase-admin/firestore";
import admin from "./firebaseAdmin";

// Test data from your Firebase screenshot
const TEST_BOOK_ID = "oiJi2odR5t2UsksxHCzD";
const TEST_JOB_ID = "job_1756760589384_grdatysfn";

async function testBookRetrieval() {
  console.log("🔍 Testing book retrieval for debugging imageJobs issue");
  console.log("=".repeat(60));

  try {
    // Check if Firebase is already initialized in the admin module
    console.log("Firebase apps length:", admin.apps.length);

    const db = getFirestore();
    console.log("✅ Firebase initialized successfully");

    // Test 1: Direct Firestore query
    console.log("\n📋 Test 1: Direct Firestore document retrieval");
    console.log(`Book ID: ${TEST_BOOK_ID}`);
    console.log(`Job ID: ${TEST_JOB_ID}`);

    const bookRef = db.collection("books").doc(TEST_BOOK_ID);
    const bookDoc = await bookRef.get();

    if (!bookDoc.exists) {
      console.log("❌ Book document not found");
      return;
    }

    console.log("✅ Book document exists");

    // Test 2: Raw data inspection
    console.log("\n📋 Test 2: Raw Firestore data inspection");
    const rawData = bookDoc.data();

    console.log(`Raw data type: ${typeof rawData}`);
    console.log(`Raw data is null: ${rawData === null}`);
    console.log(`Raw data is undefined: ${rawData === undefined}`);

    if (rawData) {
      const topLevelKeys = Object.keys(rawData);
      console.log(`Top-level fields: ${topLevelKeys.join(", ")}`);
      console.log(`Has imageJobs field: ${!!rawData.imageJobs}`);

      if (rawData.imageJobs) {
        console.log(`imageJobs type: ${typeof rawData.imageJobs}`);
        console.log(
          `imageJobs is object: ${typeof rawData.imageJobs === "object"}`,
        );
        console.log(
          `imageJobs keys: ${Object.keys(rawData.imageJobs).join(", ")}`,
        );
        console.log(`Target job exists: ${!!rawData.imageJobs[TEST_JOB_ID]}`);

        if (rawData.imageJobs[TEST_JOB_ID]) {
          const job = rawData.imageJobs[TEST_JOB_ID];
          console.log(`Job status: ${job.status}`);
          console.log(`Job provider: ${job.provider}`);
          console.log(`Job has artifacts: ${!!job.artifacts}`);
        }
      } else {
        console.log("❌ No imageJobs field in raw data");

        // Check if there's a field with similar name
        const possibleKeys = topLevelKeys.filter(
          (key) =>
            key.toLowerCase().includes("image") ||
            key.toLowerCase().includes("job"),
        );
        console.log(
          `Possible image/job related keys: ${possibleKeys.join(", ")}`,
        );
      }
    }

    // Test 3: Simulate storage.getBookById() logic
    console.log("\n📋 Test 3: Simulate getBookById() processing");
    const simulatedBookData = { id: bookDoc.id, ...rawData };

    console.log(`After spread operation:`);
    console.log(`- Has imageJobs: ${!!simulatedBookData.imageJobs}`);
    console.log(`- imageJobs type: ${typeof simulatedBookData.imageJobs}`);

    if (simulatedBookData.imageJobs) {
      console.log(
        `- imageJobs keys: ${Object.keys(simulatedBookData.imageJobs).join(", ")}`,
      );
      console.log(
        `- Target job exists: ${!!simulatedBookData.imageJobs[TEST_JOB_ID]}`,
      );
    }

    // Test 4: Direct job lookup simulation
    console.log("\n📋 Test 4: Direct job lookup simulation");
    const jobLookupResult = simulatedBookData?.imageJobs?.[TEST_JOB_ID] || null;

    console.log(
      `Job lookup result: ${jobLookupResult ? "FOUND" : "NOT FOUND"}`,
    );

    if (jobLookupResult) {
      console.log(`✅ Job found successfully!`);
      console.log(`Job details:`);
      console.log(`- Status: ${jobLookupResult.status}`);
      console.log(`- Provider: ${jobLookupResult.provider}`);
      console.log(`- Model: ${jobLookupResult.model}`);
      console.log(`- Created: ${jobLookupResult.createdAt}`);
    } else {
      console.log(`❌ Job NOT found - this is the problem!`);
    }

    // Test 5: Check actual storage.getBookById implementation
    console.log("\n📋 Test 5: Test actual storage.getBookById implementation");

    // Import the actual storage
    const { storage } = await import("./storage");
    const bookFromStorage = await storage.getBookById(TEST_BOOK_ID);

    console.log(`Storage result: ${bookFromStorage ? "FOUND" : "NOT FOUND"}`);

    if (bookFromStorage) {
      console.log(
        `Storage book has imageJobs: ${!!(bookFromStorage as any).imageJobs}`,
      );

      if ((bookFromStorage as any).imageJobs) {
        const imageJobsKeys = Object.keys((bookFromStorage as any).imageJobs);
        console.log(`Storage imageJobs keys: ${imageJobsKeys.join(", ")}`);
        console.log(
          `Storage has target job: ${!!(bookFromStorage as any).imageJobs[TEST_JOB_ID]}`,
        );
      }
    }

    console.log("\n🎯 Summary:");
    console.log("=".repeat(60));

    if (
      jobLookupResult ||
      (bookFromStorage && (bookFromStorage as any).imageJobs?.[TEST_JOB_ID])
    ) {
      console.log("✅ SUCCESS: Job was found using one or more methods");
      console.log("The issue might be elsewhere in the code flow");
    } else {
      console.log("❌ PROBLEM: Job was NOT found despite existing in Firebase");
      console.log(
        "This confirms there's an issue with data retrieval or processing",
      );

      if (rawData?.imageJobs?.[TEST_JOB_ID]) {
        console.log(
          "💡 The job exists in raw data but gets lost during processing",
        );
      } else {
        console.log(
          "💡 The job doesn't exist in the raw data - wrong document or collection?",
        );
      }
    }
  } catch (error: any) {
    console.error("💥 Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
testBookRetrieval()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
