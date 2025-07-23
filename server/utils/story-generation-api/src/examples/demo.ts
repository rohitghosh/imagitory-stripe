import axios from "axios";

const BASE_URL = "http://localhost:3001";

/**
 * Demo: Complete workflow for generating a story
 */
async function demoCompleteWorkflow() {
  console.log("🎭 Story Generation API Demo");
  console.log("============================\n");

  // Example story input
  const storyInput = {
    kidName: "Maya",
    pronoun: "she/her",
    age: 5,
    moral: "Every small act of kindness matters",
    storyRhyming: false,
    kidInterests: ["Gardening"],
    storyThemes: ["Magical Discovery"],
    characters: ["Pip"],
    characterDescriptions: [
      "a tiny fairy with glowing wings who lives in flowers",
    ],
  };

  try {
    console.log("📋 Step 1: Validating story inputs...");
    const validationResponse = await axios.post(
      `${BASE_URL}/api/runValidation`,
      storyInput,
    );

    if (!validationResponse.data.success) {
      console.log("❌ Validation failed:");
      validationResponse.data.failures.forEach((failure: any) => {
        console.log(`  - ${failure.check}: ${failure.problem}`);
      });
      return;
    }

    console.log("✅ Validation passed!\n");

    console.log("🚀 Step 2: Starting story generation...");
    const generationResponse = await axios.post(
      `${BASE_URL}/api/generateFullStory`,
      storyInput,
    );

    const jobId = generationResponse.data.jobId;
    console.log(`✅ Job started with ID: ${jobId}\n`);

    console.log("⏳ Step 3: Monitoring progress...");
    const result = await pollJobWithProgress(jobId);

    if (result) {
      console.log("\n🎉 Story generation completed!");
      console.log("📖 Final Story Details:");
      console.log(`Title: "${result.cover.story_title}"`);
      console.log(`Cover: ${result.cover.cover_url}`);
      console.log(`Scenes: ${result.scenes.length}`);

      // Show first scene as example
      if (result.scenes.length > 0) {
        const firstScene = result.scenes[0];
        console.log(`\nFirst Scene Preview:`);
        console.log(`Text: "${firstScene.scene_text.join("\n")}"`);
        console.log(`Image: ${firstScene.scene_url}`);
      }
    }
  } catch (error: any) {
    console.error("❌ Demo failed:", error.response?.data || error.message);
  }
}

/**
 * Demo: Story without side character
 */
async function demoSoloStory() {
  console.log("\n🎭 Solo Story Demo (No Side Character)");
  console.log("=====================================\n");

  const soloStoryInput = {
    kidName: "River",
    pronoun: "they/them",
    age: 8,
    moral: "Your imagination is your greatest tool",
    storyRhyming: true,
    kidInterests: ["Building"],
    storyThemes: ["Adventure Story"],
    characters: [], // No side characters
    characterDescriptions: [],
  };

  try {
    // Validate
    console.log("📋 Validating solo story...");
    const validationResponse = await axios.post(
      `${BASE_URL}/api/runValidation`,
      soloStoryInput,
    );

    if (validationResponse.data.success) {
      console.log("✅ Solo story validation passed!");
    } else {
      console.log("❌ Validation issues found");
      return;
    }

    // Generate (but don't wait for completion in this demo)
    console.log("🚀 Starting solo story generation...");
    const generationResponse = await axios.post(
      `${BASE_URL}/api/generateFullStory`,
      soloStoryInput,
    );
    console.log(`✅ Solo story job started: ${generationResponse.data.jobId}`);
  } catch (error: any) {
    console.error(
      "❌ Solo story demo failed:",
      error.response?.data || error.message,
    );
  }
}

/**
 * Poll job status with progress display
 */
async function pollJobWithProgress(
  jobId: string,
  maxAttempts: number = 30,
): Promise<any> {
  const progressBar = (pct: number) => {
    const filled = Math.floor(pct / 5);
    const empty = 20 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/api/job/${jobId}`);
      const status = response.data;

      const bar = progressBar(status.pct);
      console.log(
        `[${bar}] ${status.pct}% - ${status.phase}: ${status.message || "Processing..."}`,
      );

      if (status.phase === "complete") {
        return status.result;
      } else if (status.phase === "error") {
        console.log(`❌ Job failed: ${status.error}`);
        return null;
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.log(`❌ Error checking job status: ${error.message}`);
      return null;
    }
  }

  console.log("❌ Job monitoring timed out");
  return null;
}

/**
 * Demo: Validation edge cases
 */
async function demoValidationEdgeCases() {
  console.log("\n🔍 Validation Edge Cases Demo");
  console.log("=============================\n");

  const edgeCases = [
    {
      name: "Age too young",
      input: {
        kidName: "Baby",
        pronoun: "they/them",
        age: 1, // Very young
        moral: "Test",
        kidInterests: ["Toys"],
        storyThemes: ["Adventure Story"],
      },
    },
    {
      name: "Copyrighted character",
      input: {
        kidName: "Test",
        pronoun: "he/him",
        age: 6,
        moral: "Test",
        kidInterests: ["Movies"],
        storyThemes: ["Adventure Story"],
        character1: "Mickey Mouse", // Copyrighted
        character1_description: "Disney character",
      },
    },
  ];

  for (const testCase of edgeCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      const response = await axios.post(
        `${BASE_URL}/api/runValidation`,
        testCase.input,
      );

      if (response.data.success) {
        console.log("✅ Passed validation");
      } else {
        console.log("❌ Failed validation (as expected):");
        response.data.failures.forEach((failure: any) => {
          console.log(`  - ${failure.check}: ${failure.problem}`);
        });
      }
      console.log("");
    } catch (error: any) {
      console.log(
        `❌ API Error: ${error.response?.data?.error || error.message}\n`,
      );
    }
  }
}

// Main demo function
async function runDemo() {
  console.log("🎬 Starting Story Generation API Demo\n");

  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log("✅ Server is running\n");
  } catch (error) {
    console.log(
      "❌ Server is not running. Please start it with: npm run dev\n",
    );
    return;
  }

  // Run demo scenarios
  await demoCompleteWorkflow();
  await demoSoloStory();
  await demoValidationEdgeCases();

  console.log("🎬 Demo completed!\n");
  console.log("💡 Tips:");
  console.log(
    "- Use the test scripts for automated testing: npm run test:validation",
  );
  console.log("- Check the README.md for complete API documentation");
  console.log(
    "- Monitor job progress in real-time with the /api/job/:jobId endpoint",
  );
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo, demoCompleteWorkflow, demoSoloStory };
