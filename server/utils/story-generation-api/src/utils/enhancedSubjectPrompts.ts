// Enhanced Subject-specific detailed prompts for story generation
// Comprehensive structure covering all themes and subjects with deep guidance

const sceneCount =
  typeof (globalThis as any).sceneCount === "number"
    ? (globalThis as any).sceneCount
    : 11; // default to 11 if not injected

export interface StoryArchetype {
  name: string;
  description: string;
  characterRoles?: string;
  exampleScenario?: string;
}

export interface SceneGuidance {
  setupPhase: string[]; // Scenes 1-4: Introduction and problem establishment
  developmentPhase: string[]; // Scenes 5-8: Challenge escalation and growth
  resolutionPhase: string[]; // Scenes 9-11: Climax and satisfying conclusion
}

export interface SubjectPrompt {
  theme: string;
  subject: string;

  // Core Story Foundation
  premise: string;
  coreConflict: string;
  emotionalJourney: string;

  // Story Development Guidelines
  storyArchetypes: StoryArchetype[];
  characterDynamics: {
    soloCharacterApproach: string;
    companionIntegration: string;
    groupDynamics: string;
  };

  // Detailed Scene Guidance
  sceneGuidance: SceneGuidance;

  // Visual and Atmospheric Elements
  settingVariations: string[];
  visualMotifs: string[];
  colorPaletteSuggestions: string[];

  // Educational/Developmental Focus
  learningObjectives?: string[];
  skillBuilding?: string[];

  // Theme-Specific Overlay
  themeIntegration: string;
}

// EDUCATIONAL THEME SUBJECT PROMPTS
export const EDUCATIONAL_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  alphabet: {
    theme: "Educational",
    subject: "Alphabet",
    premise:
      "Transform letter learning into an epic quest where each discovered letter unlocks new magical abilities or reveals hidden secrets in the world around the protagonist.",
    coreConflict:
      "The protagonist must collect scattered letters to restore communication, unlock magical spells, or solve puzzles that can only be solved through alphabet mastery.",
    emotionalJourney:
      "Moves from confusion or frustration with letters to confidence and pride in literacy, experiencing the joy of communication and self-expression.",

    storyArchetypes: [
      {
        name: "The Letter Detective",
        description:
          "Letters have mysteriously disappeared from the world, and the protagonist must find them to restore reading and writing.",
        characterRoles:
          "Companions can be talking books, wise owls, or library spirits who guide the search.",
        exampleScenario:
          "Words are fading from signs and books. The protagonist discovers that collecting each missing letter in order will bring them back.",
      },
      {
        name: "The Alphabet Keeper",
        description:
          "The protagonist inherits the responsibility of maintaining the Alphabet Kingdom where each letter has its own personality and domain.",
        characterRoles:
          "Letters themselves can be characters, or companions can represent letter families (vowels vs consonants).",
        exampleScenario:
          "Letter A is having trouble with Letter B, and the protagonist must help them work together to form words.",
      },
      {
        name: "The Word Builder",
        description:
          "The protagonist learns that combining letters creates powerful spells or builds magical structures that help others.",
        characterRoles:
          "Companions provide different letters or help sound out combinations.",
        exampleScenario:
          "Building a bridge requires spelling B-R-I-D-G-E with collected letter blocks.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on internal discovery and self-teaching moments. Use environmental storytelling with talking letters, responsive objects, or animal friends who react to correct letter recognition.",
      companionIntegration:
        "Companions can each specialize in different letter groups, creating teaching moments. A penguin friend might be great with P words, while a cat companion knows all about C sounds.",
      groupDynamics:
        "Create alphabet teams where each character contributes different letters to solve group challenges. Show collaborative spelling and word-building activities.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce the world where letters are important but mysterious. Show the protagonist's current relationship with letters - perhaps they recognize some but not others.",
        "Present the inciting incident - letters disappearing, a message that needs decoding, or a magical alphabet tree that needs tending.",
        "First letter discovery - make it magical and rewarding. Show how finding one letter opens a door, lights up a path, or reveals a hidden friend.",
      ],
      developmentPhase: [
        "Letter collecting adventure - create diverse environments where different letters naturally appear. A arrives in an Apple orchard, B buzzes with Bees.",
        "Challenge scene where missing letters cause real problems - signs become unreadable, spells won't work, friends can't understand each other.",
        "Mid-story triumph where the protagonist successfully uses learned letters to help someone or solve a meaningful problem.",
      ],
      resolutionPhase: [
        "Major challenge requiring multiple letters working together - spelling a important word that saves the day or unlocks the final puzzle.",
        "Climactic scene where the protagonist demonstrates mastery by teaching letters to someone else or restoring the alphabet to its proper place.",
        "Celebration of literacy where the protagonist reads their first complete message, writes their name, or sees the world transformed by their new knowledge.",
      ],
    },

    settingVariations: [
      "Alphabet Forest where each tree represents a different letter",
      "Letter Library with magical books that only open for correct letter identification",
      "Alphabet Kingdom with 26 different domains, each ruled by its letter",
      "Treasure Island where letters are hidden gems that form words when combined",
    ],

    visualMotifs: [
      "Letters that glow when correctly identified",
      "Alphabet patterns in nature - clouds shaped like letters, letter-patterns in flower arrangements",
      "Magical letter transformations - A becoming an arrow, O becoming a wheel",
      "Written words that come to life when spelled correctly",
    ],

    colorPaletteSuggestions: [
      "Bright primary colors for consonants, soft pastels for vowels",
      "Rainbow progression where each letter has its own color family",
      "Golden letters against deep blues and greens for a magical feel",
    ],

    learningObjectives: [
      "Letter recognition and identification",
      "Understanding that letters make sounds",
      "Basic phonetic awareness",
      "Letter-to-word connection",
      "Beginning spelling concepts",
    ],

    skillBuilding: [
      "Visual discrimination between similar letters",
      "Sound-letter correspondence",
      "Sequential thinking (alphabet order)",
      "Pattern recognition in letter shapes",
    ],

    themeIntegration:
      "Frame alphabet learning as unlocking the fundamental magic of communication and literacy, showing how mastering letters opens doors to infinite stories and knowledge.",
  },

  "learning-to-count": {
    theme: "Educational",
    subject: "Learning to Count",
    premise:
      "Numbers become living, breathing entities with personalities and powers that help the protagonist solve problems and unlock secrets in a mathematically magical world.",
    coreConflict:
      "A counting crisis threatens the natural order - perhaps numbers are disappearing, or mathematical balance is disrupted, requiring the protagonist to master numerical concepts to restore harmony.",
    emotionalJourney:
      "Progress from number confusion or math anxiety to confidence and enjoyment in mathematical thinking, discovering that numbers are helpful friends rather than mysterious challenges.",

    storyArchetypes: [
      {
        name: "The Number Guardian",
        description:
          "The protagonist must protect the Kingdom of Numbers from chaos by learning to count and maintain numerical order.",
        characterRoles:
          "Companions can be living numbers with distinct personalities, or mathematical concept creatures like Addition Owl or Subtraction Snake.",
        exampleScenario:
          "Number 5 has gone missing, causing groups of 5 things to become unstable. The protagonist must find and count to 5 repeatedly to restore balance.",
      },
      {
        name: "The Counting Collector",
        description:
          "The protagonist gathers sets of magical objects, discovering that the power comes from accurate counting and grouping.",
        characterRoles:
          "Companions help with different counting strategies - one might count by twos, another specializes in organizing groups.",
        exampleScenario:
          "Collecting 7 starlight gems requires counting various groups and combinations that add up to 7.",
      },
      {
        name: "The Pattern Solver",
        description:
          "Mathematical patterns hold the key to solving puzzles and helping others, with counting as the foundation skill.",
        characterRoles:
          "Companions represent different mathematical concepts, each contributing their special counting ability to solve larger problems.",
        exampleScenario:
          "A bridge only appears when someone counts the correct sequence - 2, 4, 6, 8 - stepping stones.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Create counting challenges that feel like treasure hunts or puzzle solving. Use environmental counting opportunities and responsive magical elements that react to correct counting.",
      companionIntegration:
        "Assign different counting specialties to companions - one loves counting by fives, another is great with shapes. Create opportunities for mathematical collaboration.",
      groupDynamics:
        "Develop group counting games and challenges where characters must work together to reach number goals, share counting responsibilities, or combine their counting abilities.",
    },

    sceneGuidance: {
      setupPhase: [
        "Establish a world where numbers have visible importance and power. Show simple counting in natural, meaningful contexts.",
        "Introduce the numerical problem - quantities are wrong, patterns are broken, or important counts have been lost.",
        "First successful counting victory that demonstrates the protagonist's potential and the satisfaction of mathematical accuracy.",
      ],
      developmentPhase: [
        "Progressive counting challenges with increasing complexity - from small groups to larger sets, introducing concepts like 'more than' and 'less than'.",
        "Scene where incorrect counting leads to mild consequences, emphasizing the importance of accuracy and patience in mathematical thinking.",
        "Discovery moment where the protagonist realizes they can count higher or in new ways than they thought possible.",
      ],
      resolutionPhase: [
        "Major counting challenge that requires using all learned number skills - perhaps counting backwards, skip counting, or organizing large quantities.",
        "Climactic scene where mathematical thinking saves the day or solves the central problem, showing numbers as powerful tools.",
        "Celebration where the protagonist demonstrates their numerical mastery and helps others discover the joy of counting.",
      ],
    },

    settingVariations: [
      "Number Factory where quantities must be carefully managed and counted",
      "Counting Carnival with mathematical games and number-based attractions",
      "Numerical Nature Reserve where everything comes in specific countable groups",
      "Time Kingdom where counting controls the passage of time and daily rhythms",
    ],

    visualMotifs: [
      "Objects that multiply or divide based on counting accuracy",
      "Number trails and paths that appear when counted correctly",
      "Magical scales and balances that respond to quantity understanding",
      "Counting creatures that appear in groups corresponding to numbers",
    ],

    colorPaletteSuggestions: [
      "Each number 1-10 has its own signature color for easy visual association",
      "Warm colors for odd numbers, cool colors for evens",
      "Rainbow progression showing numerical sequences in color gradients",
    ],

    learningObjectives: [
      "Rote counting 1-10 (or higher based on age)",
      "One-to-one correspondence (pointing while counting)",
      "Cardinality (understanding the last number counted represents the total)",
      "Number recognition and identification",
      "Basic concepts of more, less, and equal",
    ],

    skillBuilding: [
      "Visual quantity estimation",
      "Pattern recognition in number sequences",
      "Beginning addition and subtraction concepts",
      "Spatial reasoning through grouping and organizing",
    ],

    themeIntegration:
      "Present mathematics as a magical language for understanding and organizing the world, where counting skills unlock the ability to solve problems and discover patterns in everything.",
  },

  // Continue with more subjects...
  "shapes-and-colours": {
    theme: "Educational",
    subject: "Shapes and Colours",
    premise:
      "Enter a vibrant world where shapes and colors are the fundamental building blocks of reality, each possessing unique properties and personalities that the protagonist must understand to navigate and improve their environment.",
    coreConflict:
      "The world has lost its color and shape diversity - perhaps everything has turned grey and formless, or shapes and colors are fighting and need to learn to work together harmoniously.",
    emotionalJourney:
      "Journey from seeing shapes and colors as simple visual elements to understanding them as powerful tools for creativity, organization, and problem-solving, developing aesthetic appreciation and spatial reasoning.",

    storyArchetypes: [
      {
        name: "The Shape Shifter",
        description:
          "The protagonist can transform into different shapes, learning each shape's unique abilities and uses through personal experience.",
        characterRoles:
          "Companions can be living geometric shapes with distinct personalities - Circle is bouncy and friendly, Triangle is sharp and decisive, Square is stable and reliable.",
        exampleScenario:
          "To cross a river, the protagonist must become a circle to roll, then a triangle to cut through obstacles, then a square to build a stable bridge.",
      },
      {
        name: "The Color Keeper",
        description:
          "The protagonist is responsible for maintaining the world's colors, learning about color mixing, emotional associations, and the role colors play in nature.",
        characterRoles:
          "Companions represent primary colors that can combine their powers, or creatures associated with specific colors like a red cardinal or blue whale.",
        exampleScenario:
          "The autumn forest has lost its colors. The protagonist must mix red and yellow to create orange for the falling leaves.",
      },
      {
        name: "The Pattern Maker",
        description:
          "The protagonist discovers they can create powerful patterns and designs using shapes and colors, with each combination producing different magical effects.",
        characterRoles:
          "Companions contribute different design elements - one provides shapes, another provides colors, together creating beautiful and functional patterns.",
        exampleScenario:
          "Creating a mandala with specific shapes and colors that heals a sick garden or calms a storm.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on personal discovery of how shapes and colors affect emotions and functionality. Use responsive environments that change based on shape and color choices.",
      companionIntegration:
        "Assign shape or color specialties to companions, creating opportunities for creative collaboration and learning about combinations.",
      groupDynamics:
        "Create collaborative art projects where each character contributes their unique shape or color expertise to solve aesthetic and practical problems.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce a world rich with shapes and colors, showing their importance in daily life and natural beauty.",
        "Present the crisis - colors fading, shapes becoming distorted, or aesthetic harmony being disrupted.",
        "First discovery of the protagonist's ability to identify, create, or restore shapes and colors effectively.",
      ],
      developmentPhase: [
        "Shape exploration adventure where different shapes prove useful for different challenges - circles roll, triangles cut, squares stack.",
        "Color mixing experimentation scene where the protagonist learns how primary colors combine to create new possibilities.",
        "Problem-solving moment where specific shape and color knowledge helps overcome a significant obstacle.",
      ],
      resolutionPhase: [
        "Creative challenge requiring advanced understanding of both shapes and colors working together in complex patterns or designs.",
        "Climactic scene where the protagonist's mastery of shapes and colors saves the day or creates something beautiful and meaningful.",
        "Celebration of creativity where the protagonist's artistic vision brings joy and harmony to their world.",
      ],
    },

    settingVariations: [
      "Geometric Kingdom where each region is dominated by different shapes",
      "Rainbow Valley where colors flow like rivers and pool in lakes",
      "Artist's Workshop where shapes and colors come alive as tools and materials",
      "Kaleidoscope Castle where patterns constantly shift and change",
    ],

    visualMotifs: [
      "Shape transformations and combinations creating new forms",
      "Color gradients and mixing effects showing transformation",
      "Pattern repetitions and symmetries in nature and architecture",
      "Emotional color associations - warm colors for happiness, cool colors for calm",
    ],

    colorPaletteSuggestions: [
      "Full spectrum rainbow with clear primary, secondary, and tertiary distinctions",
      "Monochromatic scenes that gradually introduce new colors",
      "High contrast combinations that highlight shape definitions",
    ],

    learningObjectives: [
      "Basic shape recognition (circle, square, triangle, rectangle, oval)",
      "Primary color identification (red, blue, yellow)",
      "Understanding color mixing to create secondary colors",
      "Shape sorting and categorization skills",
      "Visual pattern recognition and creation",
    ],

    skillBuilding: [
      "Spatial reasoning through shape manipulation",
      "Aesthetic development through color appreciation",
      "Fine motor skills through shape tracing and color application",
      "Problem-solving through geometric thinking",
    ],

    themeIntegration:
      "Present shapes and colors as the fundamental language of visual creativity and spatial understanding, showing how mastering these elements empowers artistic expression and logical thinking.",
  },
};

// FAIRY TALES THEME SUBJECT PROMPTS
export const FAIRY_TALES_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  "fairy-tales-classic": {
    theme: "Fairy Tales",
    subject: "Fairy Tales",
    premise:
      "Reimagine classic fairy tale elements with the protagonist as the active hero, modernizing traditional stories while maintaining their magical essence and moral teachings.",
    coreConflict:
      "Classic fairy tale problems - curses to break, quests to complete, or magical imbalances to restore - but with the protagonist taking charge rather than waiting for rescue.",
    emotionalJourney:
      "Experience the wonder and magic of traditional storytelling while developing confidence in problem-solving and the belief that even small heroes can overcome great challenges.",

    storyArchetypes: [
      {
        name: "The Curse Breaker",
        description:
          "The protagonist discovers they have the power to break curses through acts of kindness, cleverness, or personal growth.",
        characterRoles:
          "Companions can be cursed creatures seeking help, wise mentors offering guidance, or fellow heroes on parallel quests.",
        exampleScenario:
          "A village is under a sleeping curse. The protagonist must collect three acts of genuine kindness to awaken everyone.",
      },
      {
        name: "The Magic Helper",
        description:
          "Instead of receiving magical help, the protagonist becomes the one who provides magical assistance to others in traditional fairy tale predicaments.",
        characterRoles:
          "Companions might be classic fairy tale characters (the third little pig, a lost prince, a sad giant) who need the protagonist's help.",
        exampleScenario:
          "The protagonist helps Cinderella by organizing the other mice to complete chores faster, teaching collaboration over magic.",
      },
      {
        name: "The Tale Weaver",
        description:
          "The protagonist can enter and influence different fairy tales, learning lessons from each story while helping to improve their outcomes.",
        characterRoles:
          "Companions from different fairy tales join the adventure, each bringing their unique story wisdom and perspective.",
        exampleScenario:
          "Visiting Little Red Riding Hood's story to teach the wolf about friendship instead of trickery.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on personal transformation through fairy tale challenges, with magical creatures and environments providing guidance and opposition.",
      companionIntegration:
        "Include classic fairy tale characters as companions, each contributing their story's wisdom and unique magical perspective.",
      groupDynamics:
        "Create ensembles mixing classic characters with original ones, showing how different fairy tale lessons combine to solve complex problems.",
    },

    sceneGuidance: {
      setupPhase: [
        "Establish the fairy tale world with familiar magical elements but fresh perspectives, introducing the protagonist's ordinary world before magic intrudes.",
        "Present the fairy tale problem - someone needs help, a curse needs breaking, or a magical imbalance threatens the happy ending.",
        "First magical encounter that reveals the protagonist's special role or ability within the fairy tale framework.",
      ],
      developmentPhase: [
        "Classic fairy tale challenges adapted for active protagonist participation - outwitting villains, solving magical puzzles, or helping other characters.",
        "Moral choice moment where the protagonist must decide between easy magical solutions and harder but more meaningful personal growth.",
        "Discovery of inner strength or wisdom that proves more powerful than traditional magic items or supernatural aid.",
      ],
      resolutionPhase: [
        "Confrontation with the story's primary challenge using learned lessons and developed character rather than magic alone.",
        "Climactic scene where the protagonist's growth and choices determine the outcome, creating a new and better version of the classic tale.",
        "Happily ever after that emphasizes personal accomplishment and positive change rather than external rewards.",
      ],
    },

    settingVariations: [
      "Enchanted forests with talking animals and hidden cottages",
      "Magic kingdoms with castles, royal courts, and noble quests",
      "Mystical villages where ordinary people encounter extraordinary magic",
      "Fairy tale crossroads where different stories intersect and influence each other",
    ],

    visualMotifs: [
      "Classical fairy tale imagery updated for modern sensibilities",
      "Magical transformations that reflect inner character development",
      "Traditional symbols (roses, mirrors, keys, crowns) with fresh meanings",
      "Seasonal and natural magic reflecting emotional and narrative cycles",
    ],

    colorPaletteSuggestions: [
      "Royal jewel tones - deep purples, emerald greens, ruby reds",
      "Magical twilight colors - soft purples, silver, deep blue with gold accents",
      "Enchanted forest palettes - rich browns, mossy greens, golden sunlight",
    ],

    learningObjectives: [
      "Understanding narrative structure and moral lessons",
      "Recognizing classic story patterns and archetypes",
      "Developing empathy through character perspective-taking",
      "Learning about consequences and personal responsibility",
    ],

    skillBuilding: [
      "Creative problem-solving through story logic",
      "Moral reasoning and ethical decision-making",
      "Cultural literacy through fairy tale knowledge",
      "Imagination and creative thinking skills",
    ],

    themeIntegration:
      "Blend timeless fairy tale magic with empowering modern values, showing how classic stories can teach contemporary lessons about courage, kindness, and personal agency.",
  },
};

// ADVENTURE THEME SUBJECT PROMPTS
export const ADVENTURE_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  pirates: {
    theme: "Adventure",
    subject: "Pirates",
    premise:
      "Transform pirate adventures into heroic tales of friendship, problem-solving, and standing up for what's right, where the protagonist becomes a brave leader who uses wisdom and courage rather than force.",
    coreConflict:
      "Encounter with pirates who initially seem threatening but reveal deeper needs - perhaps they're lost, misunderstood, or facing their own challenges that the protagonist can help resolve.",
    emotionalJourney:
      "Move from fear or apprehension about pirates to understanding and friendship, learning that people aren't always what they seem and that courage comes from helping others.",

    storyArchetypes: [
      {
        name: "The Pirate Peacemaker",
        description:
          "The protagonist helps resolve conflicts between pirates and others, showing that understanding and compromise work better than fighting.",
        characterRoles:
          "Companions can be reformed pirates, sea creatures, or other children who learn alongside the protagonist about conflict resolution.",
        exampleScenario:
          "Two pirate crews are fighting over a treasure island. The protagonist discovers the treasure is actually something that benefits everyone when shared.",
      },
      {
        name: "The Treasure Seeker",
        description:
          "The protagonist joins or leads a treasure hunt but discovers the real treasure is friendship, knowledge, or helping others.",
        characterRoles:
          "Companions represent different skills needed for treasure hunting - navigation, problem-solving, or moral guidance.",
        exampleScenario:
          "Following a treasure map leads to helping a community in need rather than finding gold.",
      },
      {
        name: "The Sea Protector",
        description:
          "The protagonist becomes a guardian of the seas, helping pirates understand the importance of protecting ocean environments and creatures.",
        characterRoles:
          "Companions include sea animals who need protection, environmental spirits, or pirates learning to be ocean stewards.",
        exampleScenario:
          "Pirates are unknowingly polluting the ocean. The protagonist shows them how their actions affect sea life and helps them become protectors instead.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on personal courage development and problem-solving skills, with pirate encounters serving as challenges that build confidence and wisdom.",
      companionIntegration:
        "Include both pirate and non-pirate companions, creating opportunities for cultural exchange and mutual learning about different ways of life.",
      groupDynamics:
        "Create diverse crews where everyone contributes unique skills, showing how teamwork and cooperation make adventures more successful and enjoyable.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce the maritime world with excitement about sea adventures but healthy respect for the ocean's power and mystery.",
        "First pirate encounter that initially seems threatening but reveals complexity - pirates who are lost, hurt, or facing their own challenges.",
        "Discovery that the protagonist has skills or knowledge that pirates respect and need, establishing mutual potential benefit.",
      ],
      developmentPhase: [
        "Collaborative adventure where protagonist and pirates must work together to overcome shared obstacles like storms, sea monsters, or navigational challenges.",
        "Moral choice moment where protagonist must decide whether to help pirates even when it's difficult or potentially risky.",
        "Discovery scene where both protagonist and pirates learn something valuable about each other, breaking down stereotypes and building trust.",
      ],
      resolutionPhase: [
        "Major challenge requiring all learned skills and relationships - perhaps saving the ship, rescuing someone in danger, or protecting the ocean environment.",
        "Climactic scene where protagonist's leadership and the power of friendship overcome the story's central conflict without violence.",
        "Resolution celebrating new understanding between different groups and the protagonist's growth as a leader and friend.",
      ],
    },

    settingVariations: [
      "Tropical islands with hidden coves, palm beaches, and crystal-clear lagoons",
      "Pirate ports bustling with diverse characters and maritime activities",
      "Open ocean with dramatic weather, sea creatures, and navigation challenges",
      "Underwater worlds accessible through diving or magical means",
    ],

    visualMotifs: [
      "Treasure maps and navigational tools as symbols of adventure and discovery",
      "Ships and boats representing journey and exploration",
      "Ocean life showcasing the beauty and importance of marine environments",
      "Flags and symbols representing different groups learning to coexist",
    ],

    colorPaletteSuggestions: [
      "Ocean blues and seafoam greens with warm sandy browns",
      "Sunset colors reflecting on water - oranges, pinks, and purples",
      "Tropical bright colors - coral pinks, palm greens, and sunny yellows",
    ],

    learningObjectives: [
      "Understanding that people aren't always what they first appear to be",
      "Learning about ocean environments and maritime life",
      "Developing problem-solving skills for adventure challenges",
      "Building confidence in leadership and conflict resolution",
    ],

    skillBuilding: [
      "Navigation and basic geography concepts",
      "Teamwork and collaboration skills",
      "Critical thinking about stereotypes and assumptions",
      "Environmental awareness and conservation values",
    ],

    themeIntegration:
      "Frame pirate adventures as opportunities for heroic leadership and bridge-building between different groups, emphasizing courage, understanding, and environmental stewardship over conflict.",
  },
};

// Helper function to generate story premise section

// ACTIVITIES THEME SUBJECT PROMPTS
export const ACTIVITIES_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  "cooking-and-baking": {
    theme: "Activities",
    subject: "Cooking and Baking",
    premise:
      "Transform the kitchen into a magical laboratory where the protagonist discovers that cooking and baking are forms of edible artistry and scientific experimentation that bring joy to others.",
    coreConflict:
      "A cooking challenge or kitchen crisis requires the protagonist to learn proper techniques, follow instructions carefully, and understand how ingredients work together to create something delicious.",
    emotionalJourney:
      "Progress from kitchen uncertainty or fear of making mistakes to confidence and creative joy in food preparation, discovering the satisfaction of creating something that nourishes and delights others.",

    storyArchetypes: [
      {
        name: "The Recipe Detective",
        description:
          "The protagonist must solve culinary mysteries by understanding how different ingredients and techniques work together.",
        characterRoles:
          "Companions can be talking kitchen utensils, ingredient characters with personalities, or experienced cooks sharing their wisdom.",
        exampleScenario:
          "A family recipe has gone missing, and the protagonist must recreate it by understanding the science and love behind each ingredient.",
      },
      {
        name: "The Kitchen Magician",
        description:
          "The protagonist discovers that cooking is like casting spells, where precise measurements and proper techniques create magical transformations.",
        characterRoles:
          "Companions might include measurement helpers, timer keepers, or taste-testers who provide feedback and encouragement.",
        exampleScenario:
          "Flour transforms into bread through the magic of yeast, kneading, and patience - teaching the protagonist about transformation and time.",
      },
      {
        name: "The Feast Maker",
        description:
          "The protagonist learns to cook not just for themselves but to bring joy and nourishment to family, friends, or community.",
        characterRoles:
          "Companions represent different dietary needs or preferences, teaching inclusivity and thoughtfulness in cooking.",
        exampleScenario:
          "Preparing a special meal for someone who's sick, celebrating a friend's birthday, or contributing to a community feast.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on personal discovery and skill building, with responsive kitchen elements and ingredient characters providing guidance and feedback.",
      companionIntegration:
        "Include family members, friends, or magical kitchen helpers who each contribute different cooking skills and cultural food perspectives.",
      groupDynamics:
        "Create collaborative cooking projects where each character contributes their specialty, teaching teamwork and shared responsibility in meal creation.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce the kitchen as an exciting place of possibility, showing basic safety rules and the joy of food preparation.",
        "Present the cooking challenge - a special occasion requiring a homemade dish, helping someone through food, or learning a new skill.",
        "First successful cooking moment that builds confidence and shows the protagonist's natural curiosity about food preparation.",
      ],
      developmentPhase: [
        "Ingredient exploration scene where the protagonist learns about different foods, their origins, and how they contribute to recipes.",
        "Technique learning adventure - measuring, mixing, timing - with gentle mistakes that lead to improved understanding.",
        "Cultural or family tradition moment where cooking connects the protagonist to heritage and community.",
      ],
      resolutionPhase: [
        "Complex recipe challenge that requires all learned skills - following directions, proper technique, patience, and creativity.",
        "Climactic cooking moment where the protagonist's new skills help them create something truly special and meaningful.",
        "Sharing celebration where the protagonist's cooking brings joy to others and demonstrates the love expressed through food.",
      ],
    },

    settingVariations: [
      "Cozy home kitchen filled with family memories and favorite recipes",
      "Magical cooking school where ingredients come to life and teach lessons",
      "Community kitchen where diverse cultures share their culinary traditions",
      "Outdoor cooking adventure with campfires, fresh ingredients, and nature's bounty",
    ],

    visualMotifs: [
      "Ingredient transformations showing the magic of cooking processes",
      "Steam, bubbling, and other cooking effects that demonstrate chemical changes",
      "Colorful fresh ingredients arranged artistically",
      "Hands working with dough, batter, or other tactile cooking experiences",
    ],

    colorPaletteSuggestions: [
      "Warm kitchen colors - golden browns, creamy whites, rich reds from tomatoes and spices",
      "Fresh ingredient colors - vibrant greens, sunny yellows, deep purples of fruits and vegetables",
      "Cozy cooking atmosphere - warm oranges and soft yellows suggesting warmth and comfort",
    ],

    learningObjectives: [
      "Kitchen safety awareness and basic hygiene practices",
      "Understanding measurement and following step-by-step instructions",
      "Learning about nutrition and healthy food choices",
      "Developing patience and attention to detail",
    ],

    skillBuilding: [
      "Fine motor skills through measuring, stirring, and food preparation",
      "Mathematical concepts through recipe measurements and timing",
      "Scientific thinking through understanding ingredient interactions",
      "Cultural appreciation through diverse food traditions",
    ],

    themeIntegration:
      "Present cooking and baking as creative activities that combine science, art, and love, showing how food preparation connects people and expresses care for others.",
  },

  gardening: {
    theme: "Activities",
    subject: "Gardening",
    premise:
      "Discover the magical world of gardening where the protagonist learns that plants are living partners in creating beauty and nourishment, requiring patience, care, and understanding of natural cycles.",
    coreConflict:
      "Garden challenges like drought, pests, or plant diseases require the protagonist to become a plant detective and caretaker, learning what plants need to thrive.",
    emotionalJourney:
      "Grow from impatience with slow plant growth to appreciation of natural timing, developing nurturing instincts and understanding of responsibility and reward cycles.",

    storyArchetypes: [
      {
        name: "The Plant Whisperer",
        description:
          "The protagonist develops the ability to understand what plants need and communicate with them to create a thriving garden.",
        characterRoles:
          "Companions can be plant spirits, helpful insects, weather elements, or experienced gardeners sharing wisdom.",
        exampleScenario:
          "The protagonist learns that wilting flowers are thirsty, drooping leaves mean too much water, and yellow leaves indicate nutrient needs.",
      },
      {
        name: "The Seed Keeper",
        description:
          "The protagonist becomes responsible for preserving and planting seeds, learning about plant life cycles and the importance of biodiversity.",
        characterRoles:
          "Companions might include different types of seeds with personalities, pollinating animals, or plant guardians from different ecosystems.",
        exampleScenario:
          "Collecting seeds from the best plants at the end of summer to ensure next year's garden, learning about genetic diversity and adaptation.",
      },
      {
        name: "The Garden Healer",
        description:
          "The protagonist learns to diagnose and solve garden problems, becoming a plant doctor who understands ecosystems and natural balance.",
        characterRoles:
          "Companions represent beneficial insects, soil microorganisms, or natural elements that help maintain garden health.",
        exampleScenario:
          "Discovering that ladybugs eat aphids, earthworms improve soil, and companion planting helps plants protect each other.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on the personal relationship between protagonist and plants, with nature itself providing guidance through seasonal changes and plant responses.",
      companionIntegration:
        "Include knowledgeable mentors, helpful animals, or friends learning alongside, each contributing different aspects of garden wisdom.",
      groupDynamics:
        "Create community garden scenarios where different characters tend different types of plants, sharing knowledge and celebrating collective harvest success.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce gardening as an exciting partnership with nature, showing the potential for growth and beauty in small seeds.",
        "Present the gardening challenge - starting a new garden, reviving a neglected space, or helping plants in trouble.",
        "First planting success that demonstrates the protagonist's natural connection to growing things and builds anticipation for results.",
      ],
      developmentPhase: [
        "Plant care learning adventure - watering, weeding, feeding - with visible plant responses that reinforce proper techniques.",
        "Problem-solving scene where garden challenges require research, observation, and creative solutions.",
        "Seasonal change moment where the protagonist witnesses and adapts to natural cycles and timing.",
      ],
      resolutionPhase: [
        "Garden crisis that requires all learned skills - drought, storm damage, or pest invasion that threatens the entire garden.",
        "Climactic scene where the protagonist's knowledge and dedication save the garden or achieve a major growing milestone.",
        "Harvest celebration where the protagonist enjoys the literal fruits of their labor and shares abundance with others.",
      ],
    },

    settingVariations: [
      "Backyard vegetable garden with neat rows and climbing vines",
      "Magical fairy garden with tiny plants and miniature ecosystems",
      "Community garden where diverse people grow diverse plants",
      "Greenhouse laboratory where controlled conditions enable year-round growing",
    ],

    visualMotifs: [
      "Time-lapse growth sequences showing seed to harvest transformation",
      "Root systems and underground activity revealing hidden plant processes",
      "Seasonal changes displaying natural cycles and adaptation",
      "Beneficial insects and soil life demonstrating ecosystem connections",
    ],

    colorPaletteSuggestions: [
      "Natural earth tones - rich browns, deep greens, warm terracotta",
      "Growth progression colors - from pale green shoots to deep mature foliage",
      "Flower and fruit colors - bright reds, sunny yellows, deep purples showing garden diversity",
    ],

    learningObjectives: [
      "Understanding plant life cycles and basic botany",
      "Learning about soil, water, and sunlight requirements",
      "Developing patience and long-term thinking",
      "Understanding ecological relationships and sustainability",
    ],

    skillBuilding: [
      "Observation skills through plant monitoring",
      "Responsibility and routine through regular plant care",
      "Problem-solving through garden challenge management",
      "Scientific thinking through hypothesis testing with plants",
    ],

    themeIntegration:
      "Frame gardening as a partnership with nature that teaches patience, responsibility, and the rewards of nurturing care, connecting the protagonist to natural cycles and environmental stewardship.",
  },
};

// STORIES THEME SUBJECT PROMPTS
export const STORIES_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  "bedtime-story": {
    theme: "Stories",
    subject: "Bedtime Story",
    premise:
      "Create a gentle, soothing narrative that helps the protagonist (and reader) transition from the excitement of the day to the calm peace of nighttime, celebrating rest as a natural and wonderful part of life.",
    coreConflict:
      "Mild bedtime resistance or nighttime fears that are gently resolved through understanding, comfort rituals, or discovering the magic and beauty of nighttime.",
    emotionalJourney:
      "Transition from daytime energy or nighttime anxiety to peaceful contentment and sleepy satisfaction, learning that bedtime is safe, cozy, and filled with gentle magic.",

    storyArchetypes: [
      {
        name: "The Dream Keeper",
        description:
          "The protagonist becomes responsible for collecting and protecting good dreams for themselves and others, learning that sleep brings wonderful adventures.",
        characterRoles:
          "Companions can be dream creatures, sleepy animals, or gentle nighttime guardians who help create peaceful sleep.",
        exampleScenario:
          "Gathering scattered dreams that have blown away in a gentle wind, returning them to sleeping children around the world.",
      },
      {
        name: "The Night Explorer",
        description:
          "The protagonist discovers the gentle magic that happens while the daytime world sleeps - nocturnal animals, star movements, or dream activities.",
        characterRoles:
          "Companions include friendly nocturnal animals, sleepy moon spirits, or gentle night creatures who show the peaceful side of darkness.",
        exampleScenario:
          "Taking a magical journey through the quiet nighttime world, seeing how different creatures rest and how nature prepares for tomorrow.",
      },
      {
        name: "The Sleep Helper",
        description:
          "The protagonist learns bedtime rituals and techniques that help them and others settle into comfortable, peaceful sleep.",
        characterRoles:
          "Companions might be family members, stuffed animals, or sleepy characters who each have their own special bedtime traditions.",
        exampleScenario:
          "Teaching a worried teddy bear how to feel safe at bedtime through cozy routines and comfort objects.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on personal bedtime rituals and the protagonist's relationship with sleep, using gentle internal monologue and soothing environmental elements.",
      companionIntegration:
        "Include comforting presence of family, pets, or beloved toys that provide security and shared bedtime experiences.",
      groupDynamics:
        "Create gentle group bedtime scenarios with siblings, friends, or extended family sharing peaceful evening activities together.",
    },

    sceneGuidance: {
      setupPhase: [
        "Establish the transition from active day to quiet evening, showing natural tiredness and the approach of bedtime.",
        "Introduce mild bedtime reluctance or concern that needs gentle resolution - fear of the dark, not wanting fun to end, or worry about tomorrow.",
        "Begin bedtime routine that demonstrates comfort, safety, and the positive aspects of preparing for sleep.",
      ],
      developmentPhase: [
        "Bedtime ritual sequence - bath time, tooth brushing, pajama selection, story reading - shown as pleasant and meaningful activities.",
        "Comfort-seeking moment where the protagonist finds or creates something that makes bedtime feel safe and special.",
        "Quiet bonding time with family, pets, or beloved objects that reinforces love and security.",
      ],
      resolutionPhase: [
        "Final bedtime preparation with all comfort elements in place - perfect pillow arrangement, favorite stuffed animal, gentle nightlight.",
        "Peaceful settling moment where the protagonist feels completely safe, loved, and ready for sleep and dreams.",
        "Gentle transition to sleep with suggestions of wonderful dreams to come and the promise of a bright new day ahead.",
      ],
    },

    settingVariations: [
      "Cozy bedroom with soft lighting, comfortable bed, and personal treasures",
      "Magical dreamscape where the boundary between wake and sleep becomes fluid and beautiful",
      "Peaceful house at nighttime with gentle sounds and warm, secure feelings",
      "Nature settings at dusk with settling birds, gentle evening breezes, and star emergence",
    ],

    visualMotifs: [
      "Soft, warm lighting that gradually dims as sleep approaches",
      "Comfortable textures - soft blankets, cuddly stuffed animals, smooth pajamas",
      "Gentle movement - rocking chairs, swaying curtains, slowly closing eyes",
      "Dreamy transitions - reality becoming softer and more magical as sleep nears",
    ],

    colorPaletteSuggestions: [
      "Soft pastels - gentle blues, warm lavenders, soft pinks, creamy whites",
      "Nighttime colors - deep navy blues with silver stars, warm golden lamplight",
      "Comfort colors - soft browns, warm beiges, gentle greens suggesting security and peace",
    ],

    learningObjectives: [
      "Understanding that sleep is natural, necessary, and beneficial",
      "Learning healthy bedtime routines and sleep hygiene",
      "Developing comfort with nighttime and darkness",
      "Recognizing the importance of rest for growth and health",
    ],

    skillBuilding: [
      "Self-soothing techniques and emotional regulation",
      "Routine establishment and following sequential steps",
      "Independence in bedtime preparation",
      "Positive associations with sleep and dreaming",
    ],

    themeIntegration:
      "Present bedtime as a peaceful, magical transition that ends each day with comfort and love, emphasizing that sleep is a wonderful part of life that brings rest, dreams, and preparation for tomorrow's adventures.",
  },

  "humorous-story": {
    theme: "Stories",
    subject: "Humorous Story",
    premise:
      "Create a lighthearted adventure where the protagonist encounters silly situations, makes amusing mistakes, or meets funny characters, learning that laughter makes life more enjoyable and problems easier to solve.",
    coreConflict:
      "Comedic predicaments or silly misunderstandings that need to be resolved through creative thinking, good humor, and the ability to laugh at oneself.",
    emotionalJourney:
      "Progress from taking everything too seriously to discovering the joy and problem-solving power of humor, learning that laughter connects people and makes challenges more manageable.",

    storyArchetypes: [
      {
        name: "The Giggle Generator",
        description:
          "The protagonist discovers they have the power to create laughter and joy, using humor to solve problems and help others feel better.",
        characterRoles:
          "Companions can be naturally funny characters, joke-telling animals, or friends who appreciate and contribute to humor.",
        exampleScenario:
          "Using silly jokes and funny faces to cheer up a sad friend or diffuse a tense situation between other characters.",
      },
      {
        name: "The Mistake Maker",
        description:
          "The protagonist's well-intentioned mistakes lead to funny situations that ultimately teach valuable lessons about resilience and not taking oneself too seriously.",
        characterRoles:
          "Companions might be equally mistake-prone friends, understanding mentors, or characters who help turn mistakes into learning opportunities.",
        exampleScenario:
          "Trying to help with household chores but creating amusing chaos that leads to discovering new, better ways to accomplish tasks.",
      },
      {
        name: "The Comedy Detective",
        description:
          "The protagonist solves mysteries or problems using unconventional, funny approaches that prove more effective than serious methods.",
        characterRoles:
          "Companions provide different types of humor - physical comedy, wordplay, or situational awareness - contributing to creative problem-solving.",
        exampleScenario:
          "Solving the mystery of missing cookies by following a trail of silly clues that leads to discovering someone was secretly sharing treats with hungry animals.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on the protagonist's internal humor development, with funny situations arising from their interactions with the environment and their own creative perspective.",
      companionIntegration:
        "Include characters with complementary humor styles - some physical comedians, others verbal jokesters - creating dynamic funny interactions.",
      groupDynamics:
        "Develop ensemble comedy where different characters contribute to group humor, showing how shared laughter strengthens friendships and solves problems.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce the protagonist in a situation ripe for gentle comedy - perhaps taking something too seriously or encountering an amusing problem.",
        "Present the comedic challenge - a silly misunderstanding, a funny predicament, or a problem that conventional approaches can't solve.",
        "First laugh moment that shows the protagonist's capacity for humor and its positive effects on themselves and others.",
      ],
      developmentPhase: [
        "Escalating comedy sequence where attempts to fix problems create more amusing complications, but each step teaches something valuable.",
        "Character development moment where humor helps the protagonist connect with others or see situations from new, more positive perspectives.",
        "Creative problem-solving scene where unconventional, funny approaches prove surprisingly effective.",
      ],
      resolutionPhase: [
        "Climactic comedy moment where all elements come together in a satisfying, funny resolution that solves the main problem.",
        "Celebration of humor's power where the protagonist's ability to find and create laughter helps others and strengthens relationships.",
        "Feel-good conclusion showing how humor has improved the protagonist's life and relationships, with promise of more laughter to come.",
      ],
    },

    settingVariations: [
      "Everyday environments made extraordinary through humorous perspective and silly events",
      "Comedy clubs or performance spaces where humor is celebrated and shared",
      "Upside-down or backwards worlds where normal rules don't apply and funny logic prevails",
      "Schools or playgrounds where natural childhood humor and play create comedy opportunities",
    ],

    visualMotifs: [
      "Exaggerated expressions and physical comedy poses",
      "Visual puns and sight gags that children can understand and enjoy",
      "Cause-and-effect comedy sequences showing funny consequences",
      "Transformation comedy where ordinary objects become hilariously different",
    ],

    colorPaletteSuggestions: [
      "Bright, cheerful colors that enhance the comedic mood - sunny yellows, vibrant oranges, happy pinks",
      "Contrasting color combinations that create visual comedy and surprise",
      "Rainbow palettes suggesting joy, celebration, and the colorful nature of humor",
    ],

    learningObjectives: [
      "Understanding that mistakes are normal and can lead to learning",
      "Developing resilience and the ability to laugh at oneself",
      "Learning that humor can help solve problems and improve relationships",
      "Recognizing appropriate times and ways to use humor",
    ],

    skillBuilding: [
      "Creative thinking through unconventional problem-solving",
      "Social skills through shared laughter and joke appreciation",
      "Emotional regulation through humor as a coping mechanism",
      "Communication skills through storytelling and joke-telling",
    ],

    themeIntegration:
      "Present humor as a valuable life skill that brings joy, solves problems, and connects people, showing that the ability to laugh - especially at oneself - makes life richer and more enjoyable.",
  },
};

// HOLIDAYS THEME SUBJECT PROMPTS
export const HOLIDAYS_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  birthday: {
    theme: "Holidays",
    subject: "Birthday",
    premise:
      "Celebrate the protagonist's special day as a personal holiday that honors their growth, uniqueness, and the joy they bring to others, while learning about traditions, gratitude, and sharing happiness.",
    coreConflict:
      "Birthday challenges like disappointment with plans, sharing attention with others, or learning to appreciate what they have rather than focusing on what they want.",
    emotionalJourney:
      "Move from birthday expectations and potential disappointments to genuine appreciation for growth, relationships, and the joy of celebration itself.",

    storyArchetypes: [
      {
        name: "The Birthday Planner",
        description:
          "The protagonist learns to plan and organize their own celebration, discovering what truly makes birthdays special beyond presents and parties.",
        characterRoles:
          "Family members, friends, or party-planning companions who each contribute different ideas about meaningful celebration.",
        exampleScenario:
          "Deciding between a big party and a small gathering, ultimately choosing what feels most genuine and joyful.",
      },
      {
        name: "The Birthday Helper",
        description:
          "The protagonist focuses on making others' birthdays special, learning that giving joy can be as wonderful as receiving it.",
        characterRoles:
          "Friends or family members whose birthdays the protagonist helps celebrate, plus mentors who guide generous thinking.",
        exampleScenario:
          "Organizing a surprise party for a friend or grandparent, discovering the happiness that comes from creating joy for others.",
      },
      {
        name: "The Tradition Keeper",
        description:
          "The protagonist learns about and participates in birthday traditions, perhaps creating new ones or understanding the meaning behind familiar customs.",
        characterRoles:
          "Family members who share tradition knowledge, cultural guides, or friends who bring their own celebration customs.",
        exampleScenario:
          "Learning why birthday candles are blown out, what birthday wishes mean, or how different cultures celebrate birthdays.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on personal reflection about growth, gratitude, and what makes the protagonist feel special and loved.",
      companionIntegration:
        "Include family and friends who each contribute to making the birthday meaningful through their unique relationships with the protagonist.",
      groupDynamics:
        "Create collaborative birthday experiences where everyone contributes to celebration, showing community and shared joy.",
    },

    sceneGuidance: {
      setupPhase: [
        "Build anticipation for the birthday celebration while establishing what the protagonist hopes for and what truly matters to them.",
        "Introduce birthday preparation activities - planning, decorating, or traditional pre-birthday rituals that build excitement.",
        "Show the protagonist's relationships with family and friends who care about making their day special.",
      ],
      developmentPhase: [
        "Birthday activities that may not go exactly as planned, teaching flexibility and finding joy in unexpected moments.",
        "Gift-giving or receiving scenes that emphasize thought and care over material value.",
        "Tradition participation that connects the protagonist to family history and cultural meaning.",
      ],
      resolutionPhase: [
        "Birthday highlight moment where the protagonist feels truly celebrated and appreciated for who they are.",
        "Gratitude expression where the protagonist recognizes all the love and effort that went into their celebration.",
        "Looking forward conclusion that acknowledges growth over the past year and excitement for what's ahead.",
      ],
    },

    settingVariations: [
      "Home environments decorated for celebration with personal touches",
      "Party venues that reflect the protagonist's interests and personality",
      "Outdoor celebration spaces - parks, backyards, or special nature locations",
      "Family gathering spaces where multiple generations come together",
    ],

    visualMotifs: [
      "Birthday symbols - candles, balloons, wrapped presents, party hats",
      "Growth indicators - height marks, photo comparisons, or milestone achievements",
      "Celebration moments - clapping, singing, hugging, shared laughter",
      "Personal touches - favorite colors, beloved characters, or special interests reflected in decorations",
    ],

    colorPaletteSuggestions: [
      "The protagonist's favorite colors featured prominently in decorations and scenes",
      "Festive combinations - bright party colors that create excitement and joy",
      "Warm, celebratory tones - golds, bright reds, cheerful blues that suggest special occasions",
    ],

    learningObjectives: [
      "Understanding personal growth and the passage of time",
      "Learning about family and cultural birthday traditions",
      "Developing gratitude for relationships and experiences",
      "Understanding the joy of both giving and receiving",
    ],

    skillBuilding: [
      "Social skills through party participation and interaction",
      "Planning and organization through celebration preparation",
      "Emotional expression through sharing joy and gratitude",
      "Cultural awareness through tradition understanding",
    ],

    themeIntegration:
      "Present birthdays as personal holidays that celebrate individual growth and the love of family and friends, emphasizing gratitude, tradition, and the joy of marking life's special moments.",
  },

  christmas: {
    theme: "Holidays",
    subject: "Christmas",
    premise:
      "Experience the magic and meaning of Christmas through the protagonist's eyes, discovering that the holiday's true joy comes from giving, sharing, and celebrating love and togetherness with family and community.",
    coreConflict:
      "Christmas challenges like managing gift expectations, understanding the holiday's deeper meaning, or finding ways to celebrate despite obstacles or differences.",
    emotionalJourney:
      "Journey from focus on receiving gifts to appreciation for giving joy to others, understanding Christmas traditions, and feeling the warmth of community celebration.",

    storyArchetypes: [
      {
        name: "The Christmas Helper",
        description:
          "The protagonist becomes Santa's helper or community volunteer, learning that giving joy to others is the most magical part of Christmas.",
        characterRoles:
          "Santa, elves, family members, or community members who guide the protagonist in Christmas giving and service.",
        exampleScenario:
          "Helping distribute gifts to children in need or assisting with community Christmas dinner preparation.",
      },
      {
        name: "The Tradition Discoverer",
        description:
          "The protagonist learns about Christmas traditions from their own and other cultures, understanding how different families celebrate the holiday.",
        characterRoles:
          "Family elders, friends from different backgrounds, or cultural guides who share various Christmas traditions.",
        exampleScenario:
          "Learning why families put up Christmas trees, what different Christmas foods represent, or how Christmas is celebrated around the world.",
      },
      {
        name: "The Christmas Magic Maker",
        description:
          "The protagonist discovers they can create Christmas magic through acts of kindness, creativity, or bringing people together.",
        characterRoles:
          "Family members, friends, or neighbors who benefit from and participate in the protagonist's Christmas magic creation.",
        exampleScenario:
          "Organizing a Christmas surprise for someone lonely, creating handmade gifts, or bringing feuding family members together for the holiday.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on personal Christmas magic discovery and the protagonist's growing understanding of holiday meaning through individual acts of kindness.",
      companionIntegration:
        "Include family, friends, and community members who each contribute different aspects of Christmas celebration and meaning.",
      groupDynamics:
        "Create collaborative Christmas activities where everyone contributes to holiday magic - decorating, cooking, gift-making, or community service.",
    },

    sceneGuidance: {
      setupPhase: [
        "Establish Christmas anticipation and the protagonist's initial understanding or expectations of the holiday.",
        "Introduce Christmas preparation activities - decorating, shopping, baking, or participating in traditions.",
        "Show the protagonist beginning to understand that Christmas involves giving as well as receiving.",
      ],
      developmentPhase: [
        "Christmas tradition participation that connects the protagonist to family history and cultural meaning.",
        "Gift-giving or service activity where the protagonist experiences the joy of making others happy.",
        "Christmas challenge or obstacle that requires community cooperation or creative problem-solving to overcome.",
      ],
      resolutionPhase: [
        "Christmas celebration moment where all elements come together - family, friends, traditions, and the spirit of giving.",
        "Recognition scene where the protagonist understands what Christmas truly means beyond presents and parties.",
        "Christmas magic climax where the protagonist's growth and generosity create or contribute to holiday wonder for others.",
      ],
    },

    settingVariations: [
      "Cozy homes decorated for Christmas with trees, lights, and family gathering spaces",
      "Community centers or churches where Christmas celebrations bring people together",
      "Winter wonderlands with snow, decorated streets, and outdoor Christmas activities",
      "Santa's workshop or magical Christmas locations that capture holiday wonder",
    ],

    visualMotifs: [
      "Traditional Christmas imagery - trees, lights, wrapped presents, stars, angels",
      "Winter beauty - snow, icicles, warm fires, cozy indoor scenes contrasted with crisp outdoor magic",
      "Giving and sharing moments - hands offering gifts, families hugging, community gatherings",
      "Transformation themes - ordinary spaces becoming magical through decoration and celebration",
    ],

    colorPaletteSuggestions: [
      "Traditional Christmas colors - deep reds, forest greens, gold accents, pure white snow",
      "Magical winter palette - silver and blue tones with warm golden light from windows and fires",
      "Cozy celebration colors - warm browns, rich reds, soft golds suggesting comfort and togetherness",
    ],

    learningObjectives: [
      "Understanding Christmas traditions and their meanings",
      "Learning about generosity, kindness, and community service",
      "Developing appreciation for family and cultural heritage",
      "Understanding religious or cultural significance appropriate to family beliefs",
    ],

    skillBuilding: [
      "Giving and sharing skills through gift selection and presentation",
      "Cultural awareness through tradition understanding",
      "Community engagement through holiday participation",
      "Creativity through decoration, gift-making, or celebration planning",
    ],

    themeIntegration:
      "Present Christmas as a celebration of love, giving, and community that brings out the best in people, emphasizing traditions, generosity, and the magic created when people come together with joy and goodwill.",
  },
};

// FAMILY THEME SUBJECT PROMPTS
export const FAMILY_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  "new-baby": {
    theme: "Family",
    subject: "New Baby",
    premise:
      "Navigate the exciting and sometimes challenging experience of welcoming a new family member, helping the protagonist understand their evolving role and the growing nature of family love.",
    coreConflict:
      "Adjustment challenges like sharing attention, changing routines, or understanding the baby's needs while maintaining the protagonist's sense of importance and belonging.",
    emotionalJourney:
      "Progress from uncertainty or jealousy about family changes to pride and joy in being a big sibling, discovering that love multiplies rather than divides when families grow.",

    storyArchetypes: [
      {
        name: "The Big Sibling Helper",
        description:
          "The protagonist learns how to help care for the new baby, discovering their important role as protector and teacher.",
        characterRoles:
          "Parents who guide sibling interactions, grandparents who share wisdom about family growth, or friends who understand sibling experiences.",
        exampleScenario:
          "Learning to hold the baby safely, helping with feeding time, or singing lullabies to calm crying.",
      },
      {
        name: "The Family Protector",
        description:
          "The protagonist takes on responsibility for keeping the baby safe and happy, learning about nurturing and responsibility.",
        characterRoles:
          "Family members who model caring behavior, baby-care experts, or other children who share protective instincts.",
        exampleScenario:
          "Making sure the baby's room is quiet during nap time or gently showing visitors how to interact with the new family member.",
      },
      {
        name: "The Love Multiplier",
        description:
          "The protagonist discovers that having a new baby doesn't mean less love for them, but rather that family love grows and expands.",
        characterRoles:
          "Parents who demonstrate continued love, extended family who show excitement about both children, or wise mentors who explain family dynamics.",
        exampleScenario:
          "Realizing that mommy and daddy have enough love for both children when they continue their special traditions while also caring for the baby.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on the protagonist's internal processing of family changes and their developing relationship with the new baby through observation and gentle interaction.",
      companionIntegration:
        "Include supportive family members who help the protagonist understand their continuing importance while learning about the baby's needs.",
      groupDynamics:
        "Create extended family scenarios where multiple relatives celebrate both the new baby and the protagonist's new role as big sibling.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce the anticipation of the new baby's arrival, showing both excitement and some uncertainty about what changes will come.",
        "Present the moment of meeting the new baby, capturing the protagonist's initial reactions and feelings.",
        "Show early adjustment challenges as the protagonist learns how a baby affects daily life and family routines.",
      ],
      developmentPhase: [
        "Learning curve scenes where the protagonist discovers what babies need and how they can help provide care and comfort.",
        "Attention-sharing moments where the protagonist learns that parent love doesn't diminish even when it's shared with the new baby.",
        "Bonding breakthrough where the protagonist begins to feel genuine affection and connection with their new sibling.",
      ],
      resolutionPhase: [
        "Confident helping moment where the protagonist successfully cares for or soothes the baby, demonstrating their competence as a big sibling.",
        "Family unity scene showing how the new baby has made the family complete and how everyone has adjusted to their new roles.",
        "Future-looking conclusion where the protagonist expresses excitement about teaching and playing with the baby as they grow.",
      ],
    },

    settingVariations: [
      "Hospital or birthing center for the first meeting",
      "Home environments adapted for baby care with cribs, changing areas, and quiet spaces",
      "Family gathering spaces where extended family meets the new baby",
      "Everyday locations like parks or stores as the family learns to go places with a new baby",
    ],

    visualMotifs: [
      "Size contrasts showing the baby's smallness and the protagonist's growth",
      "Gentle touch moments - careful hands, soft blankets, tender interactions",
      "Family togetherness - group hugs, shared care activities, collective joy",
      "Growth symbols - the protagonist's belongings alongside baby items, showing family expansion",
    ],

    colorPaletteSuggestions: [
      "Soft, nurturing colors - gentle pastels, warm creams, soothing blues and pinks",
      "Family unity colors - harmonious tones that suggest belonging and togetherness",
      "Growth colors - showing the progression from baby items to big kid items in the same space",
    ],

    learningObjectives: [
      "Understanding family structure changes and adaptations",
      "Learning about baby development and needs",
      "Developing empathy and nurturing instincts",
      "Understanding that love grows rather than diminishes when shared",
    ],

    skillBuilding: [
      "Gentle care skills through baby interaction",
      "Emotional regulation during family adjustment",
      "Responsibility development through helping with baby care",
      "Communication skills for expressing needs during family changes",
    ],

    themeIntegration:
      "Present new baby arrival as a wonderful expansion of family love and opportunity for the protagonist to grow into their role as protective, caring big sibling.",
  },

  moving: {
    theme: "Family",
    subject: "Moving",
    premise:
      "Transform the challenge of moving to a new home into an adventure of discovery, helping the protagonist learn that home is about the people you're with rather than just the place you live.",
    coreConflict:
      "Moving anxieties like leaving familiar places and friends, fear of the unknown, or sadness about saying goodbye to a beloved home.",
    emotionalJourney:
      "Journey from resistance and sadness about moving to excitement and discovery about new possibilities, learning that families can create home anywhere they go together.",

    storyArchetypes: [
      {
        name: "The Home Maker",
        description:
          "The protagonist learns to help make the new house feel like home by contributing to unpacking, decorating, or establishing new routines.",
        characterRoles:
          "Family members who each contribute to creating the new home atmosphere, neighbors who welcome the family, or moving helpers who ease the transition.",
        exampleScenario:
          "Choosing where to put favorite items in the new room or helping parents decide how to arrange furniture to make spaces feel cozy.",
      },
      {
        name: "The Memory Keeper",
        description:
          "The protagonist finds ways to honor and remember the old home while embracing the new one, learning that memories travel with you.",
        characterRoles:
          "Family members who share favorite memories, friends from the old neighborhood who stay connected, or new friends who appreciate stories about the past.",
        exampleScenario:
          "Creating a memory book about the old house or finding ways to continue favorite traditions in the new location.",
      },
      {
        name: "The Explorer Pioneer",
        description:
          "The protagonist becomes the family's scout for discovering exciting things about the new neighborhood and community.",
        characterRoles:
          "New neighbors who become friends, local community members who welcome newcomers, or family members who explore together.",
        exampleScenario:
          "Finding the best playground, discovering a great ice cream shop, or locating the new library and making it a regular destination.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on the protagonist's personal adaptation process, showing internal resilience and gradual acceptance of change through individual discovery.",
      companionIntegration:
        "Include family members experiencing their own moving challenges, creating mutual support, plus new friends who help with local knowledge.",
      groupDynamics:
        "Create community welcome scenarios where multiple new neighbors help the family settle in, showing the kindness of communities.",
    },

    sceneGuidance: {
      setupPhase: [
        "Establish attachment to the current home and community, showing what the protagonist will miss and why moving feels difficult.",
        "Present the moving decision and process, allowing the protagonist to express concerns while also building anticipation for new possibilities.",
        "Begin packing and preparation activities that help the protagonist feel involved in and more prepared for the transition.",
      ],
      developmentPhase: [
        "Moving day activities showing the family working together to transport their life to a new location, emphasizing teamwork and shared adventure.",
        "First exploration of the new home and neighborhood, discovering both positive surprises and aspects that need adjustment.",
        "Initial challenges and homesickness balanced with moments of excitement and discovery about new possibilities.",
      ],
      resolutionPhase: [
        "Settling-in success where the protagonist makes a meaningful contribution to establishing the family's new routine or space arrangement.",
        "Connection breakthrough where the protagonist makes a new friend, finds a beloved new spot, or feels the new house becoming home.",
        "Gratitude recognition where the protagonist appreciates both the memories from the old home and the opportunities in the new one.",
      ],
    },

    settingVariations: [
      "The beloved old home with familiar rooms and spaces that hold special memories",
      "Moving vehicles - trucks, cars loaded with belongings - representing the transition journey",
      "The new house in various states - empty and echoing, partially unpacked, gradually becoming home",
      "New neighborhood locations - parks, schools, shops - waiting to be discovered and embraced",
    ],

    visualMotifs: [
      "Boxes and packing materials transforming from chaos to organization",
      "Familiar objects finding new places in unfamiliar spaces",
      "Empty spaces gradually filling with life, personality, and comfort",
      "Windows showing different views - old landscapes being replaced by new horizons",
    ],

    colorPaletteSuggestions: [
      "Transition colors - neutral cardboard browns giving way to the family's personal color preferences",
      "Memory colors - warm, nostalgic tones for old home scenes contrasted with fresh, bright colors for new possibilities",
      "Journey colors - road trip palettes of changing landscapes and new geographic color schemes",
    ],

    learningObjectives: [
      "Understanding that change can be positive even when it feels scary",
      "Learning that home is about relationships rather than just physical spaces",
      "Developing adaptability and resilience during major life changes",
      "Understanding community and how to integrate into new social environments",
    ],

    skillBuilding: [
      "Adaptation skills through embracing new environments",
      "Social skills through meeting new neighbors and potential friends",
      "Organization and responsibility through packing and unpacking participation",
      "Emotional coping strategies for dealing with significant change",
    ],

    themeIntegration:
      "Present moving as a family adventure that proves home is wherever the family is together, emphasizing that change brings both challenges and wonderful new opportunities.",
  },
};

// MORALS THEME SUBJECT PROMPTS
export const MORALS_SUBJECT_PROMPTS: Record<string, SubjectPrompt> = {
  "patience-grows-good-things": {
    theme: "Morals",
    subject: "Patience grows good things",
    premise:
      "Teach the profound lesson that the best things in life require time and patience to develop, whether growing plants, building skills, or nurturing relationships.",
    coreConflict:
      "The protagonist's natural desire for immediate results conflicts with situations that require patience, leading to initial frustration and the temptation to give up or rush the process.",
    emotionalJourney:
      "Transform from impatience and frustration with slow progress to understanding and appreciation of how time and patience create better, more meaningful results.",

    storyArchetypes: [
      {
        name: "The Garden Tender",
        description:
          "The protagonist learns patience through caring for plants, discovering that seeds need time, water, and care to become beautiful flowers or nourishing food.",
        characterRoles:
          "Wise gardeners, patient family members, or nature spirits who model the peaceful acceptance of natural timing.",
        exampleScenario:
          "Planting seeds and learning to water them daily even when nothing seems to be happening, then experiencing the joy of first sprouts.",
      },
      {
        name: "The Skill Builder",
        description:
          "The protagonist wants to master a new ability quickly but learns that practice and patience are the keys to true competence and confidence.",
        characterRoles:
          "Patient teachers, encouraging friends, or mentors who demonstrate that mastery comes through consistent, patient effort.",
        exampleScenario:
          "Learning to ride a bike, play an instrument, or draw well, discovering that each small improvement builds toward eventual success.",
      },
      {
        name: "The Friendship Cultivator",
        description:
          "The protagonist learns that the best friendships develop slowly through shared experiences, trust-building, and patient understanding of others.",
        characterRoles:
          "Potential friends who need time to open up, family members who model patient relationship building, or wise characters who explain friendship development.",
        exampleScenario:
          "Meeting a shy new classmate who needs time and gentle patience before feeling comfortable enough to become a true friend.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on the protagonist's internal struggle with impatience and their gradual development of patience through personal projects that require time to succeed.",
      companionIntegration:
        "Include patient mentors, friends learning similar lessons, or characters who benefit from the protagonist's developing patience.",
      groupDynamics:
        "Create group projects where patience is required from everyone, showing how collective patience leads to better outcomes than rushing.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce the protagonist's impatience with a situation that clearly requires time to develop properly - planting, learning, or relationship building.",
        "Show initial frustration when quick attempts fail or when progress seems impossibly slow compared to expectations.",
        "Present a wise mentor or example that demonstrates how patience leads to better results than rushing.",
      ],
      developmentPhase: [
        "Practice patience scenes where the protagonist must wait, tend, or practice regularly while seeing minimal immediate progress.",
        "Temptation moment where rushing or giving up seems appealing, but the protagonist chooses to continue with patient effort.",
        "First signs of progress that reward the protagonist's patience and encourage continued effort.",
      ],
      resolutionPhase: [
        "Major breakthrough where patience pays off dramatically - the garden blooms, the skill is mastered, or the friendship flourishes.",
        "Recognition moment where the protagonist understands that the waiting and patient effort made the result more meaningful and valuable.",
        "Teaching moment where the protagonist shares their patience lesson with someone else facing a similar challenge.",
      ],
    },

    settingVariations: [
      "Gardens and natural settings where growth happens on nature's timeline",
      "Learning environments like schools, studios, or workshops where skill development requires sustained effort",
      "Community spaces where relationships develop through repeated positive interactions over time",
      "Home environments where family projects or traditions require patience and consistency",
    ],

    visualMotifs: [
      "Time passage indicators - seasonal changes, calendars, growth charts showing gradual progress",
      "Before and after comparisons showing the dramatic difference patience makes in final results",
      "Process imagery - seeds sprouting, skills developing, relationships deepening through small moments",
      "Nurturing actions - watering, practicing, gentle care that doesn't show immediate results but accumulates over time",
    ],

    colorPaletteSuggestions: [
      "Natural growth colors - soft greens developing into rich, vibrant foliage",
      "Time progression palettes - subtle changes that show seasonal or developmental progression",
      "Patience colors - calm blues and greens that suggest tranquility and steady progress",
    ],

    learningObjectives: [
      "Understanding that valuable things take time to develop properly",
      "Learning to find satisfaction in consistent effort rather than immediate results",
      "Developing the ability to delay gratification for better outcomes",
      "Recognizing that patience makes achievements more meaningful and lasting",
    ],

    skillBuilding: [
      "Self-regulation and impulse control through practicing patience",
      "Goal-setting and long-term thinking abilities",
      "Persistence and resilience when progress seems slow",
      "Appreciation for process rather than just outcomes",
    ],

    themeIntegration:
      "Present patience as a powerful virtue that unlocks life's most valuable experiences, showing that rushing prevents us from receiving the full benefits that only time and care can provide.",
  },

  "practice-makes-progress": {
    theme: "Morals",
    subject: "Practice makes progress",
    premise:
      "Demonstrate that improvement comes through consistent practice and that progress, rather than perfection, should be the goal of learning new skills.",
    coreConflict:
      "The protagonist's desire for immediate mastery conflicts with the reality that skills develop gradually through repeated practice, leading to frustration with mistakes and slow improvement.",
    emotionalJourney:
      "Move from perfectionist frustration and fear of making mistakes to embracing practice as enjoyable learning and celebrating small improvements as meaningful progress.",

    storyArchetypes: [
      {
        name: "The Mistake Embracer",
        description:
          "The protagonist learns that mistakes are valuable learning opportunities and that perfect performance isn't the goal of practice.",
        characterRoles:
          "Understanding teachers, supportive friends, or wise mentors who model learning from mistakes rather than avoiding them.",
        exampleScenario:
          "Learning to draw by making lots of 'bad' drawings and discovering that each one teaches something new about technique or observation.",
      },
      {
        name: "The Progress Tracker",
        description:
          "The protagonist learns to notice and celebrate small improvements rather than focusing on distant perfection.",
        characterRoles:
          "Encouraging family members, practice partners, or coaches who help identify and celebrate incremental progress.",
        exampleScenario:
          "Keeping a practice journal for piano lessons and seeing how each week brings small but real improvements in playing ability.",
      },
      {
        name: "The Consistency Champion",
        description:
          "The protagonist discovers that regular, consistent practice is more effective than occasional intense effort.",
        characterRoles:
          "Disciplined role models, practice buddies, or mentors who demonstrate the power of steady, consistent effort over time.",
        exampleScenario:
          "Comparing the results of practicing soccer skills for 15 minutes daily versus trying to cram all practice into one long session per week.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on the protagonist's personal relationship with practice, showing internal motivation development and self-encouragement during challenging learning moments.",
      companionIntegration:
        "Include practice partners, teachers, or family members who provide encouragement and model positive attitudes toward learning and improvement.",
      groupDynamics:
        "Create group learning scenarios where everyone is practicing and improving together, showing that everyone learns at their own pace.",
    },

    sceneGuidance: {
      setupPhase: [
        "Introduce a skill the protagonist wants to learn, showing initial excitement followed by frustration when early attempts don't meet expectations.",
        "Demonstrate the gap between the protagonist's current ability and their desired level, establishing the need for practice.",
        "Present a mentor or example of someone who achieved skill through consistent practice rather than natural talent.",
      ],
      developmentPhase: [
        "Practice routine establishment where the protagonist commits to regular practice sessions despite not seeing immediate dramatic improvement.",
        "Mistake-making and recovery scenes that teach resilience and the learning value of errors.",
        "Small progress recognition moments where the protagonist begins to notice and appreciate incremental improvements.",
      ],
      resolutionPhase: [
        "Skill demonstration where accumulated practice pays off in noticeable competence, surprising the protagonist with their own improvement.",
        "Confidence breakthrough where the protagonist realizes they can learn anything through patient practice and consistent effort.",
        "Teaching moment where the protagonist helps someone else understand that practice leads to progress, not perfection.",
      ],
    },

    settingVariations: [
      "Practice spaces - music rooms, art studios, sports fields, or home areas dedicated to skill development",
      "Learning environments where multiple people are practicing different skills, showing universal application of practice principles",
      "Performance or demonstration spaces where practiced skills are shared with others",
      "Natural settings where practice happens through play and exploration rather than formal instruction",
    ],

    visualMotifs: [
      "Before and after skill demonstrations showing clear improvement over time",
      "Practice tools and materials - instruments, art supplies, sports equipment - showing wear from consistent use",
      "Progress indicators - charts, collections of work, or skill level demonstrations that track improvement",
      "Mistake corrections - crossed out attempts, eraser marks, do-overs that show learning in process",
    ],

    colorPaletteSuggestions: [
      "Progress colors - starting with tentative, light colors and developing into confident, bold ones",
      "Learning colors - warm, encouraging tones that suggest growth and possibility",
      "Achievement colors - bright, celebratory tones for moments of breakthrough and recognized improvement",
    ],

    learningObjectives: [
      "Understanding that skills develop through consistent practice rather than instant mastery",
      "Learning to value progress and improvement over perfection",
      "Developing resilience and persistence when learning becomes challenging",
      "Recognizing that mistakes are valuable parts of the learning process",
    ],

    skillBuilding: [
      "Goal-setting and progress tracking abilities",
      "Self-motivation and discipline through practice routine development",
      "Growth mindset development through embracing challenges and mistakes",
      "Self-assessment skills for recognizing personal improvement",
    ],

    themeIntegration:
      "Present practice as the pathway to personal growth and achievement, emphasizing that consistent effort and willingness to learn from mistakes leads to meaningful progress and genuine confidence.",
  },

  "tell-the-truth-and-fix-it": {
    theme: "Morals",
    subject: "Tell the truth and fix it",
    premise:
      "Teach that honesty, combined with taking responsibility to repair harm, builds trust and character while showing that everyone makes mistakes but good people work to make things right.",
    coreConflict:
      "The protagonist faces the temptation to hide a mistake or lie about wrongdoing, but must choose between short-term avoidance and long-term integrity.",
    emotionalJourney:
      "Progress from fear of consequences and shame about mistakes to courage in truth-telling and satisfaction in making amends, discovering that honesty strengthens rather than damages relationships.",

    storyArchetypes: [
      {
        name: "The Mistake Mender",
        description:
          "The protagonist learns that admitting mistakes and working to fix them is braver and more respected than hiding errors.",
        characterRoles:
          "Understanding adults who model forgiveness, friends who appreciate honesty, or people who benefit from the protagonist's truth-telling and repair efforts.",
        exampleScenario:
          "Accidentally breaking something valuable and choosing to confess immediately rather than hiding it, then working to replace or repair the item.",
      },
      {
        name: "The Trust Builder",
        description:
          "The protagonist discovers that consistent honesty, even when it's difficult, creates stronger relationships and earned trust.",
        characterRoles:
          "Family members who reward honesty with trust, friends who value truthful relationships, or mentors who explain how trust is built and maintained.",
        exampleScenario:
          "Being trusted with increasing responsibility because parents recognize the protagonist always tells the truth, even about uncomfortable situations.",
      },
      {
        name: "The Integrity Champion",
        description:
          "The protagonist chooses truth-telling even when it might get them or others in trouble, standing up for what's right regardless of consequences.",
        characterRoles:
          "Moral exemplars, friends who need someone to stand up for truth, or community members who benefit from honest reporting of problems.",
        exampleScenario:
          "Witnessing someone else's wrongdoing and choosing to report it honestly to protect others, even though it might strain friendships.",
      },
    ],

    characterDynamics: {
      soloCharacterApproach:
        "Focus on the protagonist's internal moral struggle and the development of personal integrity through individual choices about honesty and responsibility.",
      companionIntegration:
        "Include understanding family members, friends who appreciate honesty, and people who are positively affected by the protagonist's truthfulness.",
      groupDynamics:
        "Create situations where group honesty and collective responsibility lead to better outcomes than individual secret-keeping or blame-shifting.",
    },

    sceneGuidance: {
      setupPhase: [
        "Present a situation where the protagonist makes a mistake or witnesses wrongdoing that could easily be hidden or ignored.",
        "Show the temptation to lie, hide, or blame someone else, making the moral choice feel real and challenging.",
        "Introduce the internal or external pressure that makes truth-telling feel risky or difficult.",
      ],
      developmentPhase: [
        "Decision-making process where the protagonist weighs the consequences of honesty versus dishonesty, showing internal moral reasoning.",
        "Truth-telling moment where the protagonist chooses honesty despite potential negative consequences.",
        "Responsibility-taking actions where the protagonist works to fix, replace, or repair whatever was damaged by the mistake.",
      ],
      resolutionPhase: [
        "Positive consequences of honesty where trust is maintained or strengthened rather than damaged by the truth-telling.",
        "Successful repair or amends-making that demonstrates genuine remorse and commitment to making things right.",
        "Recognition scene where others appreciate the protagonist's integrity and the relationships are stronger because of the honesty.",
      ],
    },

    settingVariations: [
      "Home environments where family trust is built through consistent honesty",
      "School settings where academic or social honesty affects relationships with teachers and friends",
      "Community spaces where truthfulness affects group dynamics and collective wellbeing",
      "Play environments where honesty during games and activities builds character and friendship",
    ],

    visualMotifs: [
      "Broken and repaired objects showing the process of making amends",
      "Truth-telling moments - direct eye contact, open body language, clear communication",
      "Repair actions - hands fixing, cleaning, or replacing what was damaged",
      "Trust indicators - handshakes, hugs, or inclusion in important activities that show restored or strengthened relationships",
    ],

    colorPaletteSuggestions: [
      "Honesty colors - clear, bright tones suggesting transparency and openness",
      "Integrity colors - strong, solid colors suggesting reliability and trustworthiness",
      "Repair colors - before and after palettes showing restoration and improvement",
    ],

    learningObjectives: [
      "Understanding that honesty strengthens rather than damages good relationships",
      "Learning that taking responsibility for mistakes is brave and respected",
      "Developing the moral courage to tell difficult truths when necessary",
      "Understanding that fixing mistakes is as important as admitting them",
    ],

    skillBuilding: [
      "Moral reasoning and ethical decision-making abilities",
      "Communication skills for difficult conversations",
      "Problem-solving skills for making amends and repairs",
      "Character development through integrity practice",
    ],

    themeIntegration:
      "Present honesty and responsibility as the foundation of trustworthy character, showing that people who consistently tell the truth and work to fix their mistakes are valued and trusted by others.",
  },
};

export function isCustomTheme(theme: string): boolean {
  return theme.toLowerCase() === "custom";
}

// Helper function to get subject prompt (updated to include all themes)
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
    case "activities":
      return ACTIVITIES_SUBJECT_PROMPTS[subjectKey] || null;
    case "stories":
      return STORIES_SUBJECT_PROMPTS[subjectKey] || null;
    case "holidays":
      return HOLIDAYS_SUBJECT_PROMPTS[subjectKey] || null;
    case "family":
      return FAMILY_SUBJECT_PROMPTS[subjectKey] || null;
    case "morals":
      return MORALS_SUBJECT_PROMPTS[subjectKey] || null;
    default:
      return null;
  }
}

// Custom theme guidelines remain the same
export const CUSTOM_THEME_GUIDELINES = {
  premise:
    "When using a custom theme with a user-provided subject description, treat the subject as the foundational premise for the story. Expand thoughtfully on the user's vision while maintaining age-appropriate content and educational value.",
  storyGuidelines: `
    - Carefully analyze the user's subject description for key themes and elements
    - Expand the premise into a full eleven-beat narrative structure
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

// export function generateStoryPremiseSection(
//   theme: string,
//   subject: string,
//   isCustom: boolean
// ): string {
//   if (isCustom) {
//     return `## Story Premise (Custom Theme):
// ${CUSTOM_THEME_GUIDELINES.premise}

// ### Custom Story Guidelines:
// ${CUSTOM_THEME_GUIDELINES.storyGuidelines}

// ### Subject Description:
// "${subject}"

// ### Character Integration for Custom Theme:
// ${CUSTOM_THEME_GUIDELINES.characterIntegration}

// ### Theme Overlay:
// ${CUSTOM_THEME_GUIDELINES.themeOverlay}`;
//   }

//   const subjectPrompt = getSubjectPrompt(theme, subject);
//   if (!subjectPrompt) {
//     return `## Story Premise (${theme} - ${subject}):
// Create an engaging story that incorporates the theme of "${theme}" with the subject "${subject}". Focus on age-appropriate content that teaches positive values while entertaining young readers.

// ### Story Guidelines:
// - Integrate the subject naturally into the narrative
// - Ensure the theme influences the story's tone and approach
// - Create educational moments that feel organic to the story
// - Include conflict resolution appropriate for ages 3-8
// - Build towards a satisfying conclusion that reinforces positive messages

// ### Character Integration:
// Design character roles that support the story's theme and subject matter. Each character should contribute meaningfully to exploring the chosen subject.`;
//   }

//   return `## Story Premise (${theme} - ${subject}):
// **Core Concept:** ${subjectPrompt.premise}

// **Central Conflict:** ${subjectPrompt.coreConflict}

// **Emotional Journey:** ${subjectPrompt.emotionalJourney}

// ### Story Development Example Approaches:
// ${subjectPrompt.storyArchetypes.map((archetype, index) =>
//   `**${index + 1}. ${archetype.name}:**
//   ${archetype.description}
//   ${archetype.characterRoles ? `*Character Roles:* ${archetype.characterRoles}` : ''}
//   ${archetype.exampleScenario ? `*Example:* ${archetype.exampleScenario}` : ''}`
// ).join('\n\n')}

// ### Character Integration Guidelines:
// **Solo Adventure:** ${subjectPrompt.characterDynamics.soloCharacterApproach}

// **With Companions:** ${subjectPrompt.characterDynamics.companionIntegration}

// **Group Dynamics:** ${subjectPrompt.characterDynamics.groupDynamics}

// ### Scene Development Framework:
// **Setup Phase (Scenes 1-3):** ${subjectPrompt.sceneGuidance.setupPhase.join(' ')}

// **Development Phase (Scenes 4-6):** ${subjectPrompt.sceneGuidance.developmentPhase.join(' ')}

// **Resolution Phase (Scenes 7-9):** ${subjectPrompt.sceneGuidance.resolutionPhase.join(' ')}

// ### Visual & Atmospheric Guidelines:
// **Setting Variations:** ${subjectPrompt.settingVariations.join(' • ')}

// **Visual Motifs:** ${subjectPrompt.visualMotifs.join(' • ')}

// **Color Palette Suggestions:** ${subjectPrompt.colorPaletteSuggestions.join(' • ')}

// ${subjectPrompt.learningObjectives ? `### Learning Objectives:
// ${subjectPrompt.learningObjectives.join(' • ')}` : ''}

// ${subjectPrompt.skillBuilding ? `### Skill Building Focus:
// ${subjectPrompt.skillBuilding.join(' • ')}` : ''}

// ### Theme Integration:
// ${subjectPrompt.themeIntegration}`;
// }

// Enhanced Custom Theme Guidelines with Age-Specific Story Development
// Enhanced Custom Theme Guidelines with Structured Story Development Process

interface CustomThemeGuidelines {
  storyAnalysisFramework: string;
  ageAdaptationGuidelines: string;
  characterIntegrationStrategy: string;
  contentExpansionStrategies: string;
  narrativeStructuringGuidelines: string;
  detailedExamples: string;
}

interface ProcessedExample {
  userInput: string;
  stepByStepAnalysis: {
    goalIdentification: string;
    ageAdaptation: string;
    characterFitting: string;
    contentDevelopment: string;
    finalStructure: string;
  };
  finalOutput: string;
}

/**
 * Generates comprehensive custom theme guidelines based on child's age group
 * @param age - Child's age (0-8+ years)
 * @returns CustomThemeGuidelines object with structured story development process
 */
export function getCustomTheme(age: number): CustomThemeGuidelines {
  const ageGroup = getAgeGroup(age);

  return {
    storyAnalysisFramework: `
## Step-by-Step Story Development Process

### STEP 1: Goal & Objective Identification
**Primary Questions to Answer:**
• What is the core purpose of this story? (Teaching moment, entertainment, addressing a concern, celebrating an experience)
• What emotional outcome does the author want for their child?
• What specific learning or growth opportunity exists within this input?
• Is this story meant to solve a problem, teach a lesson, or simply create joy?

**Theme Classification Process:**
1. **Educational Goal** - Teaching specific skills, concepts, or knowledge
2. **Emotional Support** - Helping with fears, transitions, or difficult emotions
3. **Moral Development** - Teaching values, character traits, or social skills
4. **Experience Processing** - Making sense of real-life events or experiences
5. **Pure Entertainment** - Creating joy, wonder, or imaginative adventure
6. **Celebration** - Honoring achievements, milestones, or special moments

### STEP 2: Age-Appropriate Complexity Assessment
**For Age Group ${ageGroup.name} (${age} years old):**
${ageGroup.complexityGuidance}

**Content Simplification/Enhancement Decision Tree:**
• If input is too simple → ${ageGroup.expansionApproach}
• If input is too complex → ${ageGroup.simplificationApproach}
• If input is just right → ${ageGroup.refinementApproach}

### STEP 3: Character Integration Planning
**Character Role Assignment Process:**
1. Analyze provided character descriptions for personality traits and physical characteristics
2. Match character traits to story needs (helper, challenger, comic relief, wise guide, peer companion)
3. Ensure each character has a meaningful purpose in advancing the story goal
4. Create authentic character interactions that feel natural, not forced
5. Consider character dynamics that will resonate with ${age}-year-old perspective

### STEP 4: Content Development & Gap Filling
**Detail Enhancement Guidelines:**
• Identify missing story elements needed for complete narrative arc
• Add sensory details and environmental descriptions appropriate for age
• Create dialogue that serves both character development and plot advancement
• Build in ${ageGroup.engagementElements}
• Ensure pacing matches ${ageGroup.attentionPattern}
`,

    ageAdaptationGuidelines: `
### Age-Specific Story Adaptation for ${ageGroup.name}

**Cognitive Considerations:**
${ageGroup.cognitiveLevel}

**Emotional Processing Ability:**
${ageGroup.emotionalCapacity}

**Language and Communication:**
${ageGroup.languageLevel}

**Attention and Engagement Patterns:**
${ageGroup.attentionPattern}

**Conflict Resolution Approach:**
${ageGroup.conflictHandling}

**Learning Integration Style:**
${ageGroup.learningIntegration}
`,

    characterIntegrationStrategy: `
### Character Integration Methodology

**Character Analysis Framework:**
1. **Physical Traits → Story Function**
   • How do physical characteristics support story themes?
   • What unique abilities or perspectives do these traits suggest?

2. **Personality Mapping → Role Assignment**
   • Match character personalities to needed story roles
   • Create complementary character dynamics
   • Ensure character growth opportunities within the narrative

3. **Relationship Dynamics → Emotional Core**
   • Build meaningful connections between characters
   • Show how relationships develop or strengthen through story events
   • Model positive interaction patterns appropriate for age ${age}

**Character Integration Principles:**
• Each character must contribute meaningfully to achieving the story goal
• Character interactions should feel authentic and purposeful
• Avoid forcing characters into roles that don't match their described traits
• Create opportunities for each character to shine in their unique way
• Build in character development that supports the overall story message
`,

    contentExpansionStrategies: `
### Content Development Strategies by Input Complexity

**For Minimal Input (1-2 sentences, basic concept):**
1. **Core Concept Expansion**
   • Identify the emotional heart of the simple idea
   • Create a compelling "what if" scenario around the concept
   • Add stakes that matter to a ${age}-year-old
   • Build in natural learning moments

2. **World Building Addition**
   • Create an engaging setting that supports the core concept
   • Add sensory details that bring the world to life
   • Include environmental elements that advance the story

3. **Character Development Creation**
   • Give characters distinct personalities that serve the story
   • Create character motivations that drive plot forward
   • Build in character growth that supports the story goal

**For Moderate Input (detailed scenario, some specifics):**
1. **Structure Enhancement**
   • Organize existing elements into clear story arc
   • Identify and fill narrative gaps
   • Strengthen cause-and-effect relationships

2. **Emotional Depth Addition**
   • Enhance character feelings and motivations
   • Add emotional stakes that resonate with target age
   • Create moments of genuine character growth

**For Complex/Lengthy Input (rich detail, multiple elements):**
1. **Priority Identification**
   • Determine which elements are most important to the story goal
   • Identify core emotional moments that must be preserved
   • Select details that best serve the intended outcome

2. **Streamlining Process**
   • Combine similar events or characters where appropriate
   • Focus on elements that advance both plot and character development
   • Maintain emotional authenticity while reducing complexity

3. **Essential Element Preservation**
   • Keep details that are clearly important to the author
   • Preserve unique or personal touches that make the story special
   • Maintain the core message while adapting presentation for age
`,

    narrativeStructuringGuidelines: `
### Nine-Scene Story Structure Framework

**Scenes 1-2: Foundation & Hook**
• Establish characters in their normal world
• Introduce the central challenge or opportunity
• Create immediate engagement appropriate for age ${age}

**Scenes 3-4: Development & Complications** 
• Develop the main conflict or adventure
• Show character attempts to address the challenge
• Introduce obstacles that require growth or learning

**Scenes 5-6: Growth & Discovery**
• Characters learn new information or develop new skills
• Relationship dynamics evolve and strengthen
• Build toward climactic resolution

**Scenes 7-8: Climax & Resolution**
• Characters apply what they've learned to overcome the main challenge
• Show successful problem-solving or goal achievement
• Demonstrate character growth and positive outcomes

**Scene 9: Reflection & Celebration**
• Acknowledge character growth and lessons learned
• Celebrate positive outcomes and strengthened relationships
• End with forward-looking optimism appropriate for age

**Pacing Considerations for Age ${age}:**
${ageGroup.pacingGuidance}
`,

    detailedExamples: `
### Detailed Process Examples

${getDetailedExamples(age, ageGroup)
  .map(
    (example) => `
## Example: ${example.userInput}

### Step 1: Goal Identification
${example.stepByStepAnalysis.goalIdentification}

### Step 2: Age Adaptation Analysis  
${example.stepByStepAnalysis.ageAdaptation}

### Step 3: Character Integration Planning
${example.stepByStepAnalysis.characterFitting}

### Step 4: Content Development Strategy
${example.stepByStepAnalysis.contentDevelopment}

### Step 5: Final Structure Organization
${example.stepByStepAnalysis.finalStructure}

### Final Story Direction:
${example.finalOutput}

---
`,
  )
  .join("")}

### Key Principles for All Stories:
• Every element should serve the identified story goal
• Character integration should feel natural and purposeful
• Age-appropriate complexity while maintaining engagement
• Clear emotional journey with satisfying resolution
• Authentic dialogue and situations that resonate with children
• Balance between entertainment and any educational/moral elements
`,
  };
}

/**
 * Determines age group characteristics for story development
 * Note: Complexity levels are more gradual and less dramatically different between ages
 */
function getAgeGroup(age: number) {
  if (age >= 0 && age <= 2) {
    return {
      name: "Early Toddler",
      complexityGuidance:
        "Very simple cause-and-effect stories with immediate outcomes. Focus on sensory experiences, basic emotions, and familiar activities.",
      expansionApproach:
        "Add sensory details, simple repetition, and immediate cause-and-effect relationships",
      simplificationApproach:
        "Focus on single main event with clear, immediate outcome",
      refinementApproach:
        "Enhance with sensory details and simple character interactions",
      engagementElements: "bright visuals, simple sounds, and familiar objects",
      attentionPattern: "very brief scenes with immediate gratification",
      cognitiveLevel:
        "Concrete, immediate understanding. Learning through repetition and sensory experience.",
      emotionalCapacity:
        "Basic emotions: happy, sad, surprised. Need comfort and security.",
      languageLevel:
        "Simple words, repetitive phrases, descriptive sounds and actions.",
      conflictHandling:
        "Minimal conflict, immediate gentle resolution, focus on comfort",
      learningIntegration:
        "Through repetition, imitation, and sensory experiences",
      pacingGuidance:
        "Very quick scene transitions, lots of action and movement",
    };
  } else if (age >= 3 && age <= 4) {
    return {
      name: "Preschooler",
      complexityGuidance:
        "Simple linear stories with clear cause-and-effect. Introduce mild challenges with quick, satisfying resolutions.",
      expansionApproach:
        "Create simple adventure scenarios with helpful characters and clear problem-solving",
      simplificationApproach:
        "Focus on main character's journey with one primary helper",
      refinementApproach: "Add character interactions and simple dialogue",
      engagementElements:
        "talking animals, simple magic, and familiar settings made special",
      attentionPattern:
        "short scenes with frequent character interactions and movement",
      cognitiveLevel:
        "Growing abstract thinking. Understanding simple rules and basic fairness concepts.",
      emotionalCapacity:
        "Expanding emotional range including pride, disappointment, empathy. Need security and predictability.",
      languageLevel:
        "Vocabulary building, enjoys rhyming and word play, simple descriptive language.",
      conflictHandling:
        "Gentle challenges with clear solutions, minimal scary elements",
      learningIntegration:
        "Through story examples, character modeling, and simple consequences",
      pacingGuidance:
        "Quick scene changes with clear transitions, action-oriented content",
    };
  } else if (age >= 5 && age <= 6) {
    return {
      name: "Young School Age",
      complexityGuidance:
        "Stories can include subplots and character development. Mild suspense and challenges that require some problem-solving.",
      expansionApproach:
        "Develop character relationships and add collaborative problem-solving elements",
      simplificationApproach:
        "Focus on central relationship and main learning moment",
      refinementApproach:
        "Enhance character motivations and add social dynamics",
      engagementElements:
        "friendship challenges, simple mysteries, and school/social situations",
      attentionPattern:
        "moderate scene length with character development and relationship focus",
      cognitiveLevel:
        "Developing logical thinking. Understanding complex rules, beginning moral reasoning.",
      emotionalCapacity:
        "Complex emotions like jealousy, embarrassment, pride in achievement. Growing empathy.",
      languageLevel:
        "Rich vocabulary, enjoys wordplay and humor, can follow complex descriptions.",
      conflictHandling:
        "Meaningful challenges requiring thought and cooperation, mild emotional stakes",
      learningIntegration:
        "Through character choices, peer examples, and logical consequences",
      pacingGuidance:
        "Balanced pacing with both action and reflection, relationship development",
    };
  } else {
    // age >= 7
    return {
      name: "Older School Age",
      complexityGuidance:
        "Rich stories with multiple character arcs and thematic depth. Can handle moral complexity and meaningful stakes within safe boundaries.",
      expansionApproach:
        "Create layered character development and explore multiple aspects of the central theme",
      simplificationApproach:
        "Maintain thematic richness while focusing on most impactful character relationships",
      refinementApproach:
        "Deepen character psychology and add nuanced moral considerations",
      engagementElements:
        "character growth challenges, ethical dilemmas, and achievement themes",
      attentionPattern:
        "longer scenes with sustained character development and complex problem-solving",
      cognitiveLevel:
        "Abstract thinking development. Understanding multiple perspectives and complex cause-effect.",
      emotionalCapacity:
        "Nuanced emotional understanding, moral reasoning, concern for fairness and justice.",
      languageLevel:
        "Advanced vocabulary, appreciates subtle humor and wordplay, complex sentence structures.",
      conflictHandling:
        "Significant challenges with meaningful stakes, complex problem-solving required",
      learningIntegration:
        "Through moral reasoning, character analysis, and understanding consequences",
      pacingGuidance:
        "Sophisticated pacing with tension building, character depth, and thematic exploration",
    };
  }
}

/**
 * Generates detailed step-by-step examples showing the complete thought process
 */
function getDetailedExamples(age: number, ageGroup: any): ProcessedExample[] {
  return [
    {
      userInput: "I want to teach my child about sharing",
      stepByStepAnalysis: {
        goalIdentification: `
**Primary Goal:** Moral Development - Teaching the value and joy of sharing
**Emotional Outcome:** Child should feel good about sharing and understand it strengthens relationships
**Learning Opportunity:** Understanding that sharing creates more joy for everyone involved
**Story Purpose:** Educational with strong moral component - helping child internalize sharing as positive behavior`,

        ageAdaptation: `
**Age Suitability (${age} years):** ${
          age <= 4
            ? "Simple sharing scenario with immediate positive results. Show sharing making everyone happy right away."
            : age <= 6
              ? "More complex sharing situation where characters must cooperate and discover sharing helps solve problems."
              : "Sophisticated sharing dilemma where characters learn about equity, generosity, and community building."
        }
**Complexity Decision:** Input is quite simple - needs significant expansion to create full story
**Enhancement Needed:** Create concrete scenario, add emotional stakes, develop character relationships`,

        characterFitting: `
**Character Analysis:** [Assuming characters: "Friendly Bear", "Curious Rabbit", "Wise Owl"]
- Friendly Bear: Natural sharer, models generous behavior, could have something others want
- Curious Rabbit: Might initially be reluctant to share, shows character growth through story
- Wise Owl: Provides gentle guidance about why sharing feels good and helps everyone
**Role Assignment:** Bear demonstrates sharing, Rabbit learns to share, Owl explains the wisdom behind sharing
**Relationship Dynamic:** Friends learning together, with Bear helping Rabbit discover joy of sharing`,

        contentDevelopment: `
**Missing Elements to Add:**
- Specific item or resource that needs sharing
- Initial conflict or hesitation about sharing  
- Demonstration of sharing's positive effects
- Character emotional growth and realization
- Concrete examples of how sharing helps everyone
**Sensory Details:** Descriptions of shared items, characters' expressions, physical actions of sharing
**Dialogue Creation:** Characters discussing feelings, asking to share, expressing gratitude
**Setting:** Create environment where sharing naturally occurs and has visible positive effects`,

        finalStructure: `
**Nine-Scene Arc:**
1. Characters encounter situation where one has something others want
2. Initial reluctance or uncertainty about sharing
3. Wise character suggests trying sharing approach
4. First attempt at sharing with immediate positive result
5. Characters discover sharing creates more fun for everyone
6. Challenge that requires sharing to solve effectively
7. Characters use sharing to overcome challenge successfully
8. Celebration of how sharing made everything better
9. Reflection on how sharing strengthens friendships and creates joy`,
      },
      finalOutput:
        age <= 4
          ? "Simple story where Friendly Bear has a magic ball that becomes more fun when shared. Curious Rabbit learns that sharing the ball makes it bounce higher and creates more games for everyone. Wise Owl explains that sharing makes happiness grow bigger."
          : age <= 6
            ? "Adventure where characters find a treasure map but need everyone's unique skills to follow it. They learn that sharing the map, sharing their special abilities, and sharing the treasure makes the adventure more exciting and the friendship stronger."
            : "Complex story where characters face a community problem that can only be solved by pooling resources and talents. They discover different types of sharing - time, skills, materials - and learn that sharing creates abundance rather than scarcity.",
    },

    {
      userInput:
        "Yesterday my 5-year-old daughter Emma helped our elderly neighbor Mrs. Johnson carry her heavy grocery bags up the stairs to her apartment. Emma was so proud of herself for being strong and helpful. Mrs. Johnson gave Emma a homemade cookie and told her what a wonderful helper she was. That evening, Emma kept talking about how good it felt to help someone and wanted to know if we could help Mrs. Johnson again. I want to create a story about this experience that will reinforce how good it feels to help others and encourage more acts of kindness.",
      stepByStepAnalysis: {
        goalIdentification: `
**Primary Goal:** Experience Processing + Moral Development - Celebrating Emma's kind act and reinforcing the joy of helping others
**Emotional Outcome:** Pride in helping others, understanding that kindness creates good feelings for everyone
**Learning Opportunity:** Discovering that helping others is rewarding and builds community connections
**Story Purpose:** Celebration of real experience while encouraging future acts of kindness`,

        ageAdaptation: `
**Age Suitability (${age} years):** ${
          age <= 4
            ? "Simplify to focus on main helping action and immediate good feelings, with clear cause-and-effect."
            : age <= 6
              ? "Perfect complexity level - can explore Emma's feelings, Mrs. Johnson's gratitude, and planning future help."
              : "Can add layers about community building, different types of help needed, and how kindness spreads."
        }
**Complexity Decision:** Input is rich and detailed - need to organize and structure rather than expand significantly
**Adaptation Strategy:** Preserve all key emotional moments while organizing into clear story progression`,

        characterFitting: `
**Character Analysis:** [Assuming characters include Emma as protagonist, plus "Gentle Giant Dog", "Cheerful Butterfly"]
- Emma: Real child protagonist - helpful, strong, caring, proud of her abilities
- Gentle Giant Dog: Could represent strength used for helping, modeling how being big/strong helps others
- Cheerful Butterfly: Could represent the joy that spreads when we help others, flitting around encouraging more kindness
**Role Integration:** Use animal characters to enhance the real story - Dog could help with other heavy lifting tasks, Butterfly could show how kindness spreads through the building`,

        contentDevelopment: `
**Existing Rich Details to Preserve:**
- Heavy grocery bags and stairs (physical challenge)
- Emma's pride in her strength 
- Mrs. Johnson's homemade cookie reward
- Emma's continued enthusiasm for helping
- The good feelings from helping
**Elements to Enhance:**
- Mrs. Johnson's background and why help matters to her
- Other ways Emma could help in the future
- How other neighbors might notice Emma's kindness
- Emma's growing understanding of community and caring`,

        finalStructure: `
**Nine-Scene Adaptation of Real Experience:**
1. Emma sees Mrs. Johnson struggling with heavy bags
2. Emma offers to help and successfully carries bags upstairs
3. Mrs. Johnson's grateful response and cookie gift
4. Emma's pride and good feelings about helping
5. Emma sharing her experience with family, wanting to help more
6. Planning future ways to help Mrs. Johnson and other neighbors
7. Emma and characters discover other opportunities to help in their building
8. Community of kindness grows as others follow Emma's example
9. Reflection on how helping others makes everyone feel good and builds friendships`,
      },
      finalOutput:
        age <= 4
          ? "Story celebrating Emma as a strong helper who made Mrs. Johnson happy. Focus on the physical act of helping, the thank-you cookie, and Emma's happy feelings. Simple message that helping others feels good."
          : age <= 6
            ? "Rich story exploring Emma's helpful action, Mrs. Johnson's gratitude, and Emma's growing understanding that helping others creates happiness for everyone. Include planning future help and discovering other ways to be kind to neighbors."
            : "Complex narrative about Emma discovering her role in building community through kindness. Explore different types of help people need, how kindness inspires others, and Emma's growth as a community member who looks for ways to help.",
    },
  ];
}

/**
 * Modified generateStoryPremiseSection function with structured story development process
 * @param theme - Story theme
 * @param subject - Story subject or custom user input
 * @param isCustom - Whether this is a custom theme
 * @param age - Child's age (required for custom themes)
 * @param characterDescriptions - Array of character descriptions to integrate
 * @returns Formatted story premise section with structured development process
 */

// export function generateStoryPremiseSection(
//   theme: string,
//   subject: string,
//   isCustom: boolean,
//   age?: number,
// ): string {
//   if (isCustom) {
//     if (!age) {
//       throw new Error("Age is required for custom theme stories");
//     }

//     const customGuidelines = getCustomTheme(age);

//     return `# Custom Story Development Framework (Age ${age})

// ## User Input Analysis Required:
// **Input to Transform:** "${subject}"

// ${customGuidelines.storyAnalysisFramework}

// ${customGuidelines.ageAdaptationGuidelines}

// ${customGuidelines.characterIntegrationStrategy}

// ${customGuidelines.contentExpansionStrategies}

// ${customGuidelines.narrativeStructuringGuidelines}

// ${customGuidelines.detailedExamples}

// ---

// ## Final Story Development Instructions:

// **Process Summary:**
// 1. **Analyze** the user input to identify the core goal and story purpose
// 2. **Adapt** the complexity and approach for age ${age}
// 3. **Integrate** provided characters naturally and meaningfully
// 4. **Develop** missing story elements while preserving authentic details
// 5. **Structure** everything into a compelling nine-scene narrative

// **Remember:** Be flexible and creative while following this structured approach. The goal is creating an engaging, age-appropriate story that achieves the user's intended outcome while providing a complete, satisfying narrative experience.`;
//   }

//   // Keep existing logic for non-custom themes
//   const subjectPrompt = getSubjectPrompt(theme, subject);
//   if (!subjectPrompt) {
//     return `## Story Premise (${theme} - ${subject}):
// Create an engaging story that incorporates the theme of "${theme}" with the subject "${subject}". Focus on age-appropriate content that teaches positive values while entertaining young readers.

// ### Story Guidelines:
// - Integrate the subject naturally into the narrative
// - Ensure the theme influences the story's tone and approach
// - Create educational moments that feel organic to the story
// - Include conflict resolution appropriate for ages 3-8
// - Build towards a satisfying conclusion that reinforces positive messages

// ### Character Integration:
// Design character roles that support the story's theme and subject matter. Each character should contribute meaningfully to exploring the chosen subject.`;
//   }
//   const narrativeArcName = sceneCount === 11 ? "Eleven-Beat Narrative Arc" : "Nine-Beat Narrative Arc";

//   return `## Story Premise (${theme} - ${subject}):
// **Core Concept:** ${subjectPrompt.premise}

// **Central Conflict:** ${subjectPrompt.coreConflict}

// **Emotional Journey:** ${subjectPrompt.emotionalJourney}

// ### Story Development Example Approaches:
// ${subjectPrompt.storyArchetypes
//   .map(
//     (archetype, index) =>
//       `**${index + 1}. ${archetype.name}:**
//   ${archetype.description}
//   ${archetype.characterRoles ? `*Character Roles:* ${archetype.characterRoles}` : ""}
//   ${archetype.exampleScenario ? `*Example:* ${archetype.exampleScenario}` : ""}`,
//   )
//   .join("\n\n")}

// ### Character Integration Guidelines:
// **Solo Adventure:** ${subjectPrompt.characterDynamics.soloCharacterApproach}

// **With Companions:** ${subjectPrompt.characterDynamics.companionIntegration}

// **Group Dynamics:** ${subjectPrompt.characterDynamics.groupDynamics}

// ### Scene Development Framework:
// **Setup Phase (Scenes 1-3):** ${subjectPrompt.sceneGuidance.setupPhase.join(" ")}

// **Development Phase (Scenes 4-6):** ${subjectPrompt.sceneGuidance.developmentPhase.join(" ")}

// **Resolution Phase (Scenes 7-9):** ${subjectPrompt.sceneGuidance.resolutionPhase.join(" ")}

// ### Visual & Atmospheric Guidelines:
// **Setting Variations:** ${subjectPrompt.settingVariations.join(" • ")}

// **Visual Motifs:** ${subjectPrompt.visualMotifs.join(" • ")}

// **Color Palette Suggestions:** ${subjectPrompt.colorPaletteSuggestions.join(" • ")}

// ${
//   subjectPrompt.learningObjectives
//     ? `### Learning Objectives:
// ${subjectPrompt.learningObjectives.join(" • ")}`
//     : ""
// }

// ${
//   subjectPrompt.skillBuilding
//     ? `### Skill Building Focus:
// ${subjectPrompt.skillBuilding.join(" • ")}`
//     : ""
// }

// ### Theme Integration:
// ${subjectPrompt.themeIntegration}`;
// }

export function generateStoryPremiseSection(
  theme: string,
  subject: string,
  isCustom: boolean,
  age?: number,
): string {
  if (isCustom) {
    if (!age) {
      throw new Error("Age is required for custom theme stories");
    }
    // This section would also be updated to reflect the 11-beat arc and continuity rules for custom stories.
    // For now, returning a simplified version acknowledging the update.
    return `## Story Premise (Custom Theme):
${CUSTOM_THEME_GUIDELINES.premise}

### Custom Story Guidelines:
${CUSTOM_THEME_GUIDELINES.storyGuidelines}

### Subject Description:
"${subject}"

### Character Integration for Custom Theme:
${CUSTOM_THEME_GUIDELINES.characterIntegration}

### Theme Overlay:
${CUSTOM_THEME_GUIDELINES.themeOverlay}`;
  }

  const subjectPrompt = getSubjectPrompt(theme, subject);
  if (!subjectPrompt) {
    return `## Story Premise (${theme} - ${subject}):
Create an engaging story that incorporates the theme of "${theme}" with the subject "${subject}". Focus on age-appropriate content that teaches positive values while entertaining young readers.

### Story Guidelines:
- Integrate the subject naturally into the narrative and an eleven-beat arc.
- Ensure the theme influences the story's tone and approach
- Create educational moments that feel organic to the story
- Include conflict resolution appropriate for ages 3-8
- Build towards a satisfying conclusion that reinforces positive messages

### Character Integration:
Design character roles that support the story's theme and subject matter. Each character should contribute meaningfully to exploring the chosen subject.`;
  }

  const narrativeArcName =
    sceneCount === 11 ? "Eleven-Beat Narrative Arc" : "Nine-Beat Narrative Arc";

  return `## Story Premise (${theme} - ${subject}):
**Core Concept:** ${subjectPrompt.premise}

**Central Conflict:** ${subjectPrompt.coreConflict}

**Emotional Journey:** ${subjectPrompt.emotionalJourney}

### Story Development Guidelines (${narrativeArcName}):
- **Camera Shot Pattern:** Wide (1, 4, 7, 10), Medium (2, 5, 8, 11), Close-up (3, 6, 9).
- **Continuity Rule:** For scenes 2–${sceneCount}, the first line of story_text must gently reference the prior scene. For scenes 1–${sceneCount - 1}, the last line should softly set a micro-goal or question.
- **Open & Close Formula:** Scene 1 (3 lines): ordinary world → gentle trigger → small decision. Scene ${sceneCount} (2–3 lines): calm resolution → child-friendly lesson → cosy final image.

### Story Development Example Approaches:
${subjectPrompt.storyArchetypes
  .map(
    (archetype, index) =>
      `**${index + 1}. ${archetype.name}:**
  ${archetype.description}
  ${archetype.characterRoles ? `*Character Roles:* ${archetype.characterRoles}` : ""}
  ${archetype.exampleScenario ? `*Example:* ${archetype.exampleScenario}` : ""}`,
  )
  .join("\n\n")}

### Character Integration Guidelines:
**Solo Adventure:** ${subjectPrompt.characterDynamics.soloCharacterApproach}

**With Companions:** ${subjectPrompt.characterDynamics.companionIntegration}

**Group Dynamics:** ${subjectPrompt.characterDynamics.groupDynamics}

### Scene Development Framework (${sceneCount} Scenes):
**Setup Phase (Scenes 1-4):** ${subjectPrompt.sceneGuidance.setupPhase.join(" ")}

**Development Phase (Scenes 5-8):** ${subjectPrompt.sceneGuidance.developmentPhase.join(" ")}

**Resolution Phase (Scenes 9-11):** ${subjectPrompt.sceneGuidance.resolutionPhase.join(" ")}

### Visual & Atmospheric Guidelines:
**Setting Variations:** ${subjectPrompt.settingVariations.join(" • ")}

**Visual Motifs:** ${subjectPrompt.visualMotifs.join(" • ")}

**Color Palette Suggestions:** ${subjectPrompt.colorPaletteSuggestions.join(" • ")}

${
  subjectPrompt.learningObjectives
    ? `### Learning Objectives:
${subjectPrompt.learningObjectives.join(" • ")}`
    : ""
}

${
  subjectPrompt.skillBuilding
    ? `### Skill Building Focus:
${subjectPrompt.skillBuilding.join(" • ")}`
    : ""
}

### Theme Integration:
${subjectPrompt.themeIntegration}`;
}
