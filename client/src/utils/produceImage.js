
const POOLS = {
  vegetables: [
    'photo-1592924357228-91a4daadcfea', // tomato
    'photo-1568584711271-946d0e54ada1', // cauliflower
    'photo-1515686925575-a8f8b53b1eda', // kale
    'photo-1584270354949-c26b0d5b4a0c', // broccoli
    'photo-1447175008436-054170c2e979', // carrots
    'photo-1583687355032-89b902b7335f', // zucchini
    'photo-1570586437263-ab629fccc818', // pumpkin
    'photo-1604977042946-1eecc30f269e', // cucumber
    'photo-1563565375-f3fdfdbefa83', // capsicum
    'photo-1576045057995-568f588f82fb', // spinach
    'photo-1631203587046-0738c5d6f76c', // leeks
    'photo-1615477550927-6ec8445fcfe3', // garlic
    'photo-1601593768799-76e3aaeebb47', // sweet corn
    'photo-1438118907704-7718ee9a191a', // brussels sprouts
    'photo-1596097635121-14b38c85d2c4', // sweet potato
  ],
  fruits: [
    'photo-1605027990121-cbae9e0642db', // mango
    'photo-1568702846914-96b305d2aaeb', // apple
    'photo-1611080626919-7cf5a9dbab5b', // orange
    'photo-1582979512210-99b6a53386f9', // mandarin
    'photo-1582287014914-1db836872ff5', // lemon
    'photo-1464965911861-746a04b4bca6', // strawberry
    'photo-1498557850523-fd3d118b962e', // blueberry
    'photo-1577069861033-55d04cec4ef5', // raspberry
    'photo-1523049673857-eb18f1d7b578', // avocado
    'photo-1571771894821-ce9b6c11b08e', // banana
    'photo-1514756331096-242fdeb70d4a', // pear
    'photo-1601379760883-1bb497a14e4f', // fig
    'photo-1587049352846-4a222e784d38', // watermelon
    'photo-1631160299919-6a112ee23354', // stone fruit
  ],
  dairy: [
    'photo-1550583724-b2692b85b150', // milk
    'photo-1486297678162-eb2a19b0a32d', // cheddar
    'photo-1488477181946-6428a0291777', // yoghurt
    'photo-1589985270826-4b7bb135bc9d', // butter
    'photo-1452195100486-9cc805987862', // ricotta
    'photo-1551892589-865f69869476', // goat cheese
  ],
  eggs: [
    'photo-1582722872445-44dc5f7e3c8f',
    'photo-1569288063643-5d29ad6ad7a5',
  ],
  grains: [
    'photo-1509440159596-0249088772ff', // flour
    'photo-1515872474884-c6dc1c97a6f5', // oats
    'photo-1586201375761-83865001e31c', // rice
    'photo-1585478259715-876acc5be8eb', // sourdough
    'photo-1505253213348-cd54c92b37ec', // quinoa
  ],
  herbs: [
    'photo-1618557285879-be1c0b4e9a5c', // basil
    'photo-1628557044797-f21a177c37ec', // mint
    'photo-1599591968595-1ab11ddec70e', // rosemary
    'photo-1466637574441-749b8f19452f', // mixed
    'photo-1583398701027-31796f8af9c3', // coriander
  ],
  honey: [
    'photo-1587049352846-4a222e784d38',
    'photo-1601493700631-2b16ec4b4716',
    'photo-1574856344991-aaa31b6f4ce3', // jam
    'photo-1597289124948-688b50ce67ec', // apricot jam
  ],
  meat: [
    'photo-1501200291289-c5a76c232e5f', // chicken
    'photo-1607623814075-e51df1bdc82f', // beef
    'photo-1588168333986-5078d3ae3976', // lamb
    'photo-1633237308525-cd587cf71926', // pork
    'photo-1528607929212-2636ec44253e', // bacon
  ],
  seafood: [
    'photo-1574781330855-d0db8cc6a79c', // salmon
    'photo-1559737558-2f5a35f4523b', // barramundi
    'photo-1565680018434-b513d5e5fd47', // prawns
    'photo-1565280654386-466e7e5fc01e', // oysters
  ],
  nuts: [
    'photo-1508061253366-f7da158b6d46', // almonds
    'photo-1509358271058-acd22cc93898', // macadamia
    'photo-1582550942256-ce0bbd6ec8b0', // sun-dried tomatoes
    'photo-1612257999783-6e57e6caaeb2', // dried apricots
  ],
  plants: [
    'photo-1591857177580-dc82b9ac4e1e',
    'photo-1466692476868-aef1dfb1e735',
    'photo-1416879595882-3373a0480b5b',
  ],
  flowers: [
    'photo-1597848212624-a19eb35e2651', // sunflowers
    'photo-1499002238440-d264edd596ec', // lavender
    'photo-1561181286-d3fee7d55364', // native
  ],
  generic: [
    'photo-1542838132-92c53300491e', // farmers market
    'photo-1488459716781-31db52582fe9', // mixed produce
    'photo-1518977676601-b53f82aba655', // harvest basket
    'photo-1610348725531-843dff563e2c', // citrus mix
    'photo-1467453678174-768ec283a940', // carrots bundle
    'photo-1416879595882-3373a0480b5b', // tomatoes basket
    'photo-1506976785307-8732e854ad03', // veg market stall
    'photo-1471193945509-9ad0617afabf', // fresh herbs bunch
    'photo-1574226516831-e1dff420e562', // mushroom bowl
    'photo-1606923829579-0cb981a83e2e', // chillies
    'photo-1502741338009-cac2772e18bc', // sliced citrus
    'photo-1556909114-f6e7ad7d3136', // berries bowl
  ],
};

// ── Map a category name or title to one of the pool keys above ─────
function pickPool(categoryName = '', title = '') {
  const s = (categoryName + ' ' + title).toLowerCase();
  if (/(veg|tomato|carrot|broccol|kale|onion|garlic|spinach|pumpkin|capsicum|cucumber|corn|cauliflower|sprout|leek|sweet potato|asparagus|pea|lettuce|beet|radish|turnip|chili|chilli|zucchini|eggplant)/.test(s)) return POOLS.vegetables;
  if (/(fruit|apple|orange|mango|banana|strawberr|blueberr|raspberr|grape|watermelon|melon|pineapple|kiwi|lemon|lime|peach|pear|plum|cherry|apricot|avocado|fig|passionfruit|papaya|guava|lychee|mandarin|nectarine)/.test(s)) return POOLS.fruits;
  if (/(dairy|milk|cheese|butter|cream|yoghurt|yogurt|ricotta|cheddar|mozzarella|brie|feta|ghee)/.test(s)) return POOLS.dairy;
  if (/(egg|dozen)/.test(s) && !/eggplant/.test(s)) return POOLS.eggs;
  if (/(grain|wheat|flour|oats|rice|barley|rye|cereal|muesli|porridge|quinoa|bread|sourdough)/.test(s)) return POOLS.grains;
  if (/(herb|basil|parsley|coriander|cilantro|mint|rosemary|thyme|oregano|sage|dill|chive|ginger|turmeric)/.test(s)) return POOLS.herbs;
  if (/(honey|preserve|jam|marmalade|chutney|relish|pickle)/.test(s)) return POOLS.honey;
  if (/(meat|beef|chicken|pork|lamb|duck|turkey|sausage|mince|steak|fillet|bacon|ham|salami)/.test(s)) return POOLS.meat;
  if (/(seafood|fish|salmon|trout|barramundi|tuna|prawn|shrimp|lobster|crab|oyster|mussel|squid|calamari)/.test(s)) return POOLS.seafood;
  if (/(nut|almond|walnut|cashew|pecan|pistachio|macadamia|hazelnut|peanut|dried)/.test(s)) return POOLS.nuts;
  if (/(plant|seedling|seed|sapling|cutting)/.test(s)) return POOLS.plants;
  if (/(flower|bouquet|rose|tulip|sunflower|lily|lavender)/.test(s)) return POOLS.flowers;
  return POOLS.generic;
}

// ── Cheap deterministic string hash (FNV-1a-ish) ───────────────────
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// ── Main API ───────────────────────────────────────────────────────
// listing: any object with image_url + (category_name|category) + (title|name) + listing_id|product_id
export function getProduceImage(listing, size = 600) {
  if (!listing) return `https://images.unsplash.com/photo-1542838132-92c53300491e?w=${size}&auto=format&fit=crop&q=80`;

  // 1) Use the real image if the farmer uploaded one
  const url = listing.image_url || listing.default_image;
  if (url) {
    if (url.startsWith('http')) return url;
    return `http://localhost:5001${url}`;
  }

  // 2) Pick a category-appropriate Unsplash photo, varied per listing
  const pool = pickPool(listing.category_name || listing.category || '', listing.title || listing.name || '');
  const key  = String(listing.listing_id ?? listing.product_id ?? listing.title ?? listing.name ?? Math.random());
  const idx  = hashString(key) % pool.length;
  return `https://images.unsplash.com/${pool[idx]}?w=${size}&auto=format&fit=crop&q=80`;
}

// Legacy two-arg shim for callers that only have an image_url string
export function getImageSrc(image_url) {
  if (!image_url) {
    // No context — return a varied generic so at least repeated calls within
    // one page get different photos via Math.random fallback above
    return `https://images.unsplash.com/${POOLS.generic[0]}?w=600&auto=format&fit=crop&q=80`;
  }
  if (image_url.startsWith('http')) return image_url;
  return `http://localhost:5001${image_url}`;
}

export default getProduceImage;