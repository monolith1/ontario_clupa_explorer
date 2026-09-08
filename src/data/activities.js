// Curated activities mapped to official CLUPA permitted use types

export const ACTIVITY_CATEGORIES = [
  { id: 'recreation', name: 'Recreation & Outdoor' },
  { id: 'hunting_fishing', name: 'Hunting & Fishing' },
  { id: 'motorized', name: 'Motorized & Trails' },
  { id: 'resource', name: 'Resource & Exploration' },
  { id: 'management', name: 'Camps & Land Management' },
];

export const ACTIVITIES = [
  {
    id: 'camping',
    name: 'Crown Land Camping',
    shortName: 'Camping',
    category: 'recreation',
    icon: 'Tent',
    apiTypes: ['Crown Land Recreation', 'Campgrounds'],
    description: 'Dispersed backcountry camping on public Crown land. Free for Canadian residents up to 21 days per calendar year per site.',
    tip: 'Canadian residents can camp up to 21 days; non-residents generally need a camping permit or must camp outside restricted zones.'
  },
  {
    id: 'hunting',
    name: 'Hunting (Game & Furbearers)',
    shortName: 'Hunting',
    category: 'hunting_fishing',
    icon: 'Crosshair',
    apiTypes: ['Hunting', 'Bear Hunting by Non-residents (guided), Existing', 'Bear Hunting by Non-residents (guided), New'],
    description: 'Hunting big game (deer, moose, bear) and small game according to Ontario hunting regulations and WMU seasons.',
    tip: 'Ensure you possess an Outdoors Card and appropriate WMU tag. Observe firearm discharge bylaws near roads.'
  },
  {
    id: 'fishing',
    name: 'Sport Fishing',
    shortName: 'Fishing',
    category: 'hunting_fishing',
    icon: 'Fish',
    apiTypes: ['Sport Fishing'],
    description: 'Recreational angling across inland lakes, rivers, and streams.',
    tip: 'Subject to Ontario Recreational Fishing Regulations and Zone limits/sanctuaries.'
  },
  {
    id: 'atv_trails',
    name: 'ATV / Off-Road (On Trails)',
    shortName: 'ATV Trails',
    category: 'motorized',
    icon: 'Compass',
    apiTypes: ['All Terrain Vehicle Use, On Trails'],
    description: 'Operating off-road vehicles, quads, and side-by-sides on existing forest access roads and recognized trails.',
    tip: 'Helmet, registration, and insurance required on Crown roads/trails. Respect trail permit requirements (e.g. OFATV).'
  },
  {
    id: 'atv_off_trails',
    name: 'ATV / Off-Road (Off Trails)',
    shortName: 'ATV Off-Trail',
    category: 'motorized',
    icon: 'Navigation',
    apiTypes: ['All Terrain Vehicle Use, Off Trails'],
    description: 'Travel over un-trailed Crown forest or rugged terrain. Often prohibited in sensitive conservation areas to prevent soil erosion.',
    tip: 'Usually prohibited or conditional to protect wetlands and fish habitats.'
  },
  {
    id: 'snowmobiling',
    name: 'Snowmobiling',
    shortName: 'Snowmobile',
    category: 'motorized',
    icon: 'Snowflake',
    apiTypes: ['Snowmobiling, On Trails', 'Snowmobiling, Off Trails'],
    description: 'Winter snow vehicle recreation on trails and unplowed forest roads.',
    tip: 'OFSC permit required when riding on groomed Ontario Federation of Snowmobile Clubs trails.'
  },
  {
    id: 'hiking',
    name: 'Hiking & Non-Motorized Travel',
    shortName: 'Hiking',
    category: 'recreation',
    icon: 'Footprints',
    apiTypes: ['Non-motorized Recreation Travel', 'Mountain Bike Use'],
    description: 'Backcountry trekking, canoe tripping, portaging, and mountain biking.',
    tip: 'Leave No Trace ethics apply. Pack out all garbage.'
  },
  {
    id: 'boating',
    name: 'Boating & Watercraft',
    shortName: 'Boating',
    category: 'recreation',
    icon: 'Anchor',
    apiTypes: ['Motor Boat Use, Private', 'Aircraft Landing'],
    description: 'Operation of motorized boats, canoes, kayaks, and floatplane access.',
    tip: 'Some remote enhanced management areas restrict motorboat horsepower or aircraft cache.'
  },
  {
    id: 'foraging',
    name: 'Food Gathering & Foraging',
    shortName: 'Foraging',
    category: 'recreation',
    icon: 'Apple',
    apiTypes: ['Food Gathering'],
    description: 'Personal harvest of wild berries, mushrooms, and edible wild plants.',
    tip: 'For personal consumption only. Commercial harvesting requires permits.'
  },
  {
    id: 'mining',
    name: 'Mineral Exploration & Prospecting',
    shortName: 'Prospecting',
    category: 'resource',
    icon: 'Pickaxe',
    apiTypes: ['Mineral Exploration and Development'],
    description: 'Claim staking, prospecting, and mineral testing under the Mining Act.',
    tip: 'General Use Areas usually permit mineral exploration; Provincial Parks and Conservation Reserves are typically withdrawn.'
  },
  {
    id: 'timber',
    name: 'Commercial Timber Harvest',
    shortName: 'Timber Harvest',
    category: 'resource',
    icon: 'Trees',
    apiTypes: ['Commercial Timber Harvest'],
    description: 'Commercial forestry operations managed through Sustainable Forest Licenses (SFL).',
    tip: 'Check if you want to avoid active logging areas or find recently managed cut-overs for hunting.'
  },
  {
    id: 'recreation_camp',
    name: 'Hunt Camps & Private Rec Camps',
    shortName: 'Hunt Camps',
    category: 'management',
    icon: 'Home',
    apiTypes: ['Private Recreation Camp, Existing', 'Private Recreation Camp, New'],
    description: 'Authorized hunt camps, cabins, and seasonal recreation camp structures on Crown land.',
    tip: 'New camp permits are rare and strictly controlled by the Ministry.'
  }
];

// Land Designations in CLUPA
export const LAND_DESIGNATIONS = [
  {
    code: 'G',
    name: 'General Use Area',
    color: '#10b981', // Emerald green
    description: 'The vast majority of Crown land. Managed for a wide range of public recreational and resource uses with minimal restrictions.',
    badgeClass: 'badge-general'
  },
  {
    code: 'E',
    name: 'Enhanced Management Area',
    color: '#3b82f6', // Blue
    description: 'Special land areas with specific directional policies to protect recreation, remote access, natural heritage, or fish/wildlife.',
    badgeClass: 'badge-enhanced'
  },
  {
    code: 'C',
    name: 'Conservation Reserve',
    color: '#f59e0b', // Amber
    description: 'Protects representative ecosystems, old growth forests, and landscapes. Camping and hunting are often allowed, but no commercial logging/mining.',
    badgeClass: 'badge-conservation'
  },
  {
    code: 'P',
    name: 'Provincial Park',
    color: '#ef4444', // Red/Coral
    description: 'Designated Ontario Provincial Parks. Regulated under the Provincial Parks and Conservation Reserves Act. Fees and permits apply.',
    badgeClass: 'badge-park'
  },
  {
    code: 'F',
    name: 'Forest Reserve',
    color: '#8b5cf6', // Violet
    description: 'Areas proposed for park or reserve status that currently have preexisting mining claims or tenure.',
    badgeClass: 'badge-forest'
  }
];
