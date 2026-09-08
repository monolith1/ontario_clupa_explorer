// Ontario Ministry of Natural Resources (MNR) Districts & Regions
// Coordinates and approximate bounding boxes [west, south, east, north]

export const MNR_REGIONS = [
  { id: 'all', name: 'All Ontario Regions' },
  { id: 'Southern', name: 'Southern Region' },
  { id: 'Northeast', name: 'Northeast Region' },
  { id: 'Northwest', name: 'Northwest Region' },
];

export const MNR_DISTRICTS = [
  // Southern
  {
    id: 'parry_sound',
    name: 'Parry Sound',
    region: 'Southern',
    center: [45.35, -80.03],
    zoom: 9,
    bbox: [-80.7, 44.9, -79.2, 46.1],
    description: 'Georgian Bay archipelago, rugged Canadian Shield, Muskoka fringe.'
  },
  {
    id: 'bancroft',
    name: 'Bancroft',
    region: 'Southern',
    center: [45.06, -77.86],
    zoom: 9,
    bbox: [-78.5, 44.6, -77.0, 45.6],
    description: 'Mineral capital of Canada, Hastings Highlands, heavily mixed Crown parcels.'
  },
  {
    id: 'pembroke',
    name: 'Pembroke',
    region: 'Southern',
    center: [45.82, -77.11],
    zoom: 9,
    bbox: [-78.0, 45.3, -76.5, 46.3],
    description: 'Ottawa Valley, Upper Ottawa River, eastern Algonquin threshold.'
  },
  {
    id: 'peterborough',
    name: 'Peterborough',
    region: 'Southern',
    center: [44.50, -78.15],
    zoom: 9,
    bbox: [-78.8, 44.2, -77.6, 44.9],
    description: 'Kawartha Lakes transition to southern Canadian Shield.'
  },
  {
    id: 'midhurst',
    name: 'Midhurst (Simcoe / Dufferin)',
    region: 'Southern',
    center: [44.45, -79.73],
    zoom: 9,
    bbox: [-80.4, 43.9, -79.2, 45.0],
    description: 'Simcoe County, Georgian Bay south shore, Nottawasaga basin.'
  },
  {
    id: 'algonquin_park',
    name: 'Algonquin Park',
    region: 'Southern',
    center: [45.75, -78.40],
    zoom: 9,
    bbox: [-79.2, 45.2, -77.5, 46.3],
    description: 'Provincial Park heartland and surrounding provincial buffer areas.'
  },

  // Northeast
  {
    id: 'north_bay',
    name: 'North Bay',
    region: 'Northeast',
    center: [46.31, -79.46],
    zoom: 9,
    bbox: [-80.4, 45.8, -78.6, 47.1],
    description: 'Lake Nipissing, Mattawa river system, French River corridor.'
  },
  {
    id: 'sudbury',
    name: 'Sudbury',
    region: 'Northeast',
    center: [46.49, -81.01],
    zoom: 9,
    bbox: [-82.2, 45.9, -80.0, 47.5],
    description: 'Vast Crown lands, mining reserves, Espanola and Wanapitei systems.'
  },
  {
    id: 'sault_ste_marie',
    name: 'Sault Ste. Marie',
    region: 'Northeast',
    center: [46.52, -84.34],
    zoom: 9,
    bbox: [-85.2, 46.1, -83.2, 47.5],
    description: 'Algoma Country, North Channel Lake Huron, Goulais river basin.'
  },
  {
    id: 'timmins',
    name: 'Timmins',
    region: 'Northeast',
    center: [48.47, -81.33],
    zoom: 8,
    bbox: [-82.5, 47.5, -80.0, 49.2],
    description: 'Abitibi greenstone belt, boreal forest, rich mining & hunting zones.'
  },
  {
    id: 'kirkland_lake',
    name: 'Kirkland Lake',
    region: 'Northeast',
    center: [48.15, -80.03],
    zoom: 9,
    bbox: [-81.0, 47.3, -79.5, 48.8],
    description: 'Timiskaming frontier, Englehart, Larder Lake systems.'
  },
  {
    id: 'chapleau',
    name: 'Chapleau',
    region: 'Northeast',
    center: [47.84, -83.41],
    zoom: 8,
    bbox: [-84.4, 47.0, -82.4, 48.5],
    description: 'Home to the world’s largest Crown Game Preserve and remote backcountry.'
  },
  {
    id: 'wawa',
    name: 'Wawa',
    region: 'Northeast',
    center: [47.99, -84.77],
    zoom: 8,
    bbox: [-85.8, 47.2, -83.8, 48.8],
    description: 'Lake Superior Highlands, Michipicoten, rugged coastal terrain.'
  },
  {
    id: 'cochrane',
    name: 'Cochrane',
    region: 'Northeast',
    center: [49.06, -81.02],
    zoom: 8,
    bbox: [-82.5, 48.5, -79.5, 51.5],
    description: 'Clay Belt transition to Hudson Bay lowlands, polar bear express route.'
  },
  {
    id: 'hearst',
    name: 'Hearst',
    region: 'Northeast',
    center: [49.69, -83.67],
    zoom: 8,
    bbox: [-85.5, 48.8, -82.5, 51.5],
    description: 'Northern boreal forests, immense remote Crown land tracts.'
  },

  // Northwest
  {
    id: 'thunder_bay',
    name: 'Thunder Bay',
    region: 'Northwest',
    center: [48.38, -89.25],
    zoom: 8,
    bbox: [-90.5, 47.8, -87.8, 49.5],
    description: 'Sleeping Giant, Nor’Wester mountains, Lake Superior north shore.'
  },
  {
    id: 'nipigon',
    name: 'Nipigon',
    region: 'Northwest',
    center: [49.01, -88.26],
    zoom: 8,
    bbox: [-89.5, 48.5, -86.5, 50.5],
    description: 'Lake Nipigon watershed, world-class brook trout waters and wilderness.'
  },
  {
    id: 'kenora',
    name: 'Kenora',
    region: 'Northwest',
    center: [49.77, -94.48],
    zoom: 8,
    bbox: [-95.2, 49.2, -93.2, 51.0],
    description: 'Lake of the Woods, thousands of islands, Sunset Country.'
  },
  {
    id: 'dryden',
    name: 'Dryden',
    region: 'Northwest',
    center: [49.78, -92.84],
    zoom: 8,
    bbox: [-94.0, 49.0, -91.5, 51.0],
    description: 'Wabigoon Lake chain, Patricia region waterways and backcountry.'
  },
  {
    id: 'fort_frances',
    name: 'Fort Frances',
    region: 'Northwest',
    center: [48.61, -93.40],
    zoom: 8,
    bbox: [-94.5, 48.4, -91.8, 49.5],
    description: 'Rainy Lake, border waters, Quetico gateway.'
  },
  {
    id: 'red_lake',
    name: 'Red Lake',
    region: 'Northwest',
    center: [51.02, -93.84],
    zoom: 8,
    bbox: [-95.2, 50.5, -92.5, 52.5],
    description: 'Deep northern boreal, Woodland Caribou Provincial Park edge.'
  },
  {
    id: 'sioux_lookout',
    name: 'Sioux Lookout',
    region: 'Northwest',
    center: [50.10, -91.92],
    zoom: 8,
    bbox: [-93.5, 49.5, -90.5, 52.0],
    description: 'Hub of the North, Lac Seul, expansive remote river networks.'
  }
];

export const POPULAR_TOWNS = [
  { name: 'Parry Sound', coords: [45.3475, -80.0353], districtId: 'parry_sound' },
  { name: 'Huntsville / Muskoka', coords: [45.3269, -79.2168], districtId: 'parry_sound' },
  { name: 'Gravenhurst', coords: [44.9192, -79.3752], districtId: 'parry_sound' },
  { name: 'Bancroft', coords: [45.0560, -77.8548], districtId: 'bancroft' },
  { name: 'Pembroke', coords: [45.8267, -77.1114], districtId: 'pembroke' },
  { name: 'North Bay', coords: [46.3091, -79.4608], districtId: 'north_bay' },
  { name: 'Greater Sudbury', coords: [46.4917, -80.9930], districtId: 'sudbury' },
  { name: 'Sault Ste. Marie', coords: [46.5219, -84.3461], districtId: 'sault_ste_marie' },
  { name: 'Timmins', coords: [48.4758, -81.3304], districtId: 'timmins' },
  { name: 'Thunder Bay', coords: [48.3809, -89.2477], districtId: 'thunder_bay' },
  { name: 'Kenora', coords: [49.7668, -94.4842], districtId: 'kenora' },
  { name: 'Wawa', coords: [47.9944, -84.7739], districtId: 'wawa' },
];
