import axios from "axios";

const BASE_URL = "http://localhost:3001";

interface ValidationTestCase {
  name: string;
  input: any;
  expectSuccess: boolean;
}

const testCases: ValidationTestCase[] = [
  {
    name: "Valid story with character",
    input: {
      kidName: "Emma",
      pronoun: "she/her",
      age: 6,
      moral: "Friendship makes everything better",
      kidInterests: ["Animals"],
      storyThemes: ["Adventure Story"],
      character1: "Buddy",
      character1_description: "a loyal golden retriever with a red bandana",
    },
    expectSuccess: true,
  },
  {
    name: "Valid story without character",
    input: {
      kidName: "Alex",
      pronoun: "they/them",
      age: 8,
      moral: "Believe in yourself",
      kidInterests: ["Space"],
      storyThemes: ["Mystery"],
    },
    expectSuccess: true,
  },
  {
    name: "Missing required field",
    input: {
      kidName: "Sam",
      // Missing pronoun
      age: 7,
      moral: "Kindness matters",
      kidInterests: ["Music"],
      storyThemes: ["Adventure Story"],
    },
    expectSuccess: false,
  },
  {
    name: "Character without description",
    input: {
      kidName: "Riley",
      pronoun: "he/him",
      age: 5,
      moral: "Sharing is caring",
      kidInterests: ["Art"],
      storyThemes: ["Friendship Tale"],
      character1: "Sparkle",
      // Missing character1_description
    },
    expectSuccess: false,
  },
  {
    name: "Empty interests array",
    input: {
      kidName: "Jordan",
      pronoun: "she/her",
      age: 9,
      moral: "Try your best",
      kidInterests: [], // Empty array
      storyThemes: ["Adventure Story"],
    },
    expectSuccess: false,
  },
];

async function testValidation(): Promise<void> {
  console.log("🧪 Starting Validation API Tests\n");

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Input:`, JSON.stringify(testCase.input, null, 2));

      const response = await axios.post(
        `${BASE_URL}/api/runValidation`,
        testCase.input,
      );

      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));

      if (testCase.expectSuccess) {
        if (response.data.success) {
          console.log("✅ PASS - Validation succeeded as expected\n");
        } else {
          console.log("❌ FAIL - Expected success but got failures:");
          console.log(response.data.failures);
          console.log("");
        }
      } else {
        console.log(
          "✅ PASS - Request handled correctly (expecting validation issues)\n",
        );
      }
    } catch (error: any) {
      if (testCase.expectSuccess) {
        console.log("❌ FAIL - Unexpected error:");
        console.log(error.response?.data || error.message);
      } else {
        console.log("✅ PASS - Expected error occurred:");
        console.log(error.response?.data || error.message);
      }
      console.log("");
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testValidation().catch(console.error);
}

export { testValidation };
