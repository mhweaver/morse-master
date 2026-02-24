/**
 * ContentGenerator - Generates training challenges
 * Handles real content selection, synthetic challenge generation, and AI operations
 */

import {
  CONTENT_GENERATION,
  KOCH_SEQUENCE,
  AI_PROMPTS,
  MORSE_LIB,
  DIFFICULTY
} from './constants.js';
import { AccuracyTracker } from './accuracy-tracker.js';
import { DifficultyCalculator } from './difficulty-calculator.js';

// --- Training Content ---
export const COMMON_ABBR = [
  { code: "CQ", meaning: "Calling any station" }, { code: "DE", meaning: "From" }, { code: "RST", meaning: "Signal report" },
  { code: "QTH", meaning: "Location" }, { code: "OP", meaning: "Operator" }, { code: "HW", meaning: "How copy?" },
  { code: "BK", meaning: "Back / Break" }, { code: "SK", meaning: "End of contact" }, { code: "TU", meaning: "Thank you" },
  { code: "73", meaning: "Best regards" }, { code: "GA", meaning: "Go ahead" }, { code: "GM", meaning: "Good morning" },
  { code: "GN", meaning: "Good night" }, { code: "UR", meaning: "Your / You are" }, { code: "WX", meaning: "Weather" },
  { code: "FB", meaning: "Fine Business (Good)" }, { code: "OM", meaning: "Old Man (Friend)" }, { code: "YL", meaning: "Young Lady" },
  { code: "XYL", meaning: "Wife" }, { code: "RIG", meaning: "Radio equipment" }, { code: "ANT", meaning: "Antenna" },
  { code: "HR", meaning: "Here" }, { code: "ES", meaning: "And" }, { code: "FER", meaning: "For" }
];

export const Q_CODES = [
  { code: "QRL", meaning: "Are you busy?" }, { code: "QRM", meaning: "Interference" }, { code: "QRN", meaning: "Static" },
  { code: "QRO", meaning: "Increase power" }, { code: "QRP", meaning: "Low power" }, { code: "QRQ", meaning: "Send faster" },
  { code: "QRS", meaning: "Send slower" }, { code: "QRT", meaning: "Stop sending" }, { code: "QRV", meaning: "I am ready" },
  { code: "QRZ", meaning: "Who is calling?" }, { code: "QSB", meaning: "Fading signal" }, { code: "QSL", meaning: "Acknowledged" },
  { code: "QSY", meaning: "Change freq" }, { code: "QRL?", meaning: "Are you busy?" }, { code: "QRV?", meaning: "Are you ready?" },
  { code: "QTH?", meaning: "Location?" }
];

export const PHRASES = [
  "TNX FER CALL", "MY NAME IS", "UR RST IS 5NN", "QTH IS NEW YORK", "FB OM TU 73", "QRZ DE K1ABC",
  "WX HR IS SUNNY", "RIG HR IS QRP", "HW CPY? BK", "GM OM GA", "NAME?", "QTH?", "RST?", "RIG?",
  "AGE?", "CALL?", "K1ABC/P", "W1AW/3", "FREQ?", "QSL?", "R.I.P.", "U.S.A.", "JAN.", "FEB.",
  "A, B, C", "1, 2, 3", "NOW, LATER", "THANKS FOR THE CALL", "GOOD MORNING SIR", "NICE TO MEET YOU",
  "RECEIVING YOU LOUD AND CLEAR", "YOUR SIGNAL IS EXCELLENT", "STANDING BY FOR YOUR RESPONSE",
  "PLEASE WAIT ONE MOMENT", "END OF MESSAGE", "END OF TRANSMISSION", "GOING TO SLEEP NOW",
  "TALK TO YOU LATER", "BEST OF LUCK TO YOU", "HAPPY TO WORK YOU", "LOOKING FORWARD TO OUR CONTACT",
  "THANKS FOR THE CONTACT", "OP IS ON VACATION", "ANTENNA IS DOWN FOR REPAIR", "STATION IS SHUT DOWN",
  "LETS CHANGE FREQUENCY", "WILL YOU CHECK MY SIGNAL", "WHAT IS YOUR POWER OUTPUT", "HOW IS MY ENGLISH",
  "MAY I HAVE YOUR NAME", "PLEASE SPELL YOUR LOCATION", "CONFIRM YOUR LOCATION", "YOUR CALL SIGN PLEASE",
  "NICE WEATHER TODAY", "WEATHER IS POOR HERE", "TEMPERATURE HERE IS 70", "RAINING WHERE YOU ARE",
  "LETS KEEP IN TOUCH", "SEE YOU ON THE AIR", "PERHAPS WE WILL MEET", "HOPE TO HEAR YOU SOON",
  "WHAT IS YOUR AGE", "HOW LONG ON CW", "BEEN DOING THIS FOR YEARS", "JUST GETTING STARTED",
  "RIG IS A SIMPLE SETUP", "ANTENNA IS NOT VERY GOOD", "SIGNAL IS GETTING WEAK", "INTERFERENCE IS HEAVY",
  "I WILL LISTEN FOR YOU", "KEEP TRYING AGAIN", "DIFFICULT CONDITIONS TODAY", "PROPAGATION IS GOOD",
  "CONTEST QSO", "FIELD DAY EVENT", "ACTIVATION SCHEDULE", "WILL SEND QSLS SOON", "PLEASE SEND RETURN",
  "WORKING AT HOME STATION", "USING PORTABLE TO HILLTOP", "BATTERY POWERED TOMORROW", "RUNNING QRP ONLY",
  "MOBILE INSTALLATION COMPLETE", "EMERGENCY USE ONLY", "TESTING NEW EQUIPMENT", "FREQUENCY IN USE",
  "SORRY WRONG NUMBER", "STAND BY PLEASE", "LOUD AND CLEAR", "VERY STRONG SIGNAL", "FADING NOW",
  "BAND CONDITIONS IMPROVING", "TRY AGAIN LATER", "WILL RETURN SOON", "TEMPORARILY OFF AIR",
  "THANKS FOR QSO", "ENJOY THE REST OF YOUR DAY", "SAFE TRAVELS TO YOU", "VISIT US SOMETIME",
  "DID YOU COPY THAT", "PLEASE REPEAT ADDRESS", "COPY YOUR DETAILS", "CONFIRM ALL INFO"
];

export const DICTIONARY = [
  "US", "SUM", "AS", "ASK", "ARK", "ARM", "RAM", "AM", "MAP", "SAP", "SUP", "UP", "PAPA", "SPAM", "PUMP",
  "AT", "MAT", "PAT", "TAP", "SAT", "RAT", "PART", "TRAP", "STAR", "START", "TART", "PUT", "RUT", "MUST",
  "TRUST", "PAST", "MAST", "ALL", "TALL", "PAL", "LAP", "SLAP", "LULL", "PULL", "PLUM", "SLUM", "ALARM",
  "ALTAR", "SALT", "POT", "TOP", "LOT", "ROT", "TO", "SO", "OR", "OUR", "OUT", "LOOP", "TOOL", "POOL",
  "ROOT", "MOP", "POP", "SOP", "LOOT", "TROOP", "MOTOR", "ROTOR", "SOLO", "TOTAL", "POOR", "TOUR", "LOW",
  "ROW", "TOW", "BOW", "SOW", "MOW", "PAW", "LAW", "SAW", "RAW", "WAR", "WAS", "WOOL", "SLOW", "FLOW",
  "BLOW", "GLOW", "WAIT", "WALL", "WILL", "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ANY", "CAN",
  "HAD", "HER", "ONE", "DAY", "GET", "HAS", "HIM", "RADIO", "POWER", "SIGNAL", "HAM", "KEY", "MORSE", "TIME", "WORD", "NAME",
  "WORK", "CALL", "LOVE", "LIFE", "HOPE", "HELP", "MAKE", "TAKE", "LIKE", "PLAY", "STAY", "PITY",
  "MAIL", "RAIL", "SAIL", "TAIL", "FAIL", "NAIL", "HAIL", "JAIL", "PAIL", "WAIL", "BAIT", "WAIT",
  "LATE", "RATE", "MATE", "FATE", "GATE", "HATE", "DATE", "PATE", "SATE", "MORE", "SORE", "CORE",
  "BORE", "TORE", "WORE", "PORE", "FORE", "LORE", "GORE", "STORE", "SHORE", "SCORE", "SNORE", "SWORE",
  "ABLE", "TABLE", "STABLE", "CABLE", "FABLE", "MAPLE", "STAPLE", "SIMPLE", "SAMPLE", "AMPLE", "TEMPLE",
  "APPLE", "RIPPLE", "NIPPLE", "SUPPLY", "REPLY", "APPLY", "IMPLY", "COMPLY", "EMPLOY", "DEPLOY",
  "BOX", "FOX", "MIX", "FIX", "SIX", "WAX", "TAX", "LAX", "SAX", "PAX", "PLEX", "TEXT", "NEXT", "EXIT",
  "AXE", "FAX", "MAX", "RELAX", "ANNEX", "COMPLEX", "PERPLEX", "AFFLUX", "INFLUX",
  "GOOD", "WOOD", "FOOD", "MOOD", "HOOD", "STOOD", "FLOOD", "BLOOD", "BROOD", "UNDERSTOOD",
  "BIG", "DIG", "FIG", "GIG", "JIG", "PIG", "RIG", "WIG", "BRIG", "TWIG", "WHIG", "SPRIG",
  "BAD", "CAD", "DAD", "FAD", "GAD", "LAD", "MAD", "PAD", "RAD", "SAD", "TAD", "WAD", "BRAD", "CHAD",
  "BED", "FED", "LED", "RED", "TED", "WED", "BRED", "FLED", "SHRED", "SPREAD", "THREAD", "SHED",
  "DOG", "FOG", "HOG", "JOG", "LOG", "BOG", "COG", "BLOG", "CLOG", "FROG", "SLOG", "SMOG",
  "BAG", "GAG", "HAG", "JAG", "LAG", "NAG", "RAG", "SAG", "TAG", "WAG", "BRAG", "DRAG", "FLAG", "SNAG",
  "CAT", "BAT", "FAT", "GAT", "HAT", "LAT", "VAT", "BRAT", "CHAT", "FLAT",
  "BIT", "FIT", "GIT", "HIT", "KIT", "LIT", "PIT", "SIT", "WIT", "BRIT", "FLIT", "GRIT", "SLIT", "SPIT",
  "CUT", "GUT", "HUT", "JUT", "NUT", "GLUT", "SHUT", "SLUT", "SMUT", "STRUT",
  "DRY", "FRY", "PRY", "TRY", "WRY", "CRY", "BURY", "FERRY", "HURRY", "WORRY", "HAIRY", "FAIRY", "DIARY",
  "FIVE", "GIVE", "HIVE", "LIVE", "DIVE", "DRIVE", "STRIVE", "ALIVE", "ARRIVE", "DERIVE", "FORGIVE",
  "LOVE", "DOVE", "COVE", "GROVE", "GLOVE", "PROVE", "SHOVE", "TROVE", "ABOVE", "BEHOVE",
  "MAKE", "BAKE", "CAKE", "FAKE", "LAKE", "RAKE", "SAKE", "WAKE", "BRAKE", "DRAKE", "FLAKE", "SHAKE",
  "LIKE", "BIKE", "HIKE", "MIKE", "PIKE", "STRIKE", "SPIKE", "ALIKE", "DISLIKE",
  "MEET", "BEET", "FEET", "FLEET", "GREET", "SHEET", "SLEET", "STREET", "SWEET", "TWEET",
  "BEAT", "FEAT", "HEAT", "MEAT", "NEAT", "PEAT", "SEAT", "CHEAT", "TREAT", "WHEAT", "GREAT",
  "BOOK", "COOK", "HOOK", "LOOK", "TOOK", "BROOK", "CROOK", "SHOOK", "FORSOOK", "MISTOOK",
  "SCHOOL", "COOL", "FOOL", "STOOL", "SPOOL",
  "BLUE", "CLUE", "GLUE", "TRUE", "FLEW", "BLEW", "BREW", "CREW", "DREW", "GREW", "SLEW", "STEW", "SCREW", "SHREW",
  "KNOW", "BLOW", "PLOW", "SNOW", "SHOW", "CROW", "BROW", "GROW", "THROW", "MEOW",
  "ROAD", "TOAD", "LOAD", "BROAD", "GOAD",
  "BOAT", "COAT", "GOAT", "MOAT", "FLOAT", "THROAT",
  "SEEN", "BEEN", "KEEN", "QUEEN", "SCREEN", "GREEN", "SHEEN", "TEEN", "BETWEEN",
  "KEEP", "BEEP", "DEEP", "JEEP", "PEEP", "SEEP", "SLEEP", "STEEP", "SWEEP", "CREEP", "ASLEEP",
  "REAL", "DEAL", "HEAL", "MEAL", "PEAL", "SEAL", "TEAL", "VEAL", "STEAL", "WHEEL", "APPEAL",
  "HEAR", "DEAR", "FEAR", "GEAR", "NEAR", "PEAR", "REAR", "SEAR", "TEAR", "WEAR", "BEAR", "CLEAR", "SMEAR",
  "YEAR", "BEER", "DEER", "JEER", "LEER", "PEER", "SEER", "VEER", "CHEER", "SHEER", "SNEER", "STEER", "CHEER",
  "HIGH", "NIGH", "SIGH", "THIGH", "NIGHT", "SIGHT", "MIGHT", "FIGHT", "LIGHT", "RIGHT", "TIGHT", "BRIGHT", "FLIGHT",
  "MUSIC", "MAGIC", "PANIC", "PICNIC", "PUBLIC", "TRAGIC", "FABRIC", "TRAFFIC", "PLASTIC", "ELASTIC",
  "HOUSE", "MOUSE", "LOUSE", "SPOUSE", "DOUSE", "GROUSE", "BLOUSE", "ROUSE", "SOUSE",
  "CAUSE", "PAUSE", "CLAUSE", "BECAUSE", "APPLAUSE",
  "GABLE", "SABLE", "ENABLE", "UNABLE",
  "DAPPLE", "GRAPPLE", "SIMPLE", "DIMPLE", "PIMPLE", "SAMPLE", "EXAMPLE",
  "BOTTLE", "THROTTLE", "LITTLE", "BRITTLE", "CATTLE", "BATTLE", "PRATTLE", "RATTLE", "TATTLE", "SETTLE",
  "MIDDLE", "FIDDLE", "DIDDLE", "RIDDLE", "STRADDLE", "PADDLE", "SADDLE",
  "BUTTON", "MUTTON", "COTTON", "ROTTEN", "KITTEN", "MITTEN", "BITTEN", "WRITTEN", "FLATTEN", "OTTEN",
  "LETTER", "BETTER", "SETTER", "WETTER", "FETTER", "GETTER", "SCATTER", "SHATTER", "FLATTER",
  "SUPPER", "COPPER", "HOPPER", "POPPER", "CHOPPER", "SHOPPER", "STOPPER", "TOPPER", "DROPPER",
  "DINNER", "WINNER", "SINNER", "THINNER", "SPINNER", "BEGINNER",
  "MATTER", "FATTER", "LATTER", "PATTER", "CHATTER", "CLATTER", "TATTER",
  "SUDDEN", "HIDDEN", "RIDDEN", "FORBIDDEN",
  "SADNESS", "MADNESS", "BADNESS", "GLADNESS",
  "KINDNESS", "BLINDNESS", "BOLDNESS", "COLDNESS", "FONDNESS", "ODDNESS",
  "BUSINESS", "ILLNESS", "DULLNESS", "FULLNESS", "STILLNESS",
  "WITHOUT", "ABOUT", "SHOUT", "SCOUT", "SPROUT", "DOUBT", "CLOUT", "FLOUT", "GROUT", "SNOUT",
  "BRING", "RING", "SING", "WING", "STING", "SLING", "SPRING", "STRING", "CLING", "FLING", "SWING",
  "THING", "THINK", "BLINK", "CLINK", "DRINK", "SINK", "LINK", "PINK", "BRINK", "STINK",
  "BANK", "BLANK", "DANK", "FRANK", "PLANK", "PRANK", "RANK", "SANK", "TANK", "YANK", "THANK", "SHANK",
  "WEAK", "BEAK", "LEAK", "PEAK", "SPEAK", "SQUEAK", "STEAK", "BREAK", "FREAK", "SNEAK", "STREAK",
  "PEACE", "PLACE", "SPACE", "TRACE", "GRACE", "BRACE", "FACE", "LACE", "RACE", "PACE", "CHASE",
  "PREACH", "REACH", "BEACH", "TEACH", "PLEASE", "TEASE", "LEASE", "CREASE",
  "FRIEND", "SEND", "BEND", "FEND", "LEND", "MEND", "REND", "TEND", "VEND", "WEND", "BLEND", "SPEND", "TREND",
  "HAND", "BAND", "LAND", "SAND", "STAND", "BRAND", "GRAND", "STRAND",
  "WIND", "FIND", "KIND", "MIND", "BIND", "GRIND", "BLIND", "REMIND",
  "BOLD", "COLD", "FOLD", "GOLD", "HOLD", "MOLD", "SOLD", "TOLD", "SCOLD", "UPHOLD",
  "MILD", "WILD", "BUILD", "GUILD", "CHILD",
  "FORM", "DORM", "NORM", "STORM", "PERFORM",
  "ARM", "FARM", "HARM", "CHARM", "ALARM", "WARM",
  "BORN", "CORN", "HORN", "MORN", "PORN", "TORN", "WORN", "SCORN", "SWORN",
  "TURN", "BURN", "EARN", "LEARN", "RETURN", "CONCERN", "DISCERN",
  "JUMP", "BUMP", "DUMP", "HUMP", "LUMP", "PUMP", "SLUMP", "STUMP", "THUMP", "TRUMP",
  "BAND", "HAND", "LAND", "SAND", "STRAND", "BRAND", "STRAND", "COMMAND",
  "PAST", "FAST", "LAST", "MAST", "VAST", "CAST", "BLAST", "COAST", "BOAST", "ROAST", "TOAST",
  "TEST", "BEST", "FEST", "JEST", "NEST", "PEST", "REST", "VEST", "WEST", "ZEST", "GUEST", "QUEST",
  "OLD", "BOLD", "COLD", "FOLD", "GOLD", "HOLD", "MOLD", "SOLD", "TOLD",
  "SYSTEM", "RHYTHM", "SOUTHERN", "EASTERN", "WESTERN", "NORTHERN", "SPECIAL",
  "MODERN", "MOMENT", "CONTENT", "EXTENT", "INTENT", "PRESENT", "ABSENT", "ACCENT",
  "SILVER", "RIVER", "NEVER", "EVER", "CLEVER", "LEVER", "BEAVER", "FEVER", "SEVERE",
  "MATTER", "RATHER", "WEATHER", "FEATHER", "LEATHER", "GATHER", "FATHER", "LATHER", "BATHER",
  "SUMMER", "HAMMER", "STAMMER", "GLAMOUR", "FLAVOR", "FAVOUR", "HONOUR", "RUMOUR",
  "ANCHOR", "FINGER", "ANGER", "DANGER", "RANGER", "HUNGER", "WONDER", "THUNDER", "PLUNDER",
  "LISTEN", "GLISTEN", "FASTEN", "HASTEN", "SOFTEN", "BROKEN", "FROZEN", "CHOSEN", "STOLEN",
  "PERSON", "REASON", "SEASON", "PRISON", "POISON", "TOXIN", "COUSIN", "DOZEN", "POLLEN",
  "SIGNAL", "ANIMAL", "ANNUAL", "MANUAL", "CASUAL", "VISUAL", "USUAL", "ACTUAL", "MUTUAL",
  "LISTEN", "GLISTEN", "CHRISTEN", "MISTAKEN", "TAKEN", "WAKEN", "FORSAKEN", "AWAKEN",
  "BROKEN", "SPOKEN", "WOKEN", "TOKEN", "SUNKEN", "DRUNKEN", "SHRUNKEN", "SWOLLEN",
  "GOLDEN", "MOLDEN", "HOLDEN", "EMBOLDEN",
  "NATURE", "FUTURE", "CULTURE", "PICTURE", "TEXTURE", "MIXTURE", "FIXTURE", "CAPTURE", "TORTURE",
  "DANGER", "ANGER", "RANGER", "MANGER", "HANGER", "SLANGER", "STRANGER", "GINGER", "FINGER",
  "FINGER", "LINGER", "SINGER", "RINGER", "WINGER", "BRINGER", "SLINGER", "STINGER", "SWINGER",
  "CENTER", "ENTER", "WINTER", "PINTER", "SPLINTER", "GLITTER", "BITTER", "FITTER", "HITTER",
  "BITTER", "LITTER", "GLITTER", "CRITTER", "TWITTER", "QUITTER", "SITTER", "FITTER", "KNITTER",
  "ANSWER", "DANGER", "RANGER", "STRANGER", "MESSENGER", "PASSENGER", "MANAGER", "TEENAGER",
  "MEMBER", "REMEMBER", "DECEMBER", "SEPTEMBER", "NOVEMBER", "SLUMBER", "UMBER", "LUMBER",
  "WONDER", "UNDER", "THUNDER", "BLUNDER", "PLUNDER", "FOUNDER", "BOUNDER", "POUNDER",
  "NORTH", "SOUTH", "MOUTH", "YOUTH", "TRUTH", "FOURTH", "GROWTH", "WORTH", "FORTH",
  "FIRST", "BURST", "WORST", "THIRST", "STIR", "BLUR", "SLUR", "SPUR", "OCCUR", "SURE",
  "PURE", "CURE", "LURE", "ALLURE", "OBSCURE", "SECURE", "ENDURE", "MATURE", "PROCEDURE",
  "COUNT", "MOUNT", "AMOUNT", "DISCOUNT", "ACCOUNT", "RECOUNT", "DISMOUNT", "PARAMOUNT",
  "PURPOSE", "COMPASS", "CLASS", "GLASS", "GRASS", "BRASS", "MASS", "PASS", "FAST", "LAST", "VAST",
  "PRESENT", "ABSENT", "ACCENT", "ASCENT", "CONSENT", "CONTENT", "DESCENT", "EXTENT", "INDENT",
  "QUEST", "REQUEST", "SUGGEST", "INVEST", "CONTEST", "PROTEST", "MANIFEST", "INTEREST", "FOREST",
  "ACROSS", "EMBOSS", "GLOSS", "TOSS", "BOSS", "LOSS", "MOSS", "CROSS", "GROSS",
  "DIPOLE", "YAGI", "AMP", "UHF", "VHF", "HF", "MF", "LF", "TECH", "GENERAL", "EXTRA",
  "TUNER", "COAX", "FEEDLINE", "IMPEDANCE", "RESISTANCE", "GROUND", "EARTH", "BEAM",
  "VERTICAL", "HORIZONTAL", "PILEUP", "PROPAGATION", "IONOSPHERE", "SKIP", "DX", "DISTANCE",
  "FREQUENCY", "BAND", "HERTZ", "OSCILLATOR", "CRYSTAL", "RELAY", "TRANSFORMER", "CAPACITOR",
  "RESISTOR", "INDUCTOR", "DIODE", "TRANSISTOR", "AMPLIFIER", "RECEIVER", "TRANSMITTER",
  "REPEATER", "SIMPLEX", "DUPLEX", "SSBTONECONTEST", "OPERATING", "PORTABLE", "MOBILE", "FIXED",
  "STROBE", "STROBE", "NOVICE", "TECHNICIAN", "ADVANCED", "EXPERT", "NETWORKS", "SIMPLEX", "LINEAR",
  "AUDIO", "MICROPHONE", "HEADPHONES", "SPEAKER", "METER", "SCOPE", "ANALYZER", "FIELD", "EMERGENCY",
  "SAFETY", "EXERCISE", "DRILL", "PAGER", "MOBILE", "REPEATER", "HOTSPOT", "INTERNET", "GATEWAY"
];

export const NUMBERS = [
  "ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
  "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY",
  "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY", "HUNDRED", "THOUSAND",
  "MILLION", "PLUS", "MINUS", "EQUALS", "TIMES", "DIVIDED", "POINT", "PERCENT", "RATIO",
  "ZERO ZERO", "ONE ONE", "TWO TWO", "THREE THREE", "FOUR FOUR", "FIVE FIVE",
  "SIX SIX", "SEVEN SEVEN", "EIGHT EIGHT", "NINE NINE", "ONE TWO THREE", "FOUR FIVE SIX",
  "SEVEN EIGHT NINE", "TEN TWENTY THIRTY", "FORTY FIFTY SIXTY", "SEVENTY EIGHTY NINETY",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
  "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
  "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
  "60", "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
  "80", "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "90", "91", "92", "93", "94", "95", "96", "97", "98", "99",
  "100", "200", "300", "400", "500", "600", "700", "800", "900", "1000",
  "123", "456", "789", "999", "5NN", "599"
];

export const BAND_NAMES = [
  "EIGHTY METERS", "FORTY METERS", "TWENTY METERS", "SEVENTEEN METERS", "FIFTEEN METERS", "TWELVE METERS", "TEN METERS",
  "TWENTY KILOHERTZ", "THIRTY KILOHERTZ", "THIRTY KILOHERTZ", "ONE HUNDRED KILOHERTZ",
  "EIGHTY METERS", "SIXTY METERS", "FORTY METERS", "THIRTY METERS", "TWENTY METERS",
  "ONE SIXTY METERS", "SIX METERS", "TWO METERS", "SEVENTY CENTIMETERS", "THIRTY THREE CENTIMETERS"
];

export const FREQUENCIES = [
  "POINT ONE", "POINT TWO", "POINT THREE", "POINT FIVE", "POINT SEVEN", "POINT EIGHT", "POINT NINE",
  "THREE FIFTY", "THREE SIXTY", "THREE SEVENTY", "THREE EIGHTY", "THREE NINETY",
  "SEVEN ZERO ZERO", "SEVEN FIFTY", "SEVEN ONE HUNDRED", "SEVEN TWO HUNDRED", "SEVEN THREE HUNDRED",
  "FOURTEEN ZERO ZERO", "FOURTEEN ONE HUNDRED", "FOURTEEN TWO HUNDRED", "FOURTEEN THREE HUNDRED",
  "TWENTY ONE ZERO ZERO", "TWENTY ONE FIVE HUNDRED", "TWENTY TWO HUNDRED", "TWENTY FIVE HUNDRED",
  "TWENTY EIGHT ZERO ZERO", "TWENTY NINE HUNDRED", "TWENTY NINE FIVE HUNDRED"
];

export const CALLSIGNS = [
  // US callsigns
  "K1ABC", "W1AW", "N1XYZ", "K2MGA", "W2XYZ", "N2ABC", "K3LR", "W3LPL", "N3QE",
  "K4BAI", "W4ZV", "N4PN", "K5ZD", "W5WMU", "N5RZ", "K6LL", "W6YX", "N6RO",
  "K7RL", "W7RM", "N7DD", "K8IA", "W8JI", "N8BJQ", "K9CT", "W9RE", "N9RV",
  "K0RF", "W0AIH", "N0AX", "AA1K", "AB2E", "AC3RF", "AD4J", "AE5E", "AF6O",
  "AG7T", "AH8DX", "AI9K", "AJ0M", "KA1DJZ", "KB2FMH", "KC3PI", "KD4QMY",
  "KE5PF", "KF6GX", "KG7H", "KH6BB", "KI9A", "KJ0I", "WA4DSL", "WB5BHS",
  "WC6H", "WD8E", "WE9V", "WF0E", "NA6O", "NB7Q", "NC8N", "ND9G", "NE1B",
  // Canadian callsigns
  "VE3AT", "VA3XFC", "VE7CC", "VA7ST", "VE9AA", "VE2IM", "VA2EW",
  // UK callsigns
  "G3WZT", "G4AMT", "M0MCX", "M5ZAP", "G0MTN", "2E0XXX", "2E1ABC",
  // European callsigns
  "DL1ABC", "DJ9ZB", "F6ABC", "I2WIJ", "EA3NY", "PA3FYM", "ON4UN", "SP7IDX",
  "SM5EPO", "OH2BH", "LY2NK", "YU7EF", "HA5PT", "OK1RR", "S53MM", "9A3A",
  // Japanese callsigns
  "JA1YPA", "JH1OBS", "JR2BNF", "JE3EDL", "JF4CAD", "JI5RPT",
  // Australian/NZ callsigns
  "VK2IA", "VK3ZL", "ZL1BYZ", "ZL2IFB", "VK6DXI",
  // South American callsigns
  "PY2XB", "LU4AA", "CX2DK", "CE3CT", "ZP5JGL",
  // African/Asian callsigns
  "ZS6DN", "5Z4NU", "A61AJ", "BY1PK", "HS0ZEE", "YB0AZ"
];

/**
 * @typedef {import('./accuracy-tracker.js').AccuracyTracker} AccuracyTracker
 */

export class ContentGenerator {
  /**
   * @param {AccuracyTracker} [accuracyTracker=null] - Character accuracy tracker for weak character detection
   * @param {number} [difficultyPreference=3] - User difficulty preference (1-5)
   * @param {string} [userCallsign=''] - User's personal callsign for frequent appearance
   */
  constructor(accuracyTracker = null, difficultyPreference = 3, userCallsign = '') {
    this.accuracyTracker = accuracyTracker || new AccuracyTracker();
    this.difficultyCalculator = new DifficultyCalculator(this.accuracyTracker, difficultyPreference);
    this.userCallsign = userCallsign.toUpperCase().trim();
  }

  /**
   * Generate random item from array
   * @param {Array} items - Array of items
   * @returns {*} Random item
   * @private
   */
  static #pickRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Generate random character from array
   * @param {Array} characters - Array of characters
   * @returns {string} Random character
   * @private
   */
  static #pickRandomCharacter(characters) {
    return characters[Math.floor(Math.random() * characters.length)];
  }

  /**
   * Pick character with weak character emphasis
   * Weak characters are 3x more likely to be selected
   * @param {string[]} characters - Available characters
   * @param {string[]} weakCharacters - Weak characters to emphasize
   * @returns {string} Selected character
   * @private
   */
  static #pickWeightedCharacter(characters, weakCharacters) {
    if (weakCharacters.length === 0) {
      return ContentGenerator.#pickRandomCharacter(characters);
    }

    // Create weighted pool: weak chars appear 3x
    const weightedPool = [];
    characters.forEach(char => {
      const weight = weakCharacters.includes(char) ? 3 : 1;
      for (let i = 0; i < weight; i++) {
        weightedPool.push(char);
      }
    });

    return ContentGenerator.#pickRandomCharacter(weightedPool);
  }

  /**
   * Generate random character group
   * @param {string[]} characters - Available characters
   * @param {number} length - Length of group
   * @returns {string} Generated group
   * @private
   */
  static #generateRandomCharacterGroup(characters, length) {
    let group = '';
    for (let i = 0; i < length; i++) {
      group += ContentGenerator.#pickRandomCharacter(characters);
    }
    return group;
  }

  /**
   * Generate character group with weak character emphasis
   * @param {string[]} characters - Available characters
   * @param {number} length - Length of group
   * @param {string[]} weakCharacters - Weak characters to emphasize
   * @returns {string} Generated group with weak char emphasis
   * @private
   */
  #generateWeightedCharacterGroup(characters, length, weakCharacters) {
    let group = '';
    for (let i = 0; i < length; i++) {
      group += ContentGenerator.#pickWeightedCharacter(characters, weakCharacters);
    }
    return group;
  }

  /**
   * Generate synthetic challenge (random character groups)
   * @param {string[]} unlockedCharacters - Available characters
   * @param {Object} config - Configuration with numGroups and groupLength
   * @returns {string} Generated synthetic challenge
   * @private
   */
  static #generateSyntheticChallenge(unlockedCharacters, config = {}) {
    const numGroupsRange = config.numGroupsRange || CONTENT_GENERATION.SYNTHETIC_GROUPS;
    const groupLengthRange = config.groupLengthRange || CONTENT_GENERATION.SYNTHETIC_GROUP_LENGTH;
    
    const numGroups = Math.floor(
      Math.random() * (numGroupsRange.max - numGroupsRange.min + 1)
    ) + numGroupsRange.min;
    
    const groups = [];
    for (let g = 0; g < numGroups; g++) {
      const len = Math.floor(
        Math.random() * (groupLengthRange.max - groupLengthRange.min + 1)
      ) + groupLengthRange.min;
      groups.push(ContentGenerator.#generateRandomCharacterGroup(unlockedCharacters, len));
    }
    
    return groups.join(' ');
  }

  /**
   * Generate synthetic challenge with weak character emphasis
   * @param {string[]} unlockedCharacters - Available characters
   * @param {string[]} weakCharacters - Weak characters to emphasize
   * @param {Object} config - Configuration with numGroups and groupLength
   * @returns {string} Generated synthetic challenge
   * @private
   */
  #generateWeightedSyntheticChallenge(unlockedCharacters, weakCharacters, config = {}) {
    const numGroupsRange = config.numGroupsRange || CONTENT_GENERATION.SYNTHETIC_GROUPS;
    const groupLengthRange = config.groupLengthRange || CONTENT_GENERATION.SYNTHETIC_GROUP_LENGTH;
    
    const numGroups = Math.floor(
      Math.random() * (numGroupsRange.max - numGroupsRange.min + 1)
    ) + numGroupsRange.min;
    
    const groups = [];
    for (let g = 0; g < numGroups; g++) {
      const len = Math.floor(
        Math.random() * (groupLengthRange.max - groupLengthRange.min + 1)
      ) + groupLengthRange.min;
      groups.push(this.#generateWeightedCharacterGroup(unlockedCharacters, len, weakCharacters));
    }
    
    return groups.join(' ');
  }

  /**
   * Clean text to only valid morse characters
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   * @private
   */
  static #cleanMorseText(text) {
    return text
      .toUpperCase()
      .split('')
      .filter(char => MORSE_LIB[char] || char === ' ')
      .join('')
      .trim();
  }

  /**
   * Filter a list of items to only include those that use unlocked characters
   * @param {Array} items - Items to filter (strings or objects with 'code' property)
   * @param {Set} unlockedCharSet - Set of unlocked characters
   * @returns {Array} Filtered items
   * @private
   */
  static #filterByUnlockedChars(items, unlockedCharSet) {
    return items.filter(item => {
      const text = item.code || item;
      return text.split('').every(char => unlockedCharSet.has(char) || char === ' ');
    });
  }

  /**
   * Update accuracy tracker
   * @param {AccuracyTracker} newAccuracyTracker - New accuracy tracker instance
   * @public
   */
  updateAccuracyData(newAccuracyTracker) {
    this.accuracyTracker = newAccuracyTracker;
    this.difficultyCalculator.updateAccuracyTracker(newAccuracyTracker);
  }

  /**
   * Update difficulty preference
   * @param {number} difficultyPreference - New difficulty preference (1-5)
   * @public
   */
  updateDifficultyPreference(difficultyPreference) {
    this.difficultyCalculator.applyDifficultyPreset(difficultyPreference);
  }

  /**
   * Update user callsign
   * @param {string} userCallsign - New user callsign
   * @public
   */
  updateUserCallsign(userCallsign) {
    this.userCallsign = userCallsign.toUpperCase().trim();
  }

  /**
   * Get set of currently unlocked characters based on level
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Set<string>} Set of available characters
   * @public
   */
  getUnlockedSet(lessonLevel, manualChars = []) {
    const levelChars = KOCH_SEQUENCE.slice(0, lessonLevel);
    return new Set([...levelChars, ...manualChars]);
  }

  /**
   * Filter training content pools to only include unlocked characters
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} Object with filtered words, abbreviations, Q-codes, phrases, numbers, bands, frequencies, and callsigns
   * @public
   */
  getFilteredPool(lessonLevel, manualChars = []) {
    const unlockedCharSet = this.getUnlockedSet(lessonLevel, manualChars);
    
    const filterByUnlocked = (items) => {
      return items.filter(item => {
        const text = item.code || item;
        return text.split('').every(char => unlockedCharSet.has(char) || char === ' ');
      });
    };

    // Build callsign pool with user callsign heavily weighted
    let availableCallsigns = filterByUnlocked(CALLSIGNS);
    
    // If user has a callsign and it's valid for current level, add it multiple times for higher frequency
    if (this.userCallsign && this.userCallsign.split('').every(char => unlockedCharSet.has(char))) {
      // Add user callsign 10 times to make it appear very frequently
      for (let i = 0; i < 10; i++) {
        availableCallsigns.unshift(this.userCallsign);
      }
    }

    return {
      words: filterByUnlocked(DICTIONARY),
      abbrs: filterByUnlocked(COMMON_ABBR),
      qcodes: filterByUnlocked(Q_CODES),
      phrases: filterByUnlocked(PHRASES),
      numbers: filterByUnlocked(NUMBERS),
      bands: filterByUnlocked(BAND_NAMES),
      frequencies: filterByUnlocked(FREQUENCIES),
      callsigns: availableCallsigns
    };
  }

  /**
   * Generate next training challenge (either real word or synthetic)
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string}
   * @public
   */
  generateChallenge(lessonLevel, manualChars = []) {
    const unlockedCharSet = this.getUnlockedSet(lessonLevel, manualChars);
    const unlockedCharArray = Array.from(unlockedCharSet);
    const contentPool = this.getFilteredPool(lessonLevel, manualChars);

    const hasContent = (contentPool.words.length + contentPool.abbrs.length +
      contentPool.qcodes.length + contentPool.phrases.length + contentPool.numbers.length +
      contentPool.bands.length + contentPool.frequencies.length + contentPool.callsigns.length) > 0;
    const useRealContent = hasContent && Math.random() < CONTENT_GENERATION.REAL_CONTENT_PROBABILITY;

    let challenge = '';
    let meaning = '';

    if (useRealContent) {
      const availableContentTypes = [];
      if (contentPool.words.length) availableContentTypes.push('words');
      if (contentPool.abbrs.length) availableContentTypes.push('abbrs');
      if (contentPool.qcodes.length) availableContentTypes.push('qcodes');
      if (contentPool.phrases.length) availableContentTypes.push('phrases');
      if (contentPool.numbers.length) availableContentTypes.push('numbers');
      if (contentPool.bands.length) availableContentTypes.push('bands');
      if (contentPool.frequencies.length) availableContentTypes.push('frequencies');
      // Add callsigns with very high weight (appears 5x more often than other content types)
      if (contentPool.callsigns.length) {
        for (let i = 0; i < 5; i++) {
          availableContentTypes.push('callsigns');
        }
      }

      const contentType = ContentGenerator.#pickRandomItem(availableContentTypes);
      const selectedItem = ContentGenerator.#pickRandomItem(contentPool[contentType]);

      challenge = typeof selectedItem === 'string' ? selectedItem : selectedItem.code;
      meaning = typeof selectedItem === 'string' ? '' : selectedItem.meaning;
    } else {
      // Generate synthetic challenge with weak character emphasis
      const weakChars = this.accuracyTracker.getWeakCharacters();
      challenge = this.#generateWeightedSyntheticChallenge(unlockedCharArray, weakChars);
    }

    return { challenge, meaning };
  }

  /**
   * Generate offline broadcast simulation
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string}
   * @public
   */
  generateOfflineBroadcast(lessonLevel, manualChars = []) {
    const contentPool = this.getFilteredPool(lessonLevel, manualChars);
    const broadcastParts = [];

    // Callsigns are very common in broadcasts - add one or two
    if (contentPool.callsigns.length) {
      broadcastParts.push(ContentGenerator.#pickRandomItem(contentPool.callsigns));
      // 70% chance of a second callsign
      if (Math.random() > 0.3 && contentPool.callsigns.length > 1) {
        broadcastParts.push(ContentGenerator.#pickRandomItem(contentPool.callsigns));
      }
    }

    if (Math.random() > 0.5 && contentPool.abbrs.length) {
      const selectedAbbr = ContentGenerator.#pickRandomItem(contentPool.abbrs);
      broadcastParts.push(selectedAbbr.code);
    }
    if (contentPool.words.length) {
      broadcastParts.push(ContentGenerator.#pickRandomItem(contentPool.words));
    }
    if (Math.random() > 0.5 && contentPool.qcodes.length) {
      const selectedQCode = ContentGenerator.#pickRandomItem(contentPool.qcodes);
      broadcastParts.push(selectedQCode.code);
    }

    const unlockedSet = this.getUnlockedSet(lessonLevel, manualChars);
    const validParts = broadcastParts.filter(part =>
      part.split('').every(char => unlockedSet.has(char))
    );

    if (validParts.length > 0) {
      return {
        challenge: validParts.join(' '),
        meaning: 'Simulated Broadcast'
      };
    } else {
      // Fall back to synthetic
      const synthChallenge = this.generateChallenge(lessonLevel, manualChars);
      return {
        challenge: synthChallenge.challenge,
        meaning: 'Weak Signal (Synthetic)'
      };
    }
  }

  /**
   * Generate offline coach drill simulation
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string, hasWeakChars: boolean}
   * @public
   */
  generateOfflineCoach(lessonLevel, manualChars = []) {
    const weakCharacters = this.accuracyTracker.getWeakCharacters();
    const unlockedChars = Array.from(this.getUnlockedSet(lessonLevel, manualChars));

    const groups = [];
    for (let i = 0; i < CONTENT_GENERATION.COACH_DRILL_GROUPS; i++) {
      groups.push(this.#generateWeightedCharacterGroup(
        unlockedChars,
        CONTENT_GENERATION.COACH_DRILL_GROUP_LENGTH,
        weakCharacters
      ));
    }

    return {
      challenge: groups.join(' '),
      meaning: 'Smart Coach (Offline)',
      hasWeakChars: weakCharacters.length > 0
    };
  }

  /**
   * Generate AI broadcast prompt and validate response
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {prompt: string}
   * @public
   */
  getAIBroadcastPrompt(lessonLevel, manualChars = []) {
    const unlockedCharacters = Array.from(this.getUnlockedSet(lessonLevel, manualChars)).join(', ');
    return {
      prompt: AI_PROMPTS.BROADCAST(unlockedCharacters)
    };
  }

  /**
   * Generate AI coach prompt
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {prompt: string, hasWeakChars: boolean}
   * @public
   */
  getAICoachPrompt(lessonLevel, manualChars = []) {
    const weakCharacters = this.accuracyTracker.getWeakCharacters();
    const focusCharacters = weakCharacters.length > 0 ? weakCharacters : Array.from(this.getUnlockedSet(lessonLevel, manualChars));
    const allUnlockedCharacters = Array.from(this.getUnlockedSet(lessonLevel, manualChars)).join(', ');

    return {
      prompt: AI_PROMPTS.COACH(focusCharacters.join(', '), allUnlockedCharacters),
      hasWeakChars: weakCharacters.length > 0
    };
  }

  /**
   * Validate AI response matches unlocked characters
   * @param {string} aiResponse - Response text from AI
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {valid: boolean, cleaned?: string}
   * @public
   */
  validateAIResponse(aiResponse, lessonLevel, manualChars = []) {
    const cleanedText = ContentGenerator.#cleanMorseText(aiResponse);
    const unlockedSet = this.getUnlockedSet(lessonLevel, manualChars);
    const isValidText = cleanedText.split('').every(char => char === ' ' || unlockedSet.has(char));

    if (isValidText && cleanedText.trim()) {
      return { valid: true, cleaned: cleanedText.trim() };
    }
    return { valid: false };
  }

  /**
   * Generate a batch of broadcast challenges (for AI batch generation)
   * @param {number} batchSize - Number of challenges to generate
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object[]} Array of {challenge: string, meaning: string}
   * @public
   */
  generateBroadcastBatch(batchSize, lessonLevel, manualChars = []) {
    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      batch.push(this.generateChallenge(lessonLevel, manualChars));
    }
    return batch;
  }

  /**
   * Generate a batch of smart coach challenges targeting weak characters
   * @param {number} batchSize - Number of challenges to generate
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {batch: Array, hasWeakChars: boolean}
   * @public
   */
  generateCoachBatch(batchSize, lessonLevel, manualChars = []) {
    const weakCharacters = this.accuracyTracker.getWeakCharacters();
    const hasWeakChars = weakCharacters.length > 0;
    const unlockedChars = Array.from(this.getUnlockedSet(lessonLevel, manualChars));

    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      // Use weighted generation if we have weak characters
      const groups = [];
      for (let j = 0; j < CONTENT_GENERATION.COACH_DRILL_GROUPS; j++) {
        groups.push(this.#generateWeightedCharacterGroup(
          unlockedChars,
          CONTENT_GENERATION.COACH_DRILL_GROUP_LENGTH,
          weakCharacters
        ));
      }

      batch.push({
        challenge: groups.join(' '),
        meaning: 'Smart Coach Drill'
      });
    }

    return { batch, hasWeakChars };
  }

  /**
   * Generate challenge with target difficulty level (1-10)
   * Adapts length, character complexity, and content type to match difficulty
   * @param {number} targetDifficulty - Difficulty level 1-10
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string, difficulty: number}
   * @public
   */
  generateChallengeForDifficulty(targetDifficulty, lessonLevel, manualChars = []) {
    const unlockedCharSet = this.getUnlockedSet(lessonLevel, manualChars);
    const unlockedCharArray = Array.from(unlockedCharSet);
    const contentPool = this.getFilteredPool(lessonLevel, manualChars);
    const weakChars = this.accuracyTracker.getWeakCharacters();

    // Clamp difficulty to valid range
    const difficulty = Math.max(DIFFICULTY.DIFFICULTY_SCALE_MIN, 
                                Math.min(DIFFICULTY.DIFFICULTY_SCALE_MAX, targetDifficulty));

    let challenge = '';
    let meaning = '';

    // Easy (1-3): Single characters, pairs, or very simple short words
    if (difficulty <= 3) {
      if (contentPool.words.length > 0 && Math.random() < 0.3) {
        const shortWords = contentPool.words.filter(w => w.length <= 3);
        if (shortWords.length > 0) {
          challenge = ContentGenerator.#pickRandomItem(shortWords);
          meaning = '';
        }
      }
      if (!challenge) {
        // Simple synthetic: 1-2 chars per group, 1 group (weighted)
        const len = Math.floor(Math.random() * 2) + 1;
        challenge = this.#generateWeightedCharacterGroup(unlockedCharArray, len, weakChars);
      }
    }
    // Medium-Easy (4-5): Short words, abbreviations, 2-3 character groups
    else if (difficulty <= 5) {
      if (contentPool.words.length > 0 && Math.random() < 0.5) {
        const words = contentPool.words.filter(w => w.length <= 5);
        if (words.length > 0) {
          challenge = ContentGenerator.#pickRandomItem(words);
          meaning = '';
        }
      }
      if (!challenge) {
        if (contentPool.abbrs.length > 0 && Math.random() < 0.5) {
          const abbr = ContentGenerator.#pickRandomItem(contentPool.abbrs);
          challenge = abbr.code;
          meaning = abbr.meaning;
        }
      }
      if (!challenge) {
        // Moderate synthetic: 2-3 groups, 2-3 chars each (weighted)
        const numGroups = Math.floor(Math.random() * 2) + 2;
        const groups = [];
        for (let i = 0; i < numGroups; i++) {
          const len = Math.floor(Math.random() * 2) + 2;
          groups.push(this.#generateWeightedCharacterGroup(unlockedCharArray, len, weakChars));
        }
        challenge = groups.join(' ');
      }
    }
    // Medium-Hard (6-7): Longer words, phrases, multiple groups
    else if (difficulty <= 7) {
      if (contentPool.phrases.length > 0 && Math.random() < 0.4) {
        challenge = ContentGenerator.#pickRandomItem(contentPool.phrases);
        meaning = '';
      } else if (contentPool.words.length > 0 && Math.random() < 0.4) {
        const words = contentPool.words;
        challenge = words.slice(0, Math.min(3, words.length))
          .map(() => ContentGenerator.#pickRandomItem(words))
          .join(' ');
        meaning = '';
      } else if (contentPool.qcodes.length > 0 && Math.random() < 0.3) {
        const qcode = ContentGenerator.#pickRandomItem(contentPool.qcodes);
        challenge = qcode.code;
        meaning = qcode.meaning;
      }
      if (!challenge) {
        // Medium-hard synthetic: 3-4 groups, 3-4 chars each (weighted)
        const numGroups = Math.floor(Math.random() * 2) + 3;
        const groups = [];
        for (let i = 0; i < numGroups; i++) {
          const len = Math.floor(Math.random() * 2) + 3;
          groups.push(this.#generateWeightedCharacterGroup(unlockedCharArray, len, weakChars));
        }
        challenge = groups.join(' ');
      }
    }
    // Hard (8-10): Complex phrases, longer sequences, weak character focus
    else {
      if (contentPool.phrases.length > 0 && Math.random() < 0.5) {
        challenge = ContentGenerator.#pickRandomItem(contentPool.phrases);
        meaning = '';
      } else if (contentPool.numbers.length > 0 && Math.random() < 0.3) {
        challenge = ContentGenerator.#pickRandomItem(contentPool.numbers);
        meaning = '';
      }
      if (!challenge) {
        // Complex synthetic: 3-4 groups, 3-5 chars each (weighted to emphasize weak chars)
        const numGroups = Math.floor(Math.random() * 2) + 3;
        const groups = [];
        for (let i = 0; i < numGroups; i++) {
          const len = Math.floor(Math.random() * 3) + 3;
          groups.push(this.#generateWeightedCharacterGroup(unlockedCharArray, len, weakChars));
        }
        challenge = groups.join(' ');
      }
    }

    // Calculate actual difficulty of generated challenge
    const actualDifficulty = this.difficultyCalculator.calculateChallengeDifficulty(
      challenge,
      unlockedCharSet
    );

    return { challenge, meaning, difficulty: actualDifficulty };
  }

  /**
   * Generate a batch of challenges scaled by difficulty progression
   * Useful for leveled practice sessions
   * @param {number} batchSize - Number of challenges to generate
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @param {number} [startingDifficulty=3] - Starting difficulty for batch
   * @returns {Object[]} Array of {challenge, meaning, difficulty}
   * @public
   */
  generateProgressiveBatch(batchSize, lessonLevel, manualChars = [], startingDifficulty = 3) {
    const batch = [];
    let currentDifficulty = startingDifficulty;

    for (let i = 0; i < batchSize; i++) {
      const challenge = this.generateChallengeForDifficulty(
        currentDifficulty,
        lessonLevel,
        manualChars
      );
      batch.push(challenge);

      // Adjust difficulty for next challenge based on current performance
      const accuracy = this.accuracyTracker.getOverallAccuracy();
      if (accuracy >= 80) {
        currentDifficulty = Math.min(10, currentDifficulty + 0.5);
      } else if (accuracy < 60) {
        currentDifficulty = Math.max(1, currentDifficulty - 0.5);
      }
    }

    return batch;
  }

  /**
   * Generate challenges specifically for a newly unlocked character
   * Starts very easy (character in isolation) and gradually increases complexity
   * @param {string} newChar - The newly unlocked character
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @returns {Object} {challenge: string, meaning: string, difficulty: number, focusChar: string}
   * @public
   */
  generateNewCharacterChallenge(newChar, lessonLevel, manualChars = []) {
    const unlockedCharSet = this.getUnlockedSet(lessonLevel, manualChars);
    const allCharsArray = Array.from(unlockedCharSet);
    const weakChars = this.accuracyTracker.getWeakCharacters();

    // Pick progressive difficulty based on attempts with new char
    const newCharData = this.accuracyTracker.data[newChar];
    const attempts = newCharData ? newCharData.total : 0;
    let challenge = '';

    // 0-2 attempts: Isolated character
    if (attempts < 2) {
      challenge = newChar;
    }
    // 3-5 attempts: Character in pairs/triples
    else if (attempts < 5) {
      const len = Math.floor(Math.random() * 2) + 2;
      challenge = ContentGenerator.#generateRandomCharacterGroup([newChar], len);
    }
    // 6-10 attempts: Mixed with other recent characters (weighted)
    else if (attempts < 10) {
      const recentChars = [newChar, ...allCharsArray.slice(-3)];
      const groups = [];
      for (let i = 0; i < 2; i++) {
        const len = Math.floor(Math.random() * 2) + 2;
        groups.push(this.#generateWeightedCharacterGroup(recentChars, len, weakChars));
      }
      challenge = groups.join(' ');
    }
    // 11+ attempts: Full integration with other characters (weighted)
    else {
      const numGroups = Math.floor(Math.random() * 2) + 2;
      const groups = [];
      for (let i = 0; i < numGroups; i++) {
        const len = Math.floor(Math.random() * 2) + 2;
        groups.push(this.#generateWeightedCharacterGroup(allCharsArray, len, weakChars));
      }
      challenge = groups.join(' ');
    }

    const difficulty = this.difficultyCalculator.calculateChallengeDifficulty(
      challenge,
      unlockedCharSet,
      0 // Mark as new character (0 lessons since unlock)
    );

    return {
      challenge,
      meaning: `Focus on "${newChar}"`,
      difficulty,
      focusChar: newChar
    };
  }

  /**
   * Calculate and return difficulty metrics for the current state
   * Useful for UI display and adaptive decisions
   * @param {number} lessonLevel - Current lesson level
   * @param {string[]} manualChars - Manually unlocked characters
   * @param {number} targetDifficulty - Target difficulty level
   * @returns {Object} {currentLevel, recommended, weak, strong, characterDifficulty}
   * @public
   */
  getDifficultyMetrics(lessonLevel, manualChars = [], targetDifficulty = 5) {
    const unlockedChars = Array.from(this.getUnlockedSet(lessonLevel, manualChars));
    const categorized = this.difficultyCalculator.categorizeCharacters(unlockedChars);
    const recommended = this.difficultyCalculator.getRecommendedDifficulty(targetDifficulty);
    const overall = this.accuracyTracker.getOverallAccuracy();

    return {
      currentLevel: targetDifficulty,
      recommended: Math.round(recommended * 10) / 10,
      weak: categorized.weak,
      strong: categorized.strong,
      moderate: categorized.moderate,
      overallAccuracy: overall,
      unlockedCount: unlockedChars.length
    };
  }
}

