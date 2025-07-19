import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  runStoryValidation,
  StoryValidationInput,
  StoryValidationInputwoChar,
  ProgressCallback,
  ValidationFailure,
} from "./generate"; // Imports the function from your existing file

// Define a simple progress logger for the console
const logProgress: ProgressCallback = (phase, pct, message) => {
  console.log(`  [${phase.toUpperCase()}] ${pct}%: ${message}`);
};

// Main function to run the tests
async function testValidationSuite() {
  console.log("🚀 Starting Story Validation Test Suite...");
  console.log("========================================");

  // 1. Read test data from the JSON file
  // const testDataPath = path.resolve(__dirname, "test-data.json");
  // --- Start of replacement code ---

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const testDataPath = path.resolve(__dirname, "test-data.json");
  // --- End of replacement code ---

  if (!fs.existsSync(testDataPath)) {
    console.error(`❌ Error: Test data file not found at ${testDataPath}`);
    return;
  }

  const testCases: {
    testName: string;
    input: StoryValidationInput | StoryValidationInputwoChar;
  }[] = JSON.parse(fs.readFileSync(testDataPath, "utf-8"));

  // 2. Loop through each test case and run the validation
  for (const [index, testCase] of testCases.entries()) {
    console.log(
      `\n--- Running Test ${index + 1}/${testCases.length}: "${testCase.testName}" ---`,
    );
    try {
      // Call the validation function from generate.ts
      const failures: ValidationFailure[] = await runStoryValidation(
        testCase.input,
        logProgress,
      );

      // 3. Log the results
      if (failures.length === 0) {
        console.log("✅ RESULT: Validation Passed! No issues found.");
      } else {
        console.log(
          `❌ RESULT: Validation FAILED with ${failures.length} issue(s):`,
        );
        failures.forEach((failure, f_index) => {
          console.log(`\n  [Failure ${f_index + 1}]`);
          console.log(`  - Check: ${failure.check}`);
          console.log(`  - Problem: ${failure.problem}`);
          console.log(`  - Suggested Solutions:`);
          failure.solution.forEach((sol) => console.log(`    * ${sol}`));
        });
      }
    } catch (error) {
      console.error(
        `💥 CRITICAL ERROR during test "${testCase.testName}":`,
        error,
      );
    }
    console.log(`--- Finished Test: "${testCase.testName}" ---\n`);
  }

  console.log("========================================");
  console.log("✅ Test Suite Finished.");
}

// Execute the main function
testValidationSuite().catch((err) => {
  console.error(
    "An unexpected error occurred during the test suite execution:",
    err,
  );
});
