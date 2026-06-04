// data.jsx — listings + saved searches for Scout

// striped placeholder photo (returns a data-uri'd inline SVG background)
function photoBg(seed, label) {
  const tones = [
    ['#E7E0D3', '#D8CFBD'], ['#DEE6DE', '#CBD8CC'], ['#E9DED2', '#DAC9B7'],
    ['#DDE3E6', '#C9D3D7'], ['#E6E1D6', '#D5CDBC'],
  ];
  const [a, b] = tones[seed % tones.length];
  return { a, b, label };
}

const LISTINGS = [
  {
    id: 'l1', status: 'sale', price: 685000, address: '142 Larkspur Lane',
    hood: 'Sellwood', city: 'Portland, OR', beds: 3, baths: 2, sqft: 1840,
    type: 'House', lot: '0.14 ac', year: 1924, isNew: true, postedAgo: '2h',
    match: 96, fresh: true,
    tags: ['Garden', 'Renovated kitchen', 'Walkable'],
    blurb: 'Light-filled craftsman with a reworked kitchen, original fir floors, and a fenced back garden two blocks from the river path.',
    monthly: 4180, hoa: 0, days: 0,
    photos: [photoBg(0, 'street view'), photoBg(2, 'kitchen'), photoBg(1, 'garden')],
  },
  {
    id: 'l2', status: 'sale', price: 729000, address: '88 Maple Court',
    hood: 'Mount Tabor', city: 'Portland, OR', beds: 4, baths: 2.5, sqft: 2210,
    type: 'House', lot: '0.18 ac', year: 1968, isNew: true, postedAgo: '5h',
    match: 91, fresh: true,
    tags: ['Big yard', 'Garage', 'Quiet street'],
    blurb: 'Mid-century split-level backing onto the park, with a two-car garage and a deep, tree-lined yard.',
    monthly: 4460, hoa: 0, days: 0,
    photos: [photoBg(1, 'front exterior'), photoBg(3, 'living room'), photoBg(4, 'backyard')],
  },
  {
    id: 'l3', status: 'rent', price: 2650, address: '410 Belmont St · #3B',
    hood: 'Buckman', city: 'Portland, OR', beds: 2, baths: 1, sqft: 940,
    type: 'Apartment', lot: null, year: 2019, isNew: true, postedAgo: '1h',
    match: 94, fresh: true,
    tags: ['In-unit laundry', 'Pet friendly', 'Balcony'],
    blurb: 'Corner two-bed in a small modern building, with in-unit laundry, a private balcony, and bike storage downstairs.',
    monthly: 2650, hoa: 0, days: 0,
    photos: [photoBg(3, 'building'), photoBg(0, 'interior'), photoBg(2, 'balcony')],
  },
  {
    id: 'l4', status: 'rent', price: 1975, address: '23 Clinton Row',
    hood: 'Division', city: 'Portland, OR', beds: 1, baths: 1, sqft: 680,
    type: 'Apartment', lot: null, year: 2021, isNew: false, postedAgo: '1d',
    match: 88, fresh: false,
    tags: ['Pet friendly', 'Rooftop', 'Transit'],
    blurb: 'Bright one-bedroom steps from the Division corridor, with a shared rooftop deck and a walk score of 94.',
    monthly: 1975, hoa: 0, days: 1,
    photos: [photoBg(4, 'exterior'), photoBg(1, 'bedroom'), photoBg(3, 'rooftop')],
  },
  {
    id: 'l5', status: 'sale', price: 615000, address: '7 Alder Way',
    hood: 'Woodstock', city: 'Portland, OR', beds: 3, baths: 1.5, sqft: 1560,
    type: 'House', lot: '0.11 ac', year: 1941, isNew: false, postedAgo: '2d',
    match: 85, fresh: false,
    tags: ['Garden', 'Fireplace', 'Updated bath'],
    blurb: 'Tidy cottage with a wood-burning fireplace, raised garden beds, and a detached studio that works as an office.',
    monthly: 3760, hoa: 0, days: 2,
    photos: [photoBg(2, 'street view'), photoBg(0, 'living room'), photoBg(4, 'studio')],
  },
  {
    id: 'l6', status: 'sale', price: 542000, address: '301 Powell Loop',
    hood: 'Brooklyn', city: 'Portland, OR', beds: 2, baths: 2, sqft: 1320,
    type: 'Townhome', lot: null, year: 2016, isNew: false, postedAgo: '3d',
    match: 80, fresh: false,
    tags: ['Low maintenance', 'Garage', 'New build'],
    blurb: 'Efficient newer townhome with an attached garage, rooftop terrace, and almost nothing left to fix.',
    monthly: 3320, hoa: 180, days: 3,
    photos: [photoBg(1, 'exterior'), photoBg(3, 'kitchen'), photoBg(2, 'terrace')],
  },
];

// quick-pick chips for the structured / guided builder
const QUICK = {
  features: ['Garden', 'Garage', 'In-unit laundry', 'Pet friendly', 'Fireplace', 'Balcony', 'New build', 'Walkable'],
  types: ['House', 'Townhome', 'Apartment', 'Condo'],
};

const PROMPT_EXAMPLES = [
  '3-bed house under $700k with a garden in a walkable neighborhood',
  'Pet-friendly 2-bed rental near transit, in-unit laundry, under $2,800',
  'Move-in ready place close to a park, quiet street, garage',
];

const SAVED_SEARCHES = [
  {
    id: 's1', name: 'Family house · East side', mode: 'Buy',
    summary: '3+ bed houses · under $720k · Sellwood, Mt Tabor, Woodstock · garden',
    chips: ['Buy', '3+ bed', '≤ $720k', 'House', 'Garden'],
    freq: 'daily', active: true, newCount: 3, lastSent: 'Today, 8:00 AM',
    matchIds: ['l1', 'l2', 'l5'],
  },
  {
    id: 's2', name: 'Walkable 2-bed rental', mode: 'Rent',
    summary: '2-bed apartments · ≤ $2,800/mo · Buckman, Division · pet friendly',
    chips: ['Rent', '2 bed', '≤ $2,800', 'Pet friendly'],
    freq: 'daily', active: true, newCount: 1, lastSent: 'Today, 8:00 AM',
    matchIds: ['l3', 'l4'],
  },
  {
    id: 's3', name: 'Low-maintenance starter', mode: 'Buy',
    summary: 'Townhomes & condos · under $560k · garage · new-ish build',
    chips: ['Buy', '≤ $560k', 'Townhome', 'Garage'],
    freq: 'weekly', active: false, newCount: 0, lastSent: 'Mon, 8:00 AM',
    matchIds: ['l6'],
  },
];

const money = (n) => '$' + n.toLocaleString('en-US');

window.SCOUT_DATA = { LISTINGS, QUICK, PROMPT_EXAMPLES, SAVED_SEARCHES, money, photoBg };
