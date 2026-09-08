export const PRESETS = [
  {
    id: 'free_camping',
    title: 'Crown Land Dispersed Camping',
    icon: '⛺',
    subtitle: 'Public land with open backcountry camping',
    filters: {
      designations: ['General Use Area', 'Enhanced Management Area'],
      activities: [
        { id: 'camping', status: 'Yes' }
      ],
      keyword: ''
    }
  },
  {
    id: 'hunting_haven',
    title: 'Hunting & Angling Expeditions',
    icon: '🎯',
    subtitle: 'Areas where hunting and sport fishing are permitted',
    filters: {
      designations: ['General Use Area', 'Enhanced Management Area', 'Conservation Reserve'],
      activities: [
        { id: 'hunting', status: 'Yes' },
        { id: 'fishing', status: 'Yes' }
      ],
      keyword: ''
    }
  },
  {
    id: 'atv_overland',
    title: 'ATV & Motorized Trail Access',
    icon: '🛞',
    subtitle: 'Backcountry roads & motorized trail exploration',
    filters: {
      designations: ['General Use Area', 'Enhanced Management Area'],
      activities: [
        { id: 'atv_trails', status: 'Yes' }
      ],
      keyword: ''
    }
  },
  {
    id: 'quiet_nature',
    title: 'Quiet Wilderness & Conservation',
    icon: '🌿',
    subtitle: 'Conservation reserves and low-impact natural zones',
    filters: {
      designations: ['Conservation Reserve', 'Enhanced Management Area'],
      activities: [
        { id: 'hiking', status: 'Yes' }
      ],
      keyword: ''
    }
  },
  {
    id: 'prospecting',
    title: 'Prospecting & Mineral Exploration',
    icon: '⛏️',
    subtitle: 'Crown lands open for mineral exploration & staking',
    filters: {
      designations: ['General Use Area'],
      activities: [
        { id: 'mining', status: 'Yes' }
      ],
      keyword: ''
    }
  }
];
