import axios from "axios";

const BASE_URL = "http://localhost:3001";

interface StoryTestCase {
  name: string;
  input: any;
}

const testCases: StoryTestCase[] = [
  {
    name: "Story with side character",
    input: {
      kidName: "Tyler",
      pronoun: "he/him",
      age: 7,
      moral: "True strength comes from teamwork",
      storyRhyming: true,
      kidInterests: ["Stargazing"],
      storyThemes: ["Adventure Story"],
      characters: ["Pengu"],
      characterDescriptions: ["a cute black and white penguin"],
    },
  },
  {
    name: "Story without side character",
    input: {
      kidName: "Luna",
      pronoun: "she/her",
      age: 6,
      moral: "Creativity comes from within",
      storyRhyming: false,
      kidInterests: ["Art"],
      storyThemes: ["Magical Discovery"],
      characters: [],
      characterDescriptions: [],
    },
  },
  {
    name: "Non-rhyming adventure story",
    input: {
      kidName: "Alex",
      pronoun: "they/them",
      age: 8,
      moral: "Courage means facing your fears",
      storyRhyming: false,
      kidInterests: ["Ocean"],
      storyThemes: ["Adventure Story"],
      characters: ["Splash"],
      characterDescriptions: [
        "a wise old sea turtle with barnacles on his shell",
      ],
    },
  },
];

async function pollJobStatus(
  jobId: string,
  maxAttempts: number = 60,
): Promise<any> {
  console.log(`📊 Polling job status for: ${jobId}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${BASE_URL}/api/job/${jobId}`);
      const status = response.data;

      console.log(
        `[${attempt}/${maxAttempts}] Phase: ${status.phase}, Progress: ${status.pct}%, Message: ${status.message || "N/A"}`,
      );

      if (status.phase === "complete") {
        console.log("✅ Story generation completed!");
        return status.result;
      } else if (status.phase === "error") {
        console.log("❌ Story generation failed:");
        console.log(status.error);
        return null;
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error: any) {
      console.log(
        `❌ Error polling job status: ${error.response?.data?.error || error.message}`,
      );
      return null;
    }
  }

  console.log("❌ Job polling timed out");
  return null;
}

async function testStoryGeneration(testCaseIndex?: number): Promise<void> {
  console.log("🧪 Starting Story Generation API Tests\n");

  const casesToTest =
    testCaseIndex !== undefined ? [testCases[testCaseIndex]] : testCases;

  for (const testCase of casesToTest) {
    try {
      console.log(`\n🚀 Testing: ${testCase.name}`);
      console.log(`Input:`, JSON.stringify(testCase.input, null, 2));

      // Start story generation
      const response = await axios.post(
        `${BASE_URL}/api/generateFullStory`,
        testCase.input,
      );

      if (response.status !== 202) {
        console.log(`❌ Unexpected status: ${response.status}`);
        continue;
      }

      const { jobId } = response.data;
      console.log(`✅ Job started with ID: ${jobId}`);

      // Poll for completion
      const result = await pollJobStatus(jobId);

      if (result) {
        console.log("\n📖 Final Result Summary:");
        console.log(`Title: ${result.cover.story_title}`);
        console.log(`Cover URL: ${result.cover.cover_url}`);
        console.log(`Number of scenes: ${result.scenes.length}`);

        console.log("\nScenes:");
        result.scenes.forEach((scene: any, index: number) => {
          console.log(
            `  Scene ${scene.scene_number}: ${scene.scene_text.substring(0, 50)}...`,
          );
          console.log(`    Image: ${scene.scene_url}`);
        });
      }
    } catch (error: any) {
      console.log("❌ FAIL - Unexpected error:");
      console.log(error.response?.data || error.message);
    }
  }
}

// Helper function to test a specific case
async function testSpecificCase(index: number): Promise<void> {
  if (index < 0 || index >= testCases.length) {
    console.log(
      `❌ Invalid test case index. Available indexes: 0-${testCases.length - 1}`,
    );
    return;
  }
  await testStoryGeneration(index);
}

// Run tests if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const index = parseInt(args[0]);
    testSpecificCase(index).catch(console.error);
  } else {
    testStoryGeneration().catch(console.error);
  }
}

export { testStoryGeneration, testSpecificCase };
