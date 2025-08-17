// Theme and Subject data structures for the new story creation workflow

export interface Subject {
  id: string;
  name: string;
  image: string;
  description?: string;
}

export interface Theme {
  id: string;
  name: string;
  image: string;
  description?: string;
  subjects: Subject[];
}

const EDUCATIONAL_THEME: Theme = {
  id: "educational",
  name: "Educational",
  image: "/themes_and_subjects/education.png",
  description: "Learning through fun stories",
  subjects: [
    {
      id: "alphabet",
      name: "Alphabet",
      image: "/themes_and_subjects/alphabets.png",
      description: "Learning letters and sounds",
    },
    {
      id: "learning-to-count",
      name: "Learning to Count",
      image: "/themes_and_subjects/learning-to-count.png",
      description: "Numbers and counting",
    },
    {
      id: "shapes-and-colours",
      name: "Shapes and colours",
      image: "/themes_and_subjects/shapes-and-colours.png",
      description: "Shapes, sizes, and colours",
    },
    {
      id: "first-words",
      name: "First Words",
      image: "/themes_and_subjects/first-words.png",
      description: "Early vocabulary",
    },
    {
      id: "body-parts",
      name: "Body Parts",
      image: "/themes_and_subjects/body-parts.png",
      description: "Learning about the body",
    },
    {
      id: "to-school",
      name: "To School",
      image: "/themes_and_subjects/to-school.png",
      description: "Starting school",
    },
    {
      id: "learning-to-walk",
      name: "Learning to walk",
      image: "/themes_and_subjects/learning-to-walk.png",
      description: "First steps",
    },
    {
      id: "weaning-off-the-pacifier",
      name: "Weaning off the pacifier",
      image: "/themes_and_subjects/weaning-off-the-pacifier.png",
      description: "Growing up milestones",
    },
    {
      id: "brushing-teeth",
      name: "Brushing teeth",
      image: "/themes_and_subjects/brushing-teeth.png",
      description: "Healthy habits",
    },
    {
      id: "telling-the-time",
      name: "Telling the time",
      image: "/themes_and_subjects/telling-the-time.png",
      description: "Learning time",
    },
    {
      id: "seasons-and-weather",
      name: "Seasons and Weather",
      image: "/themes_and_subjects/seasons-and-weathers.png",
      description: "Weather and seasons",
    },
  ],
};

const FAIRY_TALES_THEME: Theme = {
  id: "fairy-tales",
  name: "Fairy Tales",
  image: "/themes_and_subjects/fairy-tales.png",
  description: "Classic magical stories",
  subjects: [
    {
      id: "fairy-tales-classic",
      name: "Fairy Tales",
      image: "/themes_and_subjects/fairy.png",
      description: "Traditional fairy tale stories",
    },
    {
      id: "fantasy-worlds",
      name: "Fantasy Worlds",
      image: "/themes_and_subjects/fantasy-worlds.png",
      description: "Magical realms and creatures",
    },
    {
      id: "unicorns",
      name: "Unicorns",
      image: "/themes_and_subjects/unicorns.png",
      description: "Magical unicorn adventures",
    },
    {
      id: "knights-and-dragons",
      name: "Knights and Dragons",
      image: "/themes_and_subjects/knights-and-dragons.png",
      description: "Heroic tales",
    },
    {
      id: "princes-and-princesses",
      name: "Princes and Princesses",
      image: "/themes_and_subjects/princes-and-princesses.png",
      description: "Royal adventures",
    },
    {
      id: "wizard-school",
      name: "Wizard School",
      image: "/themes_and_subjects/wizard-school.png",
      description: "Magic and learning",
    },
  ],
};

const ADVENTURE_THEME: Theme = {
  id: "adventure",
  name: "Adventure",
  image: "/themes_and_subjects/adventure.png",
  description: "Exciting journeys and quests",
  subjects: [
    {
      id: "travel",
      name: "Travel",
      image: "/themes_and_subjects/travel.png",
      description: "Exploring new places",
    },
    {
      id: "pirates",
      name: "Pirates",
      image: "/themes_and_subjects/pirates.png",
      description: "High seas adventures",
    },
    {
      id: "space",
      name: "Space",
      image: "/themes_and_subjects/space.png",
      description: "Cosmic exploration",
    },
    {
      id: "underwater",
      name: "Underwater",
      image: "/themes_and_subjects/underwater.png",
      description: "Ocean adventures",
    },
    {
      id: "time-travel",
      name: "Time Travel",
      image: "/themes_and_subjects/time-travel.png",
      description: "Journeying through time",
    },
    {
      id: "jungle",
      name: "Jungle",
      image: "/themes_and_subjects/jungle.png",
      description: "Wild rainforest journeys",
    },
    {
      id: "dinosaurs",
      name: "Dinosaurs",
      image: "/themes_and_subjects/dinosaurs.png",
      description: "Prehistoric adventures",
    },
    {
      id: "wild-west",
      name: "Wild West",
      image: "/themes_and_subjects/wild-west.png",
      description: "Cowboys and deserts",
    },
    {
      id: "treasure-hunt",
      name: "Treasure Hunt",
      image: "/themes_and_subjects/treasure-hunt.png",
      description: "Searching for hidden treasures",
    },
    {
      id: "haunted-house",
      name: "Haunted House",
      image: "/themes_and_subjects/haunted-house.png",
      description: "Spooky explorations",
    },
    {
      id: "secret-mission",
      name: "Secret Mission",
      image: "/themes_and_subjects/secret-mission.png",
      description: "Top-secret quests",
    },
  ],
};

const ACTIVITIES_THEME: Theme = {
  id: "activities",
  name: "Activities",
  image: "/themes_and_subjects/activities.png",
  description: "Fun hobbies and everyday play",
  subjects: [
    {
      id: "cooking-and-baking",
      name: "Cooking and Baking",
      image: "/themes_and_subjects/cooking-and-baking.png",
      description: "Kitchen fun",
    },
    {
      id: "arts-and-crafts",
      name: "Arts and Crafts",
      image: "/themes_and_subjects/arts-and-crafts.png",
      description: "Creative projects",
    },
    {
      id: "painting",
      name: "Painting",
      image: "/themes_and_subjects/painting.png",
      description: "Colorful art time",
    },
    {
      id: "making-music",
      name: "Making Music",
      image: "/themes_and_subjects/making-music.png",
      description: "Rhythm and melodies",
    },
    {
      id: "dancing",
      name: "Dancing",
      image: "/themes_and_subjects/dancing.png",
      description: "Move and groove",
    },
    {
      id: "caring-for-animals",
      name: "Caring for Animals",
      image: "/themes_and_subjects/caring-for-animals.png",
      description: "Kindness to pets",
    },
    {
      id: "outdoor-play",
      name: "Outdoor Play",
      image: "/themes_and_subjects/outdoor-play.png",
      description: "Fun outside",
    },
    {
      id: "sports",
      name: "Sports",
      image: "/themes_and_subjects/sports.png",
      description: "Games and teamwork",
    },
    {
      id: "gaming",
      name: "Gaming",
      image: "/themes_and_subjects/gaming.png",
      description: "Video game adventures",
    },
    {
      id: "sleepover",
      name: "Sleepover",
      image: "/themes_and_subjects/sleepover.png",
      description: "Friends and pajamas",
    },
    {
      id: "building-a-treehouse",
      name: "Building a treehouse",
      image: "/themes_and_subjects/building-a-treehouse.png",
      description: "Hands-on building",
    },
    {
      id: "go-to-the-beach",
      name: "Go to the beach",
      image: "/themes_and_subjects/go-to-the-beach.png",
      description: "Sand and sea",
    },
    {
      id: "to-the-forest",
      name: "To the forest",
      image: "/themes_and_subjects/to-the-forest.png",
      description: "Trees and trails",
    },
    {
      id: "to-the-farm",
      name: "To the farm",
      image: "/themes_and_subjects/to-the-farm.png",
      description: "Barns and fields",
    },
    {
      id: "visit-the-zoo",
      name: "Visit the zoo",
      image: "/themes_and_subjects/visiting-a-zoo.png",
      description: "Animal encounters",
    },
    {
      id: "visit-the-doctor",
      name: "Visit the Doctor",
      image: "/themes_and_subjects/visit-the-doctor.png",
      description: "Health checkups",
    },
    {
      id: "visit-the-dentist",
      name: "Visit the Dentist",
      image: "/themes_and_subjects/visit-the-dentist.png",
      description: "Dental care",
    },
    {
      id: "gardening",
      name: "Gardening",
      image: "/themes_and_subjects/gardening.png",
      description: "Growing plants",
    },
  ],
};

export const STORIES_THEME: Theme = {
  id: "stories",
  name: "Stories",
  image: "/themes_and_subjects/stories.png",
  description: "Different styles of storytelling",
  subjects: [
    {
      id: "bedtime-story",
      name: "Bedtime story",
      image: "/themes_and_subjects/bedtime-story.png",
      description: "Calming bedtime tales",
    },
    {
      id: "humorous-story",
      name: "Humorous story",
      image: "/themes_and_subjects/humorous-story.png",
      description: "Funny and lighthearted stories",
    },
  ],
};

export const HOLIDAYS_THEME: Theme = {
  id: "holidays",
  name: "Holidays",
  image: "/themes_and_subjects/holidays.png",
  description: "Seasonal celebrations",
  subjects: [
    {
      id: "birthday",
      name: "Birthday",
      image: "/themes_and_subjects/birthday.png",
      description: "Birthday fun",
    },
    {
      id: "christmas",
      name: "Christmas",
      image: "/themes_and_subjects/christmas.png",
      description: "Festive cheer",
    },
    {
      id: "easter",
      name: "Easter",
      image: "/themes_and_subjects/easter.png",
      description: "Springtime joy",
    },
    {
      id: "halloween",
      name: "Halloween",
      image: "/themes_and_subjects/halloween.png",
      description: "Halloween fun and costumes",
    },
    {
      id: "world-animal-day",
      name: "World Animal Day",
      image: "/themes_and_subjects/world-animal-day.png",
      description: "Celebrating animals",
    },
    {
      id: "eid-al-fitr",
      name: "Eid al-Fitr",
      image: "/themes_and_subjects/eid-al-fitr.png",
      description: "End of Ramadan celebration",
    },
    {
      id: "saint-nicholas",
      name: "Saint Nicholas",
      image: "/themes_and_subjects/saint-nicholas.png",
      description: "St. Nicholas traditions",
    },
    {
      id: "fathers-day",
      name: "Father’s Day",
      image: "/themes_and_subjects/fathers-day.png",
      description: "Celebrating dads",
    },
    {
      id: "mothers-day",
      name: "Mother’s Day",
      image: "/themes_and_subjects/mothers-day.png",
      description: "Celebrating moms",
    },
    {
      id: "new-year-eve",
      name: "New Year’s Eve",
      image: "/themes_and_subjects/new-year-eve.png",
      description: "Year-end festivities",
    },
    {
      id: "carnival",
      name: "Carnival",
      image: "/themes_and_subjects/carnival.png",
      description: "Parades and costumes",
    },
  ],
};

const FAMILY_THEME: Theme = {
  id: "family",
  name: "Family",
  image: "/themes_and_subjects/family.png",
  description: "Stories about family life and feelings",
  subjects: [
    {
      id: "new-baby",
      name: "New baby",
      image: "/themes_and_subjects/new-baby.png",
      description: "Welcoming a new sibling",
    },
    {
      id: "gets-a-little-sister",
      name: "Gets a little sister",
      image: "/themes_and_subjects/gets-a-little-sister.png",
      description: "Having a baby sister",
    },
    {
      id: "gets-a-little-brother",
      name: "Gets a little brother",
      image: "/themes_and_subjects/gets-a-little-brother.png",
      description: "Having a baby brother",
    },
    {
      id: "moving",
      name: "Moving",
      image: "/themes_and_subjects/moving.png",
      description: "New house, new place",
    },
    {
      id: "vacation",
      name: "Vacation",
      image: "/themes_and_subjects/vacation.png",
      description: "Family trips and fun",
    },
    {
      id: "train-travel",
      name: "Train travel",
      image: "/themes_and_subjects/train-travel.png",
      description: "Riding the rails",
    },
    {
      id: "visiting-amusement-parks",
      name: "Visiting amusement parks",
      image: "/themes_and_subjects/visiting-amusement-parks.png",
      description: "Rides and thrills",
    },
    {
      id: "parents-seperation",
      name: "Parents separation",
      image: "/themes_and_subjects/parents-seperation.png",
      description: "Understanding family changes",
    },
    {
      id: "blended-family",
      name: "Blended family",
      image: "/themes_and_subjects/blended-family.png",
      description: "New family structures",
    },
    {
      id: "saying-goodbye",
      name: "Saying goodbye",
      image: "/themes_and_subjects/saying-goodbye.png",
      description: "Dealing with goodbyes",
    },
    {
      id: "marriage",
      name: "Marriage",
      image: "/themes_and_subjects/marriage.png",
      description: "Weddings and celebrations",
    },
  ],
};

const MORALS_THEME: Theme = {
  id: "morals",
  name: "Morals",
  image: "/themes_and_subjects/morals.png",
  description: "Stories that teach important life lessons",
  subjects: [
    {
      id: "patience-grows-good-things",
      name: "Patience grows good things",
      image: "/themes_and_subjects/patience-grows-good-things.png",
      description: "Real growth takes time; caring and waiting beat rushing.",
    },
    {
      id: "practice-makes-progress",
      name: "Practice makes progress",
      image: "/themes_and_subjects/practice-makes-progress.png",
      description:
        "Improvement comes from trying, making mistakes, and trying again.",
    },
    {
      id: "be-gentle-with-living-things",
      name: "Be gentle with living things",
      image: "/themes_and_subjects/be-gentle-with-living-things.png",
      description:
        "Animals and plants deserve kindness; small acts can be big.",
    },
    {
      id: "take-care-of-your-world",
      name: "Take care of your world",
      image: "/themes_and_subjects/take-care-of-your-world.png",
      description:
        "Clean up, share, and respect—your choices help everyone.",
    },
    {
      id: "tell-the-truth-and-fix-it",
      name: "Tell the truth and fix it",
      image: "/themes_and_subjects/tell-the-truth-and-fix-it.png",
      description:
        "Being honest and making repairs builds trust and courage.",
    },
    {
      id: "think-first-then-act",
      name: "Think first, then act",
      image: "/themes_and_subjects/think-first-then-act.png",
      description:
        "Pause, breathe, and choose carefully when feelings are big.",
    },
    {
      id: "curiosity-leads-to-discovery",
      name: "Curiosity leads to discovery",
      image: "/themes_and_subjects/curiosity-leads-to-discovery.png",
      description:
        "Asking questions opens doors; exploring safely grows wisdom.",
    },
    {
      id: "keep-going-adjust-the-plan",
      name: "Keep going, adjust the plan",
      image: "/themes_and_subjects/keep-going-adjust-the-plan.png",
      description:
        "When something’s hard, tweak the steps and try another way.",
    },
    {
      id: "calm-body-clear-choices",
      name: "Calm body, clear choices",
      image: "/themes_and_subjects/calm-body-clear-choices.png",
      description:
        "Slow breathing helps brains make kinder, smarter choices.",
    },
    {
      id: "courage-with-care",
      name: "Courage with care",
      image: "/themes_and_subjects/courage-with-care.png",
      description:
        "Be brave, move thoughtfully, and avoid risky or rough choices.",
    },
  ],
};

// All themes array
export const ALL_THEMES: Theme[] = [
  EDUCATIONAL_THEME,
  FAIRY_TALES_THEME,
  ADVENTURE_THEME,
  ACTIVITIES_THEME,
  STORIES_THEME,
  HOLIDAYS_THEME,
  FAMILY_THEME,
  MORALS_THEME,
];

// Utility functions
export const getThemeById = (id: string): Theme | undefined => {
  return ALL_THEMES.find((theme) => theme.id === id);
};

export const getSubjectById = (
  themeId: string,
  subjectId: string,
): Subject | undefined => {
  const theme = getThemeById(themeId);
  return theme?.subjects.find((subject) => subject.id === subjectId);
};

export const getAllSubjects = (): Subject[] => {
  return ALL_THEMES.flatMap((theme) => theme.subjects);
};
