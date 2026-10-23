/** Public editorial previews only. Never use this catalogue as submission authorization. */
export const categories = ['Creative', 'Social', 'Guild'] as const;
export type BountyCategory = typeof categories[number];
export interface BountyPreview {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: BountyCategory;
  difficulty: 'Initiate' | 'Seasoned' | 'Ambitious';
  status: 'preview';
  requirements: readonly string[];
  futureEvidence: readonly string[];
}
export const categoryNotes: Record<BountyCategory, string> = {
  Creative: 'Memes, illustrations and community artwork. Give the legend a new face.',
  Social: 'Original posts and storytelling. Carry a good story beyond the campfire.',
  Guild: 'Community contributions and future collaborative challenges. Build something together.',
};
export const bounties: readonly BountyPreview[] = [
  {
    id: 'RH-C01', slug: 'a-fox-walks-into-a-castle', title: 'A Fox Walks into a Castle', category: 'Creative', difficulty: 'Initiate', status: 'preview',
    description: 'Imagine an original RobinHoot meme: one broke outlaw, one grand castle, and a punchline worth passing around.',
    requirements: ['Create an original meme with a clear RobinHoot story or theme.', 'Use artwork you own or have permission to adapt; credit collaborators.', 'Keep the joke welcoming. No harassment, impersonation or misleading financial claims.'],
    futureEvidence: ['An image file or accessible link to the finished meme.', 'A short caption and source credits for any adapted material.'],
  },
  {
    id: 'RH-C02', slug: 'portraits-from-the-trenches', title: 'Portraits from the Trenches', category: 'Creative', difficulty: 'Ambitious', status: 'preview',
    description: 'Sketch a scene from outlaw life: patched cloaks, muddy trails and a little defiance in the eyes.',
    requirements: ['Make an original illustration or community artwork inspired by the guild.', 'Describe the scene and your creative process.', 'List collaborators and any licensed source material; do not claim official character status.'],
    futureEvidence: ['A finished image and, if appropriate, a process sketch.', 'Artist attribution, source credits and permission information.'],
  },
  {
    id: 'RH-S01', slug: 'a-letter-from-the-outlands', title: 'A Letter from the Outlands', category: 'Social', difficulty: 'Initiate', status: 'preview',
    description: 'Write an original community post introducing the world of RobinHoot in your own voice. A story, not a sales pitch.',
    requirements: ['Explain one part of the RobinHoot story accurately and originally.', 'Distinguish live prototypes from planned functionality.', 'Avoid spam, engagement farming and promises of token returns. Posting is not required while this is a preview.'],
    futureEvidence: ['The original text or a public post link if submissions become available.', 'Brief context about the intended audience; engagement counts would not prove quality.'],
  },
  {
    id: 'RH-S02', slug: 'tales-by-emerald-fire', title: 'Tales by Emerald Fire', category: 'Social', difficulty: 'Seasoned', status: 'preview',
    description: 'Tell a short tale about your outlaw’s first night beyond the castle walls. Let personality lead the adventure.',
    requirements: ['Write an original short story with a beginning, turning point and ending.', 'Use your character as inspiration without sharing private wallet or personal information.', 'Credit co-authors and clearly distinguish fiction from project announcements.'],
    futureEvidence: ['A readable story document, text or public link.', 'A short author note and co-author credits where relevant.'],
  },
  {
    id: 'RH-G01', slug: 'chart-the-hidden-paths', title: 'Chart the Hidden Paths', category: 'Guild', difficulty: 'Seasoned', status: 'preview',
    description: 'Help imagine a better guild experience with a thoughtful accessibility or usability field report.',
    requirements: ['Describe a reproducible usability or accessibility issue.', 'Explain the expected experience and suggest a practical improvement.', 'Remove account details and sensitive data from screenshots; do not submit security secrets.'],
    futureEvidence: ['Browser/device context and reproduction steps.', 'Optional redacted screenshots and an explanation of the proposed improvement.'],
  },
  {
    id: 'RH-G02', slug: 'the-guilds-next-chapter', title: 'The Guild’s Next Chapter', category: 'Guild', difficulty: 'Ambitious', status: 'preview',
    description: 'Outline a future collaborative community challenge with room for writers, artists and practical problem-solvers.',
    requirements: ['Define a clear collaborative goal and useful community outcome.', 'Describe roles, accessibility considerations and how contributions could be reviewed fairly.', 'Do not promise funding, tokens, selection or a launch date.'],
    futureEvidence: ['A concise challenge proposal and suggested milestones.', 'A contribution/review plan with attribution and consent considerations.'],
  },
];
export function bountyBySlug(slug: string) { return bounties.find(bounty => bounty.slug === slug); }
