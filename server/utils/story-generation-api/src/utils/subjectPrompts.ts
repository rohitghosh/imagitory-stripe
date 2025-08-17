// Subject-specific detailed prompts for story generation
// Each subject includes theme-specific overlays for different narrative approaches

export interface SubjectPrompt {
  theme: string;
  subject: string;
  premise: string;
  storyGuidelines: string;
  characterIntegration: string;
  sceneIdeas: string[];
  educationalGoals?: string;
  themeOverlay: string;
}

// Educational Theme Subject Prompts
export const EDUCATIONAL_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  alphabet: {
    theme: "Educational",
    subject: "Alphabet",
    premise:
      "Create a story where the main character discovers letters through adventure and exploration. Each letter should be introduced naturally through objects, places, or actions that begin with that letter.",
    storyGuidelines: `
      - Introduce 5-8 letters naturally throughout the story
      - Use alliteration and letter sounds to reinforce learning
      - Create memorable associations between letters and concepts
      - Include interactive elements where children can spot letters
      - Make letter discovery feel like treasure hunting
      - Ensure the alphabet learning feels organic to the adventure
    `,
    characterIntegration:
      "Side characters can be guides who help discover new letters, or companions who each specialize in different letter families.",
    sceneIdeas: [
      "Discovering an Alphabet Tree with letters growing as fruits",
      "Meeting animals whose names start with the letters being learned",
      "Finding letter-shaped objects in a magical landscape",
      "Creating letter art or crafts with natural materials",
      "Playing alphabet games with other characters",
    ],
    educationalGoals:
      "Letter recognition, phonetic awareness, vocabulary building",
    themeOverlay:
      "Frame the alphabet learning as an exciting discovery adventure where each letter unlocks new possibilities and knowledge.",
  },

  "learning-to-count": {
    theme: "Educational",
    subject: "Learning to Count",
    premise:
      "Create a story where counting becomes essential to solving problems and achieving goals. Numbers should appear naturally through collections, groups, and sequences.",
    storyGuidelines: `
      - Focus on numbers 1-10 for younger children (3-5) or 1-20 for older children (6-8)
      - Use visual groupings and collections to make counting tangible
      - Include counting backwards and skip counting
      - Make numbers feel magical and powerful
      - Use rhythm and repetition to reinforce number sequences
      - Create scenarios where miscounting leads to funny consequences
    `,
    characterIntegration:
      "Characters can have different strengths with numbers - one might be great at counting, another at grouping. Use characters to demonstrate different counting strategies.",
    sceneIdeas: [
      "Counting magical creatures to solve a puzzle",
      "Organizing items by number for a special ceremony",
      "Using numbers to navigate through a challenge",
      "Discovering number patterns in nature",
      "Trading items using counting and basic math",
    ],
    educationalGoals:
      "Number recognition, counting skills, basic arithmetic concepts, pattern recognition",
    themeOverlay:
      "Present counting as a superpower that helps solve problems and unlock secrets in an educational adventure.",
  },

  "shapes-and-colours": {
    theme: "Educational",
    subject: "Shapes and Colours",
    premise:
      "Create a vibrant story where shapes and colors are key to understanding and interacting with the world. Each shape and color should have significance and purpose.",
    storyGuidelines: `
      - Introduce basic shapes: circle, square, triangle, rectangle, oval, diamond
      - Feature primary and secondary colors prominently
      - Use shapes and colors as puzzle elements or keys to progression
      - Create emotional associations with different colors
      - Show how shapes exist in everyday objects
      - Make color mixing and shape combining part of the adventure
    `,
    characterIntegration:
      "Characters can each be associated with different colors or shapes, wearing or having preferences that reflect these elements.",
    sceneIdeas: [
      "A world where each area is defined by different shapes",
      "Mixing colors to create new magical effects",
      "Building structures using various shapes",
      "Following color-coded paths or clues",
      "Discovering that different shapes have different properties",
    ],
    educationalGoals:
      "Shape recognition, color identification, pattern recognition, spatial awareness",
    themeOverlay:
      "Frame shapes and colors as the building blocks of a magical world where understanding these elements unlocks creative possibilities.",
  },

  "seasons-and-weather": {
    theme: "Educational",
    subject: "Seasons and Weather",
    premise:
      "Create a story that follows the natural cycle of seasons, showing how weather affects the world and characters' activities.",
    storyGuidelines: `
      - Show the transition between seasons and their characteristics
      - Include weather phenomena: rain, snow, sunshine, wind, clouds
      - Demonstrate how animals and plants adapt to seasonal changes  
      - Show seasonal activities and celebrations
      - Include the concept of weather patterns and prediction
      - Make weather an active character in the story
    `,
    characterIntegration:
      "Characters can have seasonal preferences or abilities, or be affected differently by weather changes.",
    sceneIdeas: [
      "Helping animals prepare for winter",
      "Dancing in the rain or playing in snow",
      "Planting seeds and watching them grow through seasons",
      "Following weather patterns to predict changes",
      "Celebrating seasonal festivals and traditions",
    ],
    educationalGoals:
      "Understanding natural cycles, weather awareness, environmental consciousness",
    themeOverlay:
      "Present seasons and weather as a magical natural adventure where understanding nature's patterns helps characters thrive.",
  },

  "first-words": {
    theme: "Educational",
    subject: "First Words",
    premise:
      "Create a story where the main character discovers the power and joy of language, learning new words through meaningful experiences and interactions.",
    storyGuidelines: `
      - Introduce 8-12 new vocabulary words naturally through context
      - Show how words can express feelings, needs, and ideas
      - Include repetition to reinforce new vocabulary
      - Make word discovery feel exciting and empowering
      - Connect words to tangible objects and experiences
      - Show the social aspect of communication
    `,
    characterIntegration:
      "Characters can be at different stages of language development, with some teaching others new words or all discovering language together.",
    sceneIdeas: [
      "Finding a magical book that brings words to life",
      "Learning words to communicate with different animals",
      "Using new words to solve problems or make requests",
      "Playing word games that unlock new adventures",
      "Teaching someone else the words they've learned",
    ],
    educationalGoals:
      "Vocabulary building, communication skills, language appreciation, social interaction",
    themeOverlay:
      "Frame language learning as an adventure where words are magical tools that open doors to new experiences and friendships.",
  },

  "brushing-teeth": {
    theme: "Educational",
    subject: "Brushing Teeth",
    premise:
      "Create a story that makes dental hygiene feel like an exciting adventure where the main character becomes a teeth-cleaning hero.",
    storyGuidelines: `
      - Make brushing teeth feel fun and heroic, not like a chore
      - Include the step-by-step process of proper teeth brushing
      - Show the consequences of good vs. poor dental hygiene
      - Create characters out of teeth, toothbrushes, or dental items
      - Include timing elements (brushing for the right amount of time)
      - Make it relatable to daily routines
    `,
    characterIntegration:
      "Characters can represent different aspects of dental hygiene - some might be teeth that need help, others might be helpful dental tools.",
    sceneIdeas: [
      "Becoming a teeth-cleaning superhero with special powers",
      "Going on a mission to fight sugar bugs and plaque monsters",
      "Teaching younger characters how to brush properly",
      "Discovering a magical toothbrush that makes brushing fun",
      "Celebrating healthy, clean teeth with a tooth fairy visit",
    ],
    educationalGoals:
      "Dental hygiene habits, health awareness, routine building, self-care skills",
    themeOverlay:
      "Present dental hygiene as a heroic daily adventure where the main character protects their kingdom of teeth from harmful invaders.",
  },
};

// Adventure Theme Subject Prompts
export const ADVENTURE_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  pirates: {
    theme: "Adventure",
    subject: "Pirates",
    premise:
      "Create an adventure where the main character becomes a brave hero who encounters pirates and must use courage, cleverness, and friendship to save the day.",
    storyGuidelines: `
      - Position the main character as the hero who saves others from trouble
      - Make pirates more mischievous than scary (appropriate for age 3-8)
      - Include treasure hunting and map reading
      - Emphasize problem-solving and teamwork
      - Include nautical elements: ships, islands, ocean adventures
      - Show how conflicts can be resolved through understanding
    `,
    characterIntegration:
      "Side characters can be fellow crew members, helpful sea creatures, or reformed pirates who become friends.",
    sceneIdeas: [
      "Discovering a treasure map and planning the adventure",
      "Sailing through storms and overcoming obstacles",
      "Outsmarting pirates through clever thinking",
      "Finding hidden treasure and deciding what to do with it",
      "Making peace between different groups through understanding",
    ],
    educationalGoals:
      "Problem-solving, leadership, conflict resolution, geography concepts",
    themeOverlay:
      "Frame the pirate adventure as a heroic journey where the main character's bravery and kindness triumph over mischief and chaos.",
  },

  exploration: {
    theme: "Adventure",
    subject: "Exploration",
    premise:
      "Create an adventure where the main character becomes an intrepid explorer discovering new lands, cultures, or phenomena.",
    storyGuidelines: `
      - Emphasize curiosity and discovery over conquest
      - Include map-making and navigation skills
      - Show respect for new environments and cultures
      - Include scientific observation and documentation
      - Create wonder around natural phenomena
      - Emphasize preparation and planning for adventures
    `,
    characterIntegration:
      "Side characters can be local guides, fellow explorers with different skills, or companions who each contribute unique perspectives.",
    sceneIdeas: [
      "Preparing for an expedition with proper gear and planning",
      "Discovering a hidden valley or secret passage",
      "Meeting new cultures and learning their customs",
      "Documenting amazing discoveries in a journal",
      "Overcoming natural obstacles through teamwork",
    ],
    educationalGoals:
      "Geography, cultural awareness, scientific thinking, planning skills",
    themeOverlay:
      "Present exploration as a noble adventure where curiosity and respect for others lead to amazing discoveries and friendships.",
  },

  travel: {
    theme: "Adventure",
    subject: "Travel",
    premise:
      "Create an adventure story about traveling to different places, learning about new cultures, and discovering that the world is full of wonderful diversity.",
    storyGuidelines: `
      - Showcase different countries, cultures, and traditions
      - Include various modes of transportation
      - Emphasize cultural appreciation and respect
      - Show how people are similar despite differences
      - Include local foods, music, and customs
      - Make travel feel accessible and exciting
    `,
    characterIntegration:
      "Characters can be from different places, each sharing their cultural background, or travel companions who discover new places together.",
    sceneIdeas: [
      "Packing for a big journey and planning the route",
      "Experiencing different transportation methods",
      "Trying new foods and learning local customs",
      "Participating in cultural celebrations",
      "Making friends across cultural boundaries",
    ],
    educationalGoals:
      "Cultural awareness, geography, tolerance, communication skills",
    themeOverlay:
      "Frame travel as an adventure that opens minds and hearts, showing how exploring the world creates understanding and friendship.",
  },
};

// Fairy Tales Subject Prompts
export const FAIRY_TALES_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  unicorns: {
    theme: "Fairy Tales",
    subject: "Unicorns",
    premise:
      "Create a magical fairy tale where the main character encounters unicorns and discovers the power of purity, kindness, and belief in magic.",
    storyGuidelines: `
      - Emphasize the magical and pure nature of unicorns
      - Include themes of believing in magic and wonder
      - Show how kindness and pure hearts attract magical creatures
      - Include magical forests, rainbow bridges, and crystal streams
      - Make magic feel earned through good deeds and pure intentions
      - Include healing and helping others as magical powers
    `,
    characterIntegration:
      "Side characters can be other magical creatures, forest guardians, or friends who learn to believe in magic together.",
    sceneIdeas: [
      "First encounter with a shy unicorn in a magical glade",
      "Earning a unicorn's trust through acts of kindness",
      "Riding unicorns across rainbow bridges",
      "Using unicorn magic to heal or help others",
      "Protecting the magical realm from those who would harm it",
    ],
    educationalGoals:
      "Empathy, kindness, environmental protection, believing in goodness",
    themeOverlay:
      "Present unicorns as symbols of pure magic that can only be experienced by those with kind hearts and belief in wonder.",
  },

  "fantasy-worlds": {
    theme: "Fairy Tales",
    subject: "Fantasy Worlds",
    premise:
      "Create an immersive fairy tale that transports the main character to a completely different fantasy realm with its own rules, creatures, and magic.",
    storyGuidelines: `
      - Build a consistent fantasy world with clear rules and magic systems
      - Include fantastical creatures and magical beings
      - Show how the main character adapts to new rules and customs
      - Include quests or challenges specific to the fantasy setting
      - Make the fantasy world feel lived-in and believable
      - Include portals or transitions between worlds
    `,
    characterIntegration:
      "Characters can be native to the fantasy world, fellow travelers from the real world, or magical guides who help navigation.",
    sceneIdeas: [
      "Discovering the portal to the fantasy world",
      "Learning the rules and magic of the new realm",
      "Meeting fantastical creatures and making alliances",
      "Facing challenges unique to the fantasy setting",
      "Deciding whether to stay or return home",
    ],
    educationalGoals:
      "Imagination, adaptability, world-building concepts, cultural understanding",
    themeOverlay:
      "Present fantasy worlds as places where imagination becomes reality and where believing in magic allows characters to achieve the impossible.",
  },

  dragons: {
    theme: "Fairy Tales",
    subject: "Dragons",
    premise:
      "Create a fairy tale where the main character discovers that dragons are not monsters to be feared, but wise and magical creatures to be understood and befriended.",
    storyGuidelines: `
      - Subvert the traditional scary dragon trope for age-appropriate content
      - Show dragons as wise, ancient, and misunderstood creatures
      - Include themes of not judging by appearances
      - Feature dragon magic and ancient wisdom
      - Include dragon hoards as collections of knowledge, not just treasure
      - Show the bond between dragons and those who earn their trust
    `,
    characterIntegration:
      "Side characters can be other dragon friends, dragon riders, or skeptics who learn to appreciate dragons.",
    sceneIdeas: [
      "First meeting with a dragon and overcoming initial fear",
      "Learning about dragon history and wisdom",
      "Flying on dragon back across fantastic landscapes",
      "Helping a dragon solve an ancient problem",
      "Protecting dragons from those who misunderstand them",
    ],
    educationalGoals:
      "Open-mindedness, not judging by appearances, wisdom appreciation, friendship",
    themeOverlay:
      "Present dragons as magnificent creatures of ancient wisdom whose friendship is one of the greatest magical treasures anyone can earn.",
  },

  princesses: {
    theme: "Fairy Tales",
    subject: "Princesses",
    premise:
      "Create a fairy tale where the main character either becomes a brave princess or befriends a princess who shows that being royal means helping others and being kind.",
    storyGuidelines: `
      - Present princesses as active heroes rather than passive characters
      - Show that true royalty comes from kindness and helping others
      - Include royal responsibilities like caring for subjects
      - Feature problem-solving and leadership skills
      - Show that anyone can have a royal heart through their actions
      - Include themes of service, kindness, and responsibility
    `,
    characterIntegration:
      "Characters can be royal companions, subjects in need of help, or friends who all learn about true nobility together.",
    sceneIdeas: [
      "Discovering that being a princess means helping others",
      "Solving kingdom problems through wisdom and kindness",
      "Learning royal duties like caring for all subjects equally",
      "Showing that royal behavior is about character, not titles",
      "Protecting the kingdom through courage and cleverness",
    ],
    educationalGoals:
      "Leadership, kindness, responsibility, service to others, character development",
    themeOverlay:
      "Present princesses as role models who show that true royalty comes from having a kind heart and helping others.",
  },

  magic: {
    theme: "Fairy Tales",
    subject: "Magic",
    premise:
      "Create a fairy tale where the main character discovers or learns to use magic, understanding that real magic comes from within and should be used to help others.",
    storyGuidelines: `
      - Show magic as something that requires responsibility and wisdom
      - Connect magical ability to positive character traits
      - Include learning to control and direct magical powers
      - Show magic being used to help others, not for selfish gain
      - Include the idea that everyone has some form of magic within them
      - Make magic feel wondrous but not frightening
    `,
    characterIntegration:
      "Characters can be magical mentors, fellow magic learners, or those who benefit from magical help.",
    sceneIdeas: [
      "Discovering hidden magical abilities within themselves",
      "Learning from a wise magical mentor about responsibility",
      "Using magic to solve problems and help others",
      "Understanding that the greatest magic is kindness and love",
      "Teaching others to find their own inner magic",
    ],
    educationalGoals:
      "Responsibility, inner strength, helping others, self-discovery, wisdom",
    themeOverlay:
      "Present magic as a wonderful gift that requires wisdom and should always be used to spread joy and help others.",
  },
};

// Custom Theme Handling
export const CUSTOM_THEME_GUIDELINES = {
  premise:
    "When using a custom theme with a user-provided subject description, treat the subject as the foundational premise for the story. Expand thoughtfully on the user's vision while maintaining age-appropriate content and educational value.",
  storyGuidelines: `
    - Carefully analyze the user's subject description for key themes and elements
    - Expand the premise into a full nine-beat narrative structure
    - Maintain consistency with the tone and style implied by the user's description
    - Add educational or moral elements that align with the story premise
    - Ensure all elements remain appropriate for children aged 3-8
    - Use the user's ideas as inspiration while adding depth and structure
    - If the user's premise is too simple, add layers of character development and plot complexity
    - If the user's premise is too complex, simplify while maintaining the core vision
  `,
  characterIntegration:
    "Analyze how characters might naturally fit into the user's story premise. Create character roles that support and enhance the custom story concept.",
  themeOverlay:
    "Since this is a custom theme, focus on bringing the user's unique vision to life while ensuring it follows good storytelling principles and remains engaging for young children.",
};

// Helper function to get subject prompt
export function getSubjectPrompt(
  theme: string,
  subject: string,
): SubjectPrompt | null {
  const themeKey = theme.toLowerCase().replace(/\s+/g, "-");
  const subjectKey = subject.toLowerCase().replace(/\s+/g, "-");

  switch (themeKey) {
    case "educational":
      return EDUCATIONAL_SUBJECT_PROMPTS[subjectKey] || null;
    case "adventure":
      return ADVENTURE_SUBJECT_PROMPTS[subjectKey] || null;
    case "fairy-tales":
      return FAIRY_TALES_SUBJECT_PROMPTS[subjectKey] || null;
    default:
      return null;
  }
}

// Helper function to check if theme is custom
export function isCustomTheme(theme: string): boolean {
  return theme.toLowerCase() === "custom";
}
