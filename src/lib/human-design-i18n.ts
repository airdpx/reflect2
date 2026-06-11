import type { HumanDesignTransit, HumanDesignTransitGate, Language } from "../types";
import { normalizeLanguage } from "./i18n";

type GateMeaning = {
  name: string;
  theme: string;
};

const gateMeanings: Record<string, GateMeaning> = {
  "1": { name: "Creative Self-Expression", theme: "individual style, direction and authentic expression" },
  "2": { name: "Receptivity", theme: "orientation, receiving guidance and letting direction emerge" },
  "3": { name: "Ordering", theme: "beginnings, adaptation and turning disorder into a pattern" },
  "4": { name: "Formulation", theme: "answers, mental structure and the pressure to make sense" },
  "5": { name: "Fixed Rhythms", theme: "natural timing, routine and steady daily rhythm" },
  "6": { name: "Friction", theme: "boundaries, emotional clarity and careful contact" },
  "7": { name: "The Role of the Self", theme: "leadership, direction and guidance through example" },
  "8": { name: "Contribution", theme: "sharing your style and making a visible contribution" },
  "9": { name: "Focus", theme: "attention to detail, concentration and small steady steps" },
  "10": { name: "Behavior of the Self", theme: "self-respect, embodied behavior and personal integrity" },
  "11": { name: "Ideas", theme: "images, concepts and reflective inspiration" },
  "12": { name: "Caution", theme: "expression, mood and knowing when to speak" },
  "13": { name: "The Listener", theme: "memory, stories and listening to experience" },
  "14": { name: "Power Skills", theme: "resources, direction and using energy where it matters" },
  "15": { name: "Extremes", theme: "wide rhythms, humanity and acceptance of variation" },
  "16": { name: "Skills", theme: "practice, enthusiasm and repeated refinement" },
  "17": { name: "Opinions", theme: "patterns, opinions and testing a point of view" },
  "18": { name: "Correction", theme: "improvement, discernment and healthy refinement" },
  "19": { name: "Sensitivity", theme: "needs, sensitivity and attention to belonging" },
  "20": { name: "The Now", theme: "presence, immediacy and expression in the moment" },
  "21": { name: "Control", theme: "resources, boundaries and practical management" },
  "22": { name: "Grace", theme: "emotional openness, charm and timing of expression" },
  "23": { name: "Assimilation", theme: "simplifying insight and putting knowing into words" },
  "24": { name: "Rationalizing", theme: "returning thoughts, inner review and mental digestion" },
  "25": { name: "Innocence", theme: "openness, sincerity and keeping the heart clean" },
  "26": { name: "The Egoist", theme: "persuasion, memory and responsible use of will" },
  "27": { name: "Caring", theme: "nourishment, responsibility and sustainable care" },
  "28": { name: "The Game Player", theme: "purpose, struggle and choosing meaningful challenges" },
  "29": { name: "Perseverance", theme: "commitment, saying yes and learning through experience" },
  "30": { name: "Desire", theme: "emotional intensity, longing and clarity through feeling" },
  "31": { name: "Influence", theme: "democratic leadership and voice-based guidance" },
  "32": { name: "Continuity", theme: "instinct for what can last and fear of failure" },
  "33": { name: "Privacy", theme: "retreat, memory and knowing when to share" },
  "34": { name: "Power", theme: "pure life force, response and embodied capacity" },
  "35": { name: "Change", theme: "experience, progress and the hunger for something new" },
  "36": { name: "Crisis", theme: "emotional learning, unfamiliar experience and compassion" },
  "37": { name: "Friendship", theme: "community, agreements and warmth in close bonds" },
  "38": { name: "The Fighter", theme: "meaningful opposition and the courage to stand for purpose" },
  "39": { name: "Provocation", theme: "emotional pressure, testing spirit and awakening feeling" },
  "40": { name: "Aloneness", theme: "willpower, rest and balancing work with recovery" },
  "41": { name: "Contraction", theme: "imagination, beginnings and the pressure of desire" },
  "42": { name: "Growth", theme: "completion, maturation and finishing what began" },
  "43": { name: "Insight", theme: "individual knowing, breakthroughs and inner clarity" },
  "44": { name: "Alertness", theme: "pattern recognition, memory and instinctive awareness" },
  "45": { name: "Gathering Together", theme: "resources, leadership and stewardship of the group" },
  "46": { name: "The Body", theme: "embodiment, serendipity and being in the right place" },
  "47": { name: "Realization", theme: "pressure to understand and turning confusion into insight" },
  "48": { name: "Depth", theme: "resourcefulness, skill depth and fear of inadequacy" },
  "49": { name: "Principles", theme: "values, sensitivity and renegotiating agreements" },
  "50": { name: "Values", theme: "responsibility, ethics and caring for what is entrusted" },
  "51": { name: "Shock", theme: "awakening, courage and sudden movement into life" },
  "52": { name: "Stillness", theme: "restraint, focus and the power to stay still" },
  "53": { name: "Beginnings", theme: "starting cycles, development and long-range growth" },
  "54": { name: "Ambition", theme: "drive, transformation and practical aspiration" },
  "55": { name: "Spirit", theme: "mood, abundance and trusting emotional waves" },
  "56": { name: "Stimulation", theme: "storytelling, meaning and sharing lived experience" },
  "57": { name: "Intuitive Clarity", theme: "instinct, subtle awareness and present-moment knowing" },
  "58": { name: "Vitality", theme: "joy, improvement and the energy to refine life" },
  "59": { name: "Intimacy", theme: "closeness, openness and dissolving barriers" },
  "60": { name: "Limitation", theme: "constraints, mutation and working with real boundaries" },
  "61": { name: "Inner Truth", theme: "mystery, inspiration and pressure to know" },
  "62": { name: "Details", theme: "precision, naming and practical organization of facts" },
  "63": { name: "Doubt", theme: "questioning, testing patterns and careful verification" },
  "64": { name: "Confusion", theme: "many images, mental pressure and waiting for clarity" }
};

export function localizeHumanDesignTransit(transit: HumanDesignTransit, language: Language): HumanDesignTransit {
  const lang = normalizeLanguage(language);
  if (lang === "ru") return transit;
  const gates = transit.gates.map(localizeGate);
  const hasEnglishParagraphs = transit.paragraphs.some((paragraph) => /[A-Za-z]/.test(paragraph) && !/[А-Яа-яЁё]/.test(paragraph));
  const hasEnglishTraits = (transit.helped || []).concat(transit.blocked || []).some((item) => /[A-Za-z]/.test(item) && !/[А-Яа-яЁё]/.test(item));
  return {
    ...transit,
    title: /[А-Яа-яЁё]/.test(transit.title) ? "Human Design Transit" : transit.title,
    gates,
    paragraphs: hasEnglishParagraphs ? transit.paragraphs : buildEnglishTransitParagraphs(gates, transit.periodStart, transit.periodEnd),
    helped: hasEnglishTraits ? transit.helped : [],
    blocked: hasEnglishTraits ? transit.blocked : []
  };
}

function localizeGate(gate: HumanDesignTransitGate): HumanDesignTransitGate {
  const meaning = gateMeanings[gate.number];
  if (!meaning) return gate;
  return {
    ...gate,
    name: meaning.name
  };
}

function buildEnglishTransitParagraphs(gates: HumanDesignTransitGate[], periodStart: string, periodEnd: string) {
  const [sunGate, earthGate] = gates;
  const sunMeaning = sunGate ? gateMeanings[sunGate.number] : null;
  const earthMeaning = earthGate ? gateMeanings[earthGate.number] : null;
  const range = periodStart && periodEnd ? `from ${periodStart} to ${periodEnd}` : "for the selected period";
  const intro = sunGate && earthGate
    ? `This Human Design transit ${range} connects Gate ${sunGate.number}, ${sunGate.name}, with Gate ${earthGate.number}, ${earthGate.name}.`
    : `This Human Design transit ${range} is shown from the local transit database.`;
  const themes = [sunMeaning, earthMeaning]
    .filter((meaning): meaning is GateMeaning => Boolean(meaning))
    .map((meaning) => meaning.theme);
  const focus = themes.length
    ? `The main themes are ${themes.join("; ")}.`
    : "Use it as a soft context layer for observing rhythm, attention and daily choices.";
  return [
    `${intro} ${focus}`,
    "Treat this as a reflection prompt rather than a strict forecast: notice what feels active today, compare it with your habits and diary, and keep the pace practical."
  ];
}
