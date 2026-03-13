import { MiniGameQuestion, TemplateSection } from '@/types/domain';

export interface ThemePreset {
  id: string;
  name: string;
  palette: { primary: string; accent: string; surface: string };
  banner: string;
  icon: string;
  sections: Omit<TemplateSection, 'id'>[];
  game: MiniGameQuestion[];
}

export const themePresets: ThemePreset[] = [
  {
    id: 'candy-crash',
    name: 'Candy Crash',
    palette: { primary: '#EC4899', accent: '#F59E0B', surface: '#831843' },
    banner: 'Sweet retro combos & sticky insights',
    icon: '🍬',
    sections: [
      { type: 'mood', title: 'Choose Your Candy Mood', subtitle: 'Pick your energy flavor' },
      { type: 'positive', title: 'Sweet Combos', subtitle: 'What worked amazingly?' },
      { type: 'negative', title: 'Sugar Blocks', subtitle: 'What slowed us down?' },
      { type: 'mini-game', title: 'Mystery Candy Drops', subtitle: 'Answer to earn bonus votes' },
      { type: 'action-selection', title: 'Next Level Up', subtitle: 'Convert top ideas into actions' }
    ],
    game: [
      { id: 'q1', themeId: 'candy-crash', prompt: 'Which candy color appears most in a standard rainbow?', choices: ['Blue', 'Red', 'Green', 'Yellow'], correctChoice: 2 }
    ]
  },
  {
    id: 'millions',
    name: 'Who Wants to Win Millions',
    palette: { primary: '#2563EB', accent: '#EAB308', surface: '#1E1B4B' },
    banner: 'The high-stakes retro quiz room',
    icon: '💰',
    sections: [
      { type: 'mood', title: 'Question à 1 000 €', subtitle: 'How confident are you?' },
      { type: 'positive', title: 'Qu’avons-nous vraiment gagné ?', subtitle: 'Our best outcomes' },
      { type: 'mini-game', title: 'Qui veut gagner des votes ?', subtitle: 'Quiz for vote bonuses' },
      { type: 'voting', title: 'La question à 1 million', subtitle: 'Where to invest effort?' },
      { type: 'action-selection', title: 'On avance ?', subtitle: 'Pick practical next steps' }
    ],
    game: [
      { id: 'q2', themeId: 'millions', prompt: 'What does MVP stand for?', choices: ['Most Valuable Plan', 'Minimum Viable Product', 'Major Value Point', 'Managed Version Process'], correctChoice: 1 }
    ]
  },
  {
    id: 'the-voice',
    name: 'The Voice',
    palette: { primary: '#14B8A6', accent: '#8B5CF6', surface: '#042F2E' },
    banner: 'Tune your team cadence and harmony',
    icon: '🎤',
    sections: [
      { type: 'mood', title: 'Blind Audition', subtitle: 'How did the sprint feel?' },
      { type: 'positive', title: 'The Good Notes', subtitle: 'What sounded great?' },
      { type: 'negative', title: 'The False Notes', subtitle: 'Where did we miss rhythm?' },
      { type: 'mini-game', title: 'Mystery Performance', subtitle: 'Quick challenge for bonus votes' },
      { type: 'action-selection', title: 'Final Round', subtitle: 'Lock in improvements' }
    ],
    game: [
      { id: 'q3', themeId: 'the-voice', prompt: 'Which metric best reflects delivery flow?', choices: ['Cycle time', 'CPU usage', 'Story color', 'Repository stars'], correctChoice: 0 }
    ]
  }
];

export const getTheme = (id: string) => themePresets.find((theme) => theme.id === id) ?? themePresets[0];
