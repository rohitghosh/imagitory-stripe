#!/usr/bin/env node

/**
 * Test script for image generation with both OpenAI and Gemini providers
 * 
 * Usage:
 * npm run test-image-gen -- --provider openai
 * npm run test-image-gen -- --provider gemini
 * npm run test-image-gen -- --provider both
 */

import "dotenv/config";
import { 
  generateImage as orchestratorGenerateImage,
  regenerateImage as orchestratorRegenerateImage
} from "../core/orchestrator";
import { Part } from "../core/types";

// Test image URLs (character references)
const TEST_IMAGES = [
  "https://fal.media/files/kangaroo/vehO-KtjxXEc9w85gIsFY_843bd51892ef43dc8038ad395e9f1268.jpg",
];

// Test prompt parts
const TEST_PROMPT_PARTS: Part[] = [
  {
    type: "text",
    text: "Create a Pixar-style illustration of a friendly elephant playing with a colorful ball in a sunny meadow. The elephant should have large expressive eyes and a cheerful demeanor. The scene should be bright and joyful with soft lighting. Do not include any text or letters in the image."
  },
  ...TEST_IMAGES.map(url => ({
    type: "image_url" as const,
    url
  }))
];

const REGENERATION_PROMPT = "Make the elephant purple with sparkles and add rainbow colors to the ball";

/**
 * Test image generation with a specific provider
 */
async function testProvider(provider: "openai" | "gemini") {
  console.log(`\n🧪 Testing ${provider.toUpperCase()} provider`);
  console.log("=" .repeat(50));
  
  const conversationId = `test_${provider}_${Date.now()}`;
  
  try {
    // Test generation
    console.log("📝 Step 1: Generating initial image...");
    const startTime = Date.now();
    
    const generateResult = await orchestratorGenerateImage({
      conversationId,
      provider,
      prompt_parts: TEST_PROMPT_PARTS,
      gen_config: {
        size: "1024x1024",
        quality: "medium",
        output_format: "png"
      },
      onProgress: (phase, pct, message) => {
        console.log(`   └─ ${phase} (${pct}%): ${message}`);
      }
    });
    
    const generateTime = Date.now() - startTime;
    console.log(`✅ Generation completed in ${generateTime}ms`);
    console.log(`   • Job ID: ${generateResult.jobId}`);
    console.log(`   • Images: ${generateResult.images.length}`);
    console.log(`   • First image URL: ${generateResult.images[0]?.url || 'N/A'}`);
    console.log(`   • Provider metadata:`, generateResult.provider_meta);
    
    // Test regeneration
    console.log("\n🔄 Step 2: Testing regeneration...");
    const regenStartTime = Date.now();
    
    const regenResult = await orchestratorRegenerateImage({
      conversationId,
      jobId: generateResult.jobId,
      revisedPrompt: REGENERATION_PROMPT,
      onProgress: (phase, pct, message) => {
        console.log(`   └─ ${phase} (${pct}%): ${message}`);
      }
    });
    
    const regenTime = Date.now() - regenStartTime;
    console.log(`✅ Regeneration completed in ${regenTime}ms`);
    console.log(`   • New job ID: ${regenResult.jobId}`);
    console.log(`   • Images: ${regenResult.images.length}`);
    console.log(`   • First image URL: ${regenResult.images[0]?.url || 'N/A'}`);
    
    console.log(`\n🎉 ${provider.toUpperCase()} test completed successfully!`);
    return true;
    
  } catch (error) {
    console.error(`❌ ${provider.toUpperCase()} test failed:`, error);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  const args = process.argv.slice(2);
  const providerArg = args.find(arg => arg.startsWith('--provider='))?.split('=')[1] || 
                     (args.includes('--provider') ? args[args.indexOf('--provider') + 1] : 'openai');
  
  console.log("🚀 Image Generation Test Suite");
  console.log("==============================");
  console.log(`Provider: ${providerArg}`);
  console.log(`Test images: ${TEST_IMAGES.length}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Validate environment variables
  const missingEnvVars = [];
  if (!process.env.OPENAI_API_KEY && (providerArg === 'openai' || providerArg === 'both')) {
    missingEnvVars.push('OPENAI_API_KEY');
  }
  if (!process.env.GEMINI_API_KEY && (providerArg === 'gemini' || providerArg === 'both')) {
    missingEnvVars.push('GEMINI_API_KEY');
  }
  
  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }
  
  const results: { provider: string; success: boolean }[] = [];
  
  // Run tests based on provider argument
  if (providerArg === 'both') {
    results.push({ provider: 'openai', success: await testProvider('openai') });
    results.push({ provider: 'gemini', success: await testProvider('gemini') });
  } else if (providerArg === 'openai' || providerArg === 'gemini') {
    results.push({ provider: providerArg, success: await testProvider(providerArg) });
  } else {
    console.error(`❌ Invalid provider: ${providerArg}. Use 'openai', 'gemini', or 'both'`);
    process.exit(1);
  }
  
  // Print summary
  console.log("\n📊 Test Summary");
  console.log("===============");
  results.forEach(({ provider, success }) => {
    console.log(`${success ? '✅' : '❌'} ${provider.toUpperCase()}: ${success ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = results.every(r => r.success);
  console.log(`\n${allPassed ? '🎉' : '💥'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  process.exit(allPassed ? 0 : 1);
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error("💥 Test runner failed:", error);
    process.exit(1);
  });
}
