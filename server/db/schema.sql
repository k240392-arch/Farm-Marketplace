CREATE DATABASE IF NOT EXISTS farm_marketplace
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE farm_marketplace;

SET SQL_SAFE_UPDATES   = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Drop in reverse-dependency order so re-runs are clean ─────────────
DROP TABLE IF EXISTS farmer_payouts;
DROP TABLE IF EXISTS platform_settings;
DROP TABLE IF EXISTS ai_usage_logs;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS blocked_ips;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  user_id               INT           AUTO_INCREMENT PRIMARY KEY,
  full_name             VARCHAR(100)  NOT NULL,
  email                 VARCHAR(150)  UNIQUE NOT NULL,
  password_hash         VARCHAR(255)  NOT NULL,
  role                  ENUM('farmer','buyer','admin') NOT NULL DEFAULT 'buyer',
  phone                 VARCHAR(20)   DEFAULT NULL,
  address               TEXT          DEFAULT NULL,
  profile_image         VARCHAR(500)  DEFAULT NULL,
  is_active             TINYINT(1)    NOT NULL DEFAULT 1,
  is_verified           TINYINT(1)    NOT NULL DEFAULT 0,
  -- Account lifecycle status (separate from is_active to distinguish *why*):
  --   active     — normal account
  --   suspended  — disabled by admin (can be reactivated)
  --   closed     — user requested account closure (data preserved, login disabled)
  --   anonymised — GDPR right-to-erasure executed (personal data scrubbed)
  account_status        ENUM('active','suspended','closed','anonymised') NOT NULL DEFAULT 'active',
  closed_at             DATETIME      DEFAULT NULL,
  closure_reason        VARCHAR(500)  DEFAULT NULL,
  verification_token    VARCHAR(255)  DEFAULT NULL,
  verification_expires  DATETIME      DEFAULT NULL,
  stripe_customer_id    VARCHAR(255)  DEFAULT NULL,
  created_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role        (role),
  INDEX idx_active      (is_active),
  INDEX idx_account_status (account_status),
  INDEX idx_email       (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  category_id INT          AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(10)  NOT NULL,
  keywords    TEXT         NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  product_id     INT            AUTO_INCREMENT PRIMARY KEY,
  category_id    INT            NOT NULL,
  name           VARCHAR(150)   NOT NULL,
  slug           VARCHAR(180)   NOT NULL UNIQUE,
  description    TEXT           DEFAULT NULL,
  default_image  VARCHAR(500)   DEFAULT NULL,
  default_unit   VARCHAR(30)    NOT NULL DEFAULT 'kg',
  is_seasonal    TINYINT(1)     NOT NULL DEFAULT 0,
  season         ENUM('summer','autumn','winter','spring') DEFAULT NULL,
  is_active      TINYINT(1)     NOT NULL DEFAULT 1,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
  INDEX idx_category (category_id),
  INDEX idx_season   (season),
  INDEX idx_active   (is_active),
  FULLTEXT INDEX ft_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listings (
  listing_id    INT            AUTO_INCREMENT PRIMARY KEY,
  farmer_id     INT            NOT NULL,
  product_id    INT            DEFAULT NULL,             -- optional link to catalog
  category_id   INT            NOT NULL,
  title         VARCHAR(200)   NOT NULL,
  description   TEXT           DEFAULT NULL,
  price         DECIMAL(10,2)  NOT NULL,
  quantity      INT            NOT NULL DEFAULT 0,
  unit          VARCHAR(30)    NOT NULL DEFAULT 'kg',
  location      VARCHAR(150)   DEFAULT NULL,
  image_url     VARCHAR(500)   DEFAULT NULL,
  is_active     TINYINT(1)     NOT NULL DEFAULT 1,
  -- Denormalised rating cache (kept current by trg_reviews_update_rating)
  avg_rating    DECIMAL(3,2)   NOT NULL DEFAULT 0.00,
  review_count  INT            NOT NULL DEFAULT 0,
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_listings_farmer
    FOREIGN KEY (farmer_id)   REFERENCES users(user_id)          ON DELETE CASCADE,
  CONSTRAINT fk_listings_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
  CONSTRAINT fk_listings_product
    FOREIGN KEY (product_id)  REFERENCES products(product_id)    ON DELETE SET NULL,
  INDEX idx_farmer    (farmer_id),
  INDEX idx_category  (category_id),
  INDEX idx_product   (product_id),
  INDEX idx_active    (is_active),
  FULLTEXT INDEX ft_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  order_id          INT            AUTO_INCREMENT PRIMARY KEY,
  buyer_id          INT            NOT NULL,
  total_amount      DECIMAL(10,2)  NOT NULL,
  status            ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  delivery_address  TEXT           NOT NULL,
  delivery_time     VARCHAR(50)    DEFAULT 'flexible',
  stripe_payment_id VARCHAR(255)   DEFAULT NULL,
  created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_buyer
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_buyer   (buyer_id),
  INDEX idx_status  (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  item_id    INT           AUTO_INCREMENT PRIMARY KEY,
  order_id   INT           NOT NULL,
  listing_id INT           NOT NULL,
  quantity   INT           NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)   REFERENCES orders(order_id)     ON DELETE CASCADE,
  CONSTRAINT fk_order_items_listing
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE RESTRICT,
  INDEX idx_order   (order_id),
  INDEX idx_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  review_id  INT       AUTO_INCREMENT PRIMARY KEY,
  buyer_id   INT       NOT NULL,
  listing_id INT       NOT NULL,
  rating     TINYINT   NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT      DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_buyer
    FOREIGN KEY (buyer_id)   REFERENCES users(user_id)       ON DELETE CASCADE,
  CONSTRAINT fk_reviews_listing
    FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (buyer_id, listing_id),
  INDEX idx_listing (listing_id),
  INDEX idx_buyer   (buyer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
  log_id      INT           AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           DEFAULT NULL,
  action      VARCHAR(100)  NOT NULL,
  description TEXT          DEFAULT NULL,
  ip_address  VARCHAR(45)   DEFAULT NULL,
  user_agent  VARCHAR(500)  DEFAULT NULL,
  status      ENUM('success','failed','blocked') DEFAULT 'success',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action  (action),
  INDEX idx_status  (status),
  INDEX idx_created (created_at),
  INDEX idx_ip      (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE security_events (
  event_id    INT           AUTO_INCREMENT PRIMARY KEY,
  event_type  VARCHAR(100)  NOT NULL,
  severity    ENUM('low','medium','high','critical') DEFAULT 'low',
  ip_address  VARCHAR(45)   DEFAULT NULL,
  user_id     INT           DEFAULT NULL,
  description TEXT          DEFAULT NULL,
  is_blocked  TINYINT(1)    DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_security_events_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_severity (severity),
  INDEX idx_ip       (ip_address),
  INDEX idx_type     (event_type),
  INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blocked_ips (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  ip_address  VARCHAR(45)  NOT NULL UNIQUE,
  reason      VARCHAR(255) DEFAULT NULL,
  blocked_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     DEFAULT NULL,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_settings (
  user_id        INT          PRIMARY KEY,
  farm_details   TEXT         DEFAULT NULL,
  notifications  TEXT         DEFAULT NULL,
  privacy        TEXT         DEFAULT NULL,
  payouts        TEXT         DEFAULT NULL,
  appearance     TEXT         DEFAULT NULL,
  bio            TEXT         DEFAULT NULL,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_settings_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_methods (
  payment_method_id        INT          AUTO_INCREMENT PRIMARY KEY,
  user_id                  INT          NOT NULL,
  stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
  card_brand               VARCHAR(20)  DEFAULT NULL,
  card_last4               VARCHAR(4)   DEFAULT NULL,
  card_exp_month           TINYINT      DEFAULT NULL,
  card_exp_year            SMALLINT     DEFAULT NULL,
  is_default               TINYINT(1)   NOT NULL DEFAULT 0,
  created_at               TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_methods_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_usage_logs (
  log_id              INT           AUTO_INCREMENT PRIMARY KEY,
  user_id             INT           DEFAULT NULL,
  feature             VARCHAR(50)   NOT NULL,
  prompt_tokens       INT           DEFAULT 0,
  completion_tokens   INT           DEFAULT 0,
  total_tokens        INT           DEFAULT 0,
  latency_ms          INT           DEFAULT 0,
  model               VARCHAR(80)   DEFAULT NULL,
  status              ENUM('success','error','rate_limited') DEFAULT 'success',
  error_message       TEXT          DEFAULT NULL,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_usage_logs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user     (user_id),
  INDEX idx_feature  (feature),
  INDEX idx_status   (status),
  INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE platform_settings (
  setting_key   VARCHAR(64)  PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_by    INT          DEFAULT NULL,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_platform_settings_user
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE farmer_payouts (
  payout_id         INT             AUTO_INCREMENT PRIMARY KEY,
  order_id          INT             NOT NULL,
  farmer_id         INT             NOT NULL,
  gross_amount      DECIMAL(10,2)   NOT NULL,
  commission_rate   DECIMAL(5,4)    NOT NULL,
  commission_amount DECIMAL(10,2)   NOT NULL,
  net_amount        DECIMAL(10,2)   NOT NULL,
  status            ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  paid_at           DATETIME        DEFAULT NULL,
  paid_by           INT             DEFAULT NULL,
  payment_reference VARCHAR(255)    DEFAULT NULL,
  notes             TEXT            DEFAULT NULL,
  created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_farmer_payouts_order
    FOREIGN KEY (order_id)  REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_farmer_payouts_farmer
    FOREIGN KEY (farmer_id) REFERENCES users(user_id)   ON DELETE CASCADE,
  CONSTRAINT fk_farmer_payouts_paid_by
    FOREIGN KEY (paid_by)   REFERENCES users(user_id)   ON DELETE SET NULL,
  UNIQUE KEY uniq_order_farmer (order_id, farmer_id),
  INDEX idx_status (status),
  INDEX idx_farmer (farmer_id),
  INDEX idx_order  (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO categories (name, icon, keywords, description) VALUES
('Vegetables',       '🥦', 'vegetable,carrot,tomato,potato,onion,garlic,broccoli,cauliflower,cabbage,lettuce,spinach,kale,celery,cucumber,zucchini,pumpkin,capsicum,pepper,corn,pea,bean,asparagus,leek,beetroot,radish,turnip,sweet potato,eggplant,silverbeet,bok choy,chilli,chili,wombok', 'Fresh locally grown vegetables'),
('Fruits',           '🍎', 'fruit,apple,orange,mango,banana,strawberry,blueberry,raspberry,grape,watermelon,melon,pineapple,kiwi,lemon,lime,peach,pear,plum,cherry,apricot,avocado,fig,passionfruit,papaya,guava,lychee,mandarin,nectarine', 'Fresh seasonal fruits'),
('Dairy',            '🥛', 'dairy,milk,cheese,butter,cream,yoghurt,yogurt,sour cream,ricotta,cottage cheese,cheddar,mozzarella,brie,goat cheese,feta,ghee,clotted cream', 'Fresh dairy products'),
('Eggs',             '🥚', 'egg,eggs,free range,free-range,organic eggs,chicken eggs,duck eggs,quail eggs,dozen', 'Farm fresh eggs'),
('Grains & Cereals', '🌾', 'grain,wheat,flour,oats,oatmeal,rice,barley,rye,corn,maize,millet,quinoa,buckwheat,spelt,sourdough,bread,cereal,muesli,porridge', 'Whole grains and cereals'),
('Herbs & Spices',   '🌿', 'herb,basil,parsley,coriander,cilantro,mint,rosemary,thyme,oregano,sage,dill,chives,tarragon,bay leaves,lemongrass,ginger,turmeric,lavender', 'Fresh and dried herbs'),
('Honey & Preserves','🍯', 'honey,raw honey,manuka,jam,preserve,marmalade,chutney,relish,pickle,sauce,salsa,compote,jelly,beeswax', 'Honey, jams and preserves'),
('Meat & Poultry',   '🥩', 'meat,beef,chicken,pork,lamb,duck,turkey,venison,rabbit,goat,sausage,mince,steak,fillet,breast,thigh,bacon,ham,salami,chorizo', 'Fresh farm meats'),
('Seafood',          '🐟', 'seafood,fish,salmon,trout,barramundi,snapper,tuna,prawns,shrimp,lobster,crab,oyster,mussel,squid,calamari,scallop', 'Fresh local seafood'),
('Nuts & Dried Goods','🥜', 'nut,almond,walnut,cashew,pecan,pistachio,macadamia,hazelnut,peanut,dried fruit,raisin,sultana,date,prune', 'Nuts and dried produce'),
('Plants & Seedlings','🌱', 'plant,seedling,seeds,sapling,cutting,herb plant,vegetable plant,flower,native plant,transplant', 'Plants and seedlings'),
('Flowers',          '💐', 'flower,bouquet,rose,tulip,sunflower,lily,lavender,native flowers,wildflowers,arrangement,bunch', 'Fresh cut flowers');

-- ── Demo Users (password = test123, all pre-verified) ─────────────────
INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified) VALUES
('John Farm',    'farmer@test.com', '$2a$12$GocJo5mmfuH3oZww4T1.Iu6i3.REbsjVzBMBth1KPWzC.ZtHvTwKO', 'farmer', 1, 1),
('Jane Buyer',   'buyer@test.com',  '$2a$12$GocJo5mmfuH3oZww4T1.Iu6i3.REbsjVzBMBth1KPWzC.ZtHvTwKO', 'buyer',  1, 1),
('Admin User',   'admin@test.com',  '$2a$12$GocJo5mmfuH3oZww4T1.Iu6i3.REbsjVzBMBth1KPWzC.ZtHvTwKO', 'admin',  1, 1),
('Mary Gardens', 'mary@test.com',   '$2a$12$GocJo5mmfuH3oZww4T1.Iu6i3.REbsjVzBMBth1KPWzC.ZtHvTwKO', 'farmer', 1, 1),
('Tom Orchard',  'tom@test.com',    '$2a$12$GocJo5mmfuH3oZww4T1.Iu6i3.REbsjVzBMBth1KPWzC.ZtHvTwKO', 'farmer', 1, 1);

-- ── Platform settings ────────────────────────────────────────────────
INSERT INTO platform_settings (setting_key, setting_value) VALUES
('platform_commission_rate', '0.10');

-- ── Products catalog  ─────────────────────────────
INSERT INTO products (category_id, name, slug, description, default_image, default_unit, is_seasonal, season) VALUES
-- VEGETABLES (19)
(1, 'Heirloom Tomatoes',     'heirloom-tomatoes',     'Vine-ripened heirloom tomatoes in every color. Bursting with old-fashioned flavor that supermarket varieties lost long ago.', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'summer'),
(1, 'Roma Tomatoes',         'roma-tomatoes',         'Classic Italian plum tomatoes. Meaty, low-moisture, perfect for sauces and sun-drying.',                                       'https://images.unsplash.com/photo-1546470427-227df1e3c2e8?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'summer'),
(1, 'Sweet Corn',            'sweet-corn',            'Tender, golden kernels picked at peak sweetness. Best eaten the day it''s harvested.',                                          'https://images.unsplash.com/photo-1601593768799-76e3aaeebb47?w=800&auto=format&fit=crop&q=80', 'piece', 1, 'summer'),
(1, 'Zucchini',              'zucchini',              'Mild-flavored summer squash, endlessly versatile from grills to fritters.',                                                    'https://images.unsplash.com/photo-1583687355032-89b902b7335f?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'summer'),
(1, 'Butternut Pumpkin',     'butternut-pumpkin',     'Sweet, creamy autumn pumpkin. Roasted, pureed, or in soups — a kitchen staple.',                                                'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'autumn'),
(1, 'Brussels Sprouts',      'brussels-sprouts',      'Tender mini cabbages, miraculous when roasted with olive oil and salt.',                                                       'https://images.unsplash.com/photo-1438118907704-7718ee9a191a?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'autumn'),
(1, 'Sweet Potato',          'sweet-potato',          'Earthy, naturally sweet root vegetable. Roast, mash, or turn into soup.',                                                       'https://images.unsplash.com/photo-1596097635121-14b38c85d2c4?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'autumn'),
(1, 'Cauliflower',           'cauliflower',           'Versatile, mild-flavored brassica. Roast whole, rice it, or turn into a creamy soup.',                                          'https://images.unsplash.com/photo-1568584711271-946d0e54ada1?w=800&auto=format&fit=crop&q=80', 'head',  1, 'autumn'),
(1, 'Curly Kale',            'curly-kale',            'Hearty leafy green packed with iron and vitamins. Massage with olive oil for the best salads.',                                 'https://images.unsplash.com/photo-1515686925575-a8f8b53b1eda?w=800&auto=format&fit=crop&q=80', 'bunch', 1, 'winter'),
(1, 'Broccoli',              'broccoli',              'Crisp green florets at their winter best. Steam, roast, or stir-fry.',                                                          'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'winter'),
(1, 'Leeks',                 'leeks',                 'Mild, sweet onion alternative. Essential for soups, gratins, and slow-cooked dishes.',                                          'https://images.unsplash.com/photo-1631203587046-0738c5d6f76c?w=800&auto=format&fit=crop&q=80', 'bunch', 1, 'winter'),
(1, 'Garlic',                'garlic',                'Bold and aromatic, locally grown. The foundation of countless great meals.',                                                   'https://images.unsplash.com/photo-1615477550927-6ec8445fcfe3?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(1, 'Asparagus',             'asparagus',             'Tender spring spears at their peak. Grill, roast, or shave raw into salads.',                                                  'https://images.unsplash.com/photo-1603048719541-e0a3a3e2c97f?w=800&auto=format&fit=crop&q=80', 'bunch', 1, 'spring'),
(1, 'Garden Peas',           'garden-peas',           'Crisp, naturally sweet peas just out of the pod. The taste of spring.',                                                        'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=800&auto=format&fit=crop&q=80', 'kg',    1, 'spring'),
(1, 'Lettuce',               'lettuce',               'Crisp, fresh leaves grown in rich soil. The base of every great salad.',                                                       'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&auto=format&fit=crop&q=80', 'head',  1, 'spring'),
(1, 'Carrots',               'carrots',               'Sweet, crunchy carrots in heritage colors — orange, purple, and yellow.',                                                      'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(1, 'Baby Spinach',          'baby-spinach',          'Tender baby spinach leaves, picked young for sweetness.',                                                                      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop&q=80', 'bunch', 0, NULL),
(1, 'Cucumber',              'cucumber',              'Crisp, refreshing cucumbers — perfect for salads, sandwiches, and pickling.',                                                  'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(1, 'Capsicum',              'capsicum',              'Sweet bell peppers in red, yellow, and green. Roasted, raw, or stuffed.',                                                      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
-- FRUITS (13)
(2, 'Mangoes',               'mangoes',               'Honey-sweet, dripping with flavor. Australia''s summer obsession.',                                                              'https://images.unsplash.com/photo-1605027990121-cbae9e0642db?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'summer'),
(2, 'Stone Fruit Mix',       'stone-fruit-mix',       'Peaches, plums, and nectarines picked sun-warm at their summer peak.',                                                          'https://images.unsplash.com/photo-1631160299919-6a112ee23354?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'summer'),
(2, 'Blueberries',           'blueberries',           'Plump, sweet blueberries packed with antioxidants. Eat by the handful.',                                                       'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&auto=format&fit=crop&q=80', 'punnet', 1, 'summer'),
(2, 'Watermelon',            'watermelon',            'Sweet, juicy watermelon — the ultimate summer thirst quencher.',                                                                'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80', 'piece',  1, 'summer'),
(2, 'Heritage Apples',       'heritage-apples',       'Crisp, juicy heritage apple varieties. Far more flavorful than supermarket types.',                                              'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'autumn'),
(2, 'Pink Lady Apples',      'pink-lady-apples',      'Sweet-tart Pink Lady apples — perfect for eating fresh or baking.',                                                            'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'autumn'),
(2, 'Pears',                 'pears',                 'Buttery, aromatic pears at their autumn best. Beauchamp, Bosc, or Williams.',                                                  'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'autumn'),
(2, 'Figs',                  'figs',                  'Sweet, jammy figs perfect for cheese boards or simple desserts.',                                                              'https://images.unsplash.com/photo-1601379760883-1bb497a14e4f?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'autumn'),
(2, 'Navel Oranges',         'navel-oranges',         'Bright, juicy seedless oranges packed with vitamin C. Perfect for juicing.',                                                   'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'winter'),
(2, 'Mandarins',             'mandarins',             'Easy-peel, naturally sweet citrus. The healthiest snack in the kitchen.',                                                      'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'winter'),
(2, 'Lemons',                'lemons',                'Juicy unwaxed lemons from local groves — bright, sharp, essential.',                                                           'https://images.unsplash.com/photo-1582287014914-1db836872ff5?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'winter'),
(2, 'Strawberries',          'strawberries',          'Sun-ripened strawberries picked at peak sweetness.',                                                                            'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80', 'punnet', 1, 'spring'),
(2, 'Rhubarb',               'rhubarb',               'Tart pink rhubarb stalks — perfect for crumbles, pies, and compotes.',                                                          'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=800&auto=format&fit=crop&q=80', 'bunch',  1, 'spring'),
(2, 'Hass Avocados',         'hass-avocados',         'Creamy, rich Hass avocados at peak ripeness. Sustainably grown.',                                                              'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=80', 'kg',     0, NULL),
(2, 'Bananas',               'bananas',               'Sweet, naturally ripened bananas — Cavendish or Lady Finger.',                                                                  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80', 'kg',     0, NULL),
(2, 'Raspberries',           'raspberries',           'Delicate, intensely flavored raspberries. Eat the same day you buy them.',                                                     'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=800&auto=format&fit=crop&q=80', 'punnet', 1, 'summer'),
(2, 'Kiwifruit',             'kiwifruit',             'Tangy, vitamin-packed kiwifruit grown in Victorian orchards.',                                                                  'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=800&auto=format&fit=crop&q=80', 'kg',     1, 'autumn'),
-- DAIRY (6)
(3, 'Full Cream Milk',       'full-cream-milk',       'Unhomogenised full-cream milk from grass-fed cows. Rich, creamy, the way milk should taste.', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80', 'litre', 0, NULL),
(3, 'Aged Cheddar',          'aged-cheddar',          'Hand-crafted cheddar matured 12+ months. Bold, firm, and complex.',                          'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(3, 'Greek Yoghurt',         'greek-yoghurt',         'Thick, creamy Greek-style yoghurt made the traditional way.',                                'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop&q=80', 'jar',   0, NULL),
(3, 'Fresh Butter',          'fresh-butter',          'Cultured butter churned from grass-fed cream. Rich, golden, full of flavor.',               'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(3, 'Fresh Ricotta',         'fresh-ricotta',         'Soft, fresh ricotta cheese — perfect for pasta, baking, or just on toast.',                  'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&auto=format&fit=crop&q=80', 'jar',   0, NULL),
(3, 'Goat Cheese',           'goat-cheese',           'Tangy, creamy goat cheese — a versatile favorite for salads and cheese boards.',             'https://images.unsplash.com/photo-1551892589-865f69869476?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
-- EGGS (3)
(4, 'Free Range Eggs',       'free-range-eggs',       'Free-range eggs from happy hens with daily paddock access. Collected fresh daily.',          'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&auto=format&fit=crop&q=80', 'dozen', 0, NULL),
(4, 'Duck Eggs',             'duck-eggs',             'Rich, large duck eggs with vibrant orange yolks. Wonderful for baking.',                     'https://images.unsplash.com/photo-1569288063643-5d29ad6ad7a5?w=800&auto=format&fit=crop&q=80', 'dozen', 0, NULL),
(4, 'Quail Eggs',            'quail-eggs',            'Delicate quail eggs — perfect for canapés, ramen, or pickling.',                              'https://images.unsplash.com/photo-1551529834-525807d6b4f3?w=800&auto=format&fit=crop&q=80', 'dozen', 0, NULL),
-- GRAINS & CEREALS (5)
(5, 'Wholemeal Flour',       'wholemeal-flour',       'Stone-ground wholemeal flour from heritage wheat. Perfect for artisan bread.',               'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(5, 'Rolled Oats',           'rolled-oats',           'Australian-grown rolled oats — hearty breakfast staple.',                                     'https://images.unsplash.com/photo-1515872474884-c6dc1c97a6f5?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(5, 'Brown Rice',            'brown-rice',            'Wholegrain brown rice grown in NSW Riverina. Nutty and nutritious.',                          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(5, 'Sourdough Loaf',        'sourdough-loaf',        'Crusty artisan sourdough bread, naturally leavened over 24 hours.',                          'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=800&auto=format&fit=crop&q=80', 'piece', 0, NULL),
(5, 'Quinoa',                'quinoa',                'Ancient grain rich in protein. Locally grown in temperate Australian climates.',              'https://images.unsplash.com/photo-1505253213348-cd54c92b37ec?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
-- HERBS & SPICES (6)
(6, 'Fresh Basil',           'fresh-basil',           'Fragrant fresh basil — the soul of Italian cooking. Perfect for pesto.',                     'https://images.unsplash.com/photo-1618557285879-be1c0b4e9a5c?w=800&auto=format&fit=crop&q=80', 'bunch', 1, 'spring'),
(6, 'Spring Herb Bundle',    'spring-herb-bundle',    'Mint, basil, parsley, and chives — freshly cut spring herbs.',                                'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&auto=format&fit=crop&q=80', 'bunch', 1, 'spring'),
(6, 'Fresh Mint',            'fresh-mint',            'Cooling, aromatic mint — for tea, salads, and cocktails.',                                    'https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=800&auto=format&fit=crop&q=80', 'bunch', 0, NULL),
(6, 'Coriander',             'coriander',             'Fresh coriander (cilantro) — essential for Asian and Mexican cooking.',                       'https://images.unsplash.com/photo-1583398701027-31796f8af9c3?w=800&auto=format&fit=crop&q=80', 'bunch', 0, NULL),
(6, 'Rosemary',              'rosemary',              'Hardy rosemary sprigs — perfect for roasting and slow cooking.',                              'https://images.unsplash.com/photo-1599591968595-1ab11ddec70e?w=800&auto=format&fit=crop&q=80', 'bunch', 0, NULL),
(6, 'Fresh Ginger',          'fresh-ginger',          'Aromatic Australian-grown ginger root — essential for tea and cooking.',                      'https://images.unsplash.com/photo-1573414405428-9f9d8b5e4c5e?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
-- HONEY & PRESERVES (5)
(7, 'Wildflower Honey',      'wildflower-honey',      'Pure raw honey from wildflower meadows. Unfiltered, full of natural enzymes.',                'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80', 'jar',   0, NULL),
(7, 'Manuka Honey',          'manuka-honey',          'Premium manuka honey with proven health benefits. Australian-sourced.',                       'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&auto=format&fit=crop&q=80', 'jar',   0, NULL),
(7, 'Strawberry Jam',        'strawberry-jam',        'Homemade strawberry jam with no preservatives. Just fruit and sugar.',                        'https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?w=800&auto=format&fit=crop&q=80', 'jar',   0, NULL),
(7, 'Apricot Jam',           'apricot-jam',           'Sweet-tart apricot jam made from local stone fruit at peak season.',                          'https://images.unsplash.com/photo-1597289124948-688b50ce67ec?w=800&auto=format&fit=crop&q=80', 'jar',   0, NULL),
(7, 'Tomato Chutney',        'tomato-chutney',        'Tangy tomato chutney — perfect for cheese boards, sandwiches, or curries.',                  'https://images.unsplash.com/photo-1593003687816-0f8a7faae62f?w=800&auto=format&fit=crop&q=80', 'jar',   0, NULL),
-- MEAT & POULTRY (6)
(8, 'Free Range Chicken',    'free-range-chicken',    'Whole free-range chicken raised on open paddocks. No hormones or antibiotics.',                'https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?w=800&auto=format&fit=crop&q=80', 'piece', 0, NULL),
(8, 'Grass-Fed Beef Mince',  'grass-fed-beef-mince',  'Lean, full-flavored beef mince from grass-fed Australian cattle.',                            'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(8, 'Lamb Shoulder',         'lamb-shoulder',         'Pasture-raised lamb shoulder — perfect for slow roasting.',                                   'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(8, 'Pork Belly',            'pork-belly',            'Free-range pork belly with rich crackling layer. From ethically raised pigs.',                'https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(8, 'Beef Sausages',         'beef-sausages',         'Hand-made beef sausages from a single farm. No fillers, just quality meat and herbs.',         'https://images.unsplash.com/photo-1601001815853-3835274403b3?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(8, 'Streaky Bacon',         'streaky-bacon',         'Traditionally smoked streaky bacon from heritage-breed pigs.',                                'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
-- SEAFOOD (6)
(9, 'Atlantic Salmon',       'atlantic-salmon',       'Premium Tasmanian Atlantic salmon fillets — sustainable and flavorful.',                       'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(9, 'Wild Barramundi',       'wild-barramundi',       'Wild-caught Australian barramundi — firm, flaky, mildly sweet.',                              'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(9, 'King Prawns',           'king-prawns',           'Large green king prawns — perfect for grilling, BBQ, or curries.',                            'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(9, 'Sydney Rock Oysters',   'sydney-rock-oysters',   'Fresh Sydney rock oysters — briny, plump, and best with a squeeze of lemon.',                'https://images.unsplash.com/photo-1565280654386-466e7e5fc01e?w=800&auto=format&fit=crop&q=80', 'dozen', 0, NULL),
(9, 'Blue Mussels',          'blue-mussels',          'Fresh blue mussels — perfect for steaming with white wine and garlic.',                       'https://images.unsplash.com/photo-1565680018469-f9b18f4d4d2e?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
(9, 'Squid Tubes',           'squid-tubes',           'Fresh cleaned squid tubes — perfect for calamari, salads, and stir-fries.',                   'https://images.unsplash.com/photo-1559737558-3f5a35f4523b?w=800&auto=format&fit=crop&q=80', 'kg',    0, NULL),
-- NUTS & DRIED GOODS (5)
(10, 'Raw Almonds',          'raw-almonds',           'Australian-grown raw almonds. Crunchy, nutritious, and locally produced.',                    'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&auto=format&fit=crop&q=80', 'kg', 0, NULL),
(10, 'Macadamia Nuts',       'macadamia-nuts',        'Buttery, rich macadamias — Australia''s native nut, grown in Queensland.',                   'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80', 'kg', 0, NULL),
(10, 'Cashews',              'cashews',               'Whole raw cashews — perfect for snacking, cooking, or making cashew cream.',                  'https://images.unsplash.com/photo-1567891069834-a9b4f5b8c8b8?w=800&auto=format&fit=crop&q=80', 'kg', 0, NULL),
(10, 'Sun-Dried Tomatoes',   'sun-dried-tomatoes',    'Slow-dried tomatoes packed with concentrated summer flavor.',                                 'https://images.unsplash.com/photo-1582550942256-ce0bbd6ec8b0?w=800&auto=format&fit=crop&q=80', 'jar', 0, NULL),
(10, 'Dried Apricots',       'dried-apricots',        'Plump, sun-dried apricots from Mildura orchards. No preservatives.',                          'https://images.unsplash.com/photo-1612257999783-6e57e6caaeb2?w=800&auto=format&fit=crop&q=80', 'kg', 0, NULL),
-- PLANTS & SEEDLINGS (3)
(11, 'Tomato Seedlings',     'tomato-seedlings',      'Young tomato plants ready for transplanting. Heirloom varieties available.',                 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&auto=format&fit=crop&q=80', 'piece', 0, NULL),
(11, 'Herb Seedling Pack',   'herb-seedling-pack',    'Pack of basil, parsley, mint, and chives seedlings — start your own herb garden.',           'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&auto=format&fit=crop&q=80', 'piece', 0, NULL),
(11, 'Native Plant Mix',     'native-plant-mix',      'Mixed Australian native plants for landscaping or wildlife gardens.',                         'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80', 'piece', 0, NULL),
-- FLOWERS (3)
(12, 'Sunflower Bunch',      'sunflower-bunch',       'Bright, cheerful sunflowers grown in Victorian fields.',                                      'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80', 'bunch', 1, 'summer'),
(12, 'Native Wildflowers',   'native-wildflowers',    'Mixed Australian native wildflowers — banksias, kangaroo paw, and waratahs.',                'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80', 'bunch', 0, NULL),
(12, 'Lavender Bouquet',     'lavender-bouquet',      'Fragrant fresh lavender — for arrangements, drying, or bath bundles.',                        'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&auto=format&fit=crop&q=80', 'bunch', 1, 'spring');

-- ── Sample listings (20 — across 3 farmers) ──────────────────────────
INSERT INTO listings (farmer_id, category_id, title, description, price, quantity, unit, location, image_url, is_active) VALUES
(1,1,'Fresh Roma Tomatoes','Vine-ripened Roma tomatoes grown without pesticides. Perfect for sauces and salads.',4.99,100,'kg','Dandenong Ranges, VIC','https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',1),
(1,1,'Organic Cauliflower','Beautiful white cauliflower heads, organically grown. Crisp and full of flavour.',5.50,40,'head','Dandenong Ranges, VIC','https://images.unsplash.com/photo-1568584711271-6c929fb49b60?w=600',1),
(1,1,'Baby Spinach Leaves','Tender baby spinach picked fresh daily. Great for salads and stir fries.',3.99,60,'bunch','Dandenong Ranges, VIC','https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600',1),
(1,1,'Sweet Corn Cobs','Golden sweet corn at peak season — incredibly sweet and juicy.',3.50,80,'piece','Mornington Peninsula, VIC','https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600',1),
(1,1,'Purple Carrots','Rare heritage purple carrots — sweet, crunchy and rich in antioxidants.',6.00,30,'kg','Dandenong Ranges, VIC','https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600',1),
(1,4,'Free Range Eggs','Happy hens, happy eggs! Free-range eggs collected fresh daily from open paddocks.',8.50,50,'dozen','Dandenong Ranges, VIC','https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600',1),
(4,2,'Alphonso Mangoes','Premium Alphonso mangoes from our tropical grove — sweet, juicy and fragrant.',12.00,25,'kg','Cairns, QLD','https://images.unsplash.com/photo-1553279768-865429fa0078?w=600',1),
(4,2,'Pink Lady Apples','Crisp and sweet Pink Lady apples straight from the orchard. Perfect for baking.',5.99,80,'kg','Shepparton, VIC','https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600',1),
(4,2,'Fresh Strawberries','Sun-ripened strawberries bursting with sweetness. Picked at peak freshness.',6.50,45,'punnet','Mornington, VIC','https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600',1),
(4,2,'Navel Oranges','Juicy seedless navel oranges — perfect for juicing. Grown in our citrus grove.',4.50,90,'kg','Mildura, VIC','https://images.unsplash.com/photo-1547514701-42782101795e?w=600',1),
(4,2,'Hass Avocados','Creamy rich Hass avocados at peak ripeness. Sustainably grown on our family farm.',9.00,35,'kg','Sunraysia, VIC','https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600',1),
(4,2,'Blueberries','Plump, sweet blueberries freshly picked. Packed with antioxidants and flavour.',8.00,30,'punnet','Yarra Valley, VIC','https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600',1),
(5,3,'Full Cream Farm Milk','Unhomogenised full cream milk from grass-fed dairy cows. Rich and creamy.',5.00,30,'litre','Gippsland, VIC','https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600',1),
(5,3,'Aged Cheddar Cheese','Hand-crafted aged cheddar matured 12 months on our farm. Bold and firm.',18.00,20,'kg','Gippsland, VIC','https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600',1),
(5,7,'Raw Wildflower Honey','Pure raw honey from wildflower meadows. Unfiltered and packed with natural enzymes.',15.00,40,'jar','Yarra Valley, VIC','https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600',1),
(5,7,'Homemade Strawberry Jam','Fresh strawberry jam with no preservatives or additives. Made on the farm.',9.50,25,'jar','Yarra Valley, VIC','https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?w=600',1),
(5,5,'Stone-Ground Wholemeal Flour','Freshly stone-ground from heritage wheat. Perfect for artisan bread baking.',7.00,50,'kg','Ballarat, VIC','https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',1),
(5,6,'Fresh Basil','Fragrant fresh basil grown hydroponically. Perfect for pesto and Italian cooking.',3.00,70,'bunch','Melbourne, VIC','https://images.unsplash.com/photo-1618557285879-be1c0b4e9a5c?w=600',1),
(5,6,'Mixed Herb Pack','Bundle of rosemary, thyme, sage and parsley — freshly cut this morning.',5.00,40,'bunch','Melbourne, VIC','https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600',1),
(1,8,'Free Range Chicken','Whole free-range chickens raised on our family farm. No hormones or antibiotics.',22.00,15,'piece','Dandenong Ranges, VIC','https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?w=600',1);

-- ── Backfill: link existing listings to catalog entries by name match ──
UPDATE listings l
JOIN products p ON (
  LOWER(l.title) LIKE CONCAT('%', LOWER(p.name), '%')
  OR LOWER(p.name) LIKE CONCAT('%', LOWER(l.title), '%')
)
SET l.product_id = p.product_id
WHERE l.product_id IS NULL;

SET SQL_SAFE_UPDATES = 1;



DROP TRIGGER IF EXISTS trg_listings_no_negative_stock;
DROP TRIGGER IF EXISTS trg_listings_auto_deactivate;
DROP TRIGGER IF EXISTS trg_orders_log_status_change;
DROP TRIGGER IF EXISTS trg_users_log_registration;
DROP TRIGGER IF EXISTS trg_payouts_log_paid;
DROP TRIGGER IF EXISTS trg_reviews_update_rating_ins;
DROP TRIGGER IF EXISTS trg_reviews_update_rating_upd;
DROP TRIGGER IF EXISTS trg_reviews_update_rating_del;

DELIMITER $$

-- ── ① Block stock from going negative ────────────────────────────────
CREATE TRIGGER trg_listings_no_negative_stock
BEFORE UPDATE ON listings
FOR EACH ROW
BEGIN
  IF NEW.quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stock quantity cannot be negative.';
  END IF;
END$$

-- ── ② Auto-deactivate when stock = 0, reactivate when restocked ──────
CREATE TRIGGER trg_listings_auto_deactivate
BEFORE UPDATE ON listings
FOR EACH ROW
BEGIN
  -- Sold out: deactivate so it stops appearing in search results
  IF NEW.quantity = 0 AND OLD.quantity > 0 THEN
    SET NEW.is_active = 0;
  END IF;
  -- Restocked: reactivate (only if it had been auto-deactivated, i.e. was 0)
  IF NEW.quantity > 0 AND OLD.quantity = 0 AND OLD.is_active = 0 THEN
    SET NEW.is_active = 1;
  END IF;
END$$

-- ── ③ Audit every order status change ───────────────────────────────
CREATE TRIGGER trg_orders_log_status_change
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO activity_logs (user_id, action, description, status)
    VALUES (
      NEW.buyer_id,
      'order_status_changed',
      CONCAT('Order #', NEW.order_id, ' status: ', OLD.status, ' → ', NEW.status),
      'success'
    );
  END IF;
END$$

-- ── ④ Audit every new user registration ─────────────────────────────
CREATE TRIGGER trg_users_log_registration
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO activity_logs (user_id, action, description, status)
  VALUES (
    NEW.user_id,
    'user_registered',
    CONCAT('New ', NEW.role, ' account created: ', NEW.email),
    'success'
  );
END$$

-- ── ⑤ Audit every payout that gets paid ─────────────────────────────
CREATE TRIGGER trg_payouts_log_paid
AFTER UPDATE ON farmer_payouts
FOR EACH ROW
BEGIN
  IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
    INSERT INTO activity_logs (user_id, action, description, status)
    VALUES (
      NEW.paid_by,
      'payout_completed',
      CONCAT('Payout #', NEW.payout_id, ' of $', NEW.net_amount,
             ' paid to farmer #', NEW.farmer_id,
             COALESCE(CONCAT(' (ref: ', NEW.payment_reference, ')'), '')),
      'success'
    );
  END IF;
END$$

-- ── ⑥ Keep listings.avg_rating + review_count up-to-date whe
CREATE TRIGGER trg_reviews_update_rating_ins
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  UPDATE listings
     SET avg_rating   = COALESCE((SELECT AVG(rating)   FROM reviews WHERE listing_id = NEW.listing_id), 0),
         review_count = (SELECT COUNT(*) FROM reviews WHERE listing_id = NEW.listing_id)
   WHERE listing_id = NEW.listing_id;
END$$

CREATE TRIGGER trg_reviews_update_rating_upd
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
  UPDATE listings
     SET avg_rating   = COALESCE((SELECT AVG(rating)   FROM reviews WHERE listing_id = NEW.listing_id), 0),
         review_count = (SELECT COUNT(*) FROM reviews WHERE listing_id = NEW.listing_id)
   WHERE listing_id = NEW.listing_id;
END$$

CREATE TRIGGER trg_reviews_update_rating_del
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
  UPDATE listings
     SET avg_rating   = COALESCE((SELECT AVG(rating)   FROM reviews WHERE listing_id = OLD.listing_id), 0),
         review_count = (SELECT COUNT(*) FROM reviews WHERE listing_id = OLD.listing_id)
   WHERE listing_id = OLD.listing_id;
END$$

DELIMITER ;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION SUMMARY
-- ════════════════════════════════════════════════════════════════════════════
SELECT '═════════════════════════════════════════════' AS summary;
SELECT CONCAT(' Tables created:      ', COUNT(*)) AS summary
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = 'farm_marketplace';
SELECT CONCAT(' Foreign keys active: ', COUNT(*)) AS summary
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = 'farm_marketplace'
   AND REFERENCED_TABLE_NAME IS NOT NULL;
SELECT CONCAT(' Triggers installed:  ', COUNT(*)) AS summary
  FROM information_schema.TRIGGERS
 WHERE TRIGGER_SCHEMA = 'farm_marketplace';
SELECT CONCAT(' Indexes built:       ', COUNT(*)) AS summary
  FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = 'farm_marketplace';
SELECT '─────────────────────────────────────────────' AS summary;
SELECT CONCAT(' Users:      ',     COUNT(*)) AS summary FROM users;
SELECT CONCAT(' Categories: ',     COUNT(*)) AS summary FROM categories;
SELECT CONCAT(' Products:   ',     COUNT(*)) AS summary FROM products;
SELECT CONCAT(' Listings:   ',     COUNT(*)) AS summary FROM listings;
SELECT CONCAT(' Listings linked to catalog: ', COUNT(*), ' / ', (SELECT COUNT(*) FROM listings)) AS summary
  FROM listings WHERE product_id IS NOT NULL;
SELECT '═════════════════════════════════════════════' AS summary;
SELECT ' Schema ready! Login: farmer@test.com / test123' AS summary;

--    sidebar Trigger nodes under each table)
SELECT '──── All Triggers ────' AS info;
SELECT
  TRIGGER_NAME       AS `Trigger Name`,
  EVENT_OBJECT_TABLE AS `On Table`,
  EVENT_MANIPULATION AS `Fires On`,
  ACTION_TIMING      AS `When`
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'farm_marketplace'
ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME;

-- ── Proof #2: All 18 foreign keys exist with readable names
SELECT '──── All Foreign Keys ────' AS info;
SELECT
  TABLE_NAME              AS `Table`,
  CONSTRAINT_NAME         AS `Foreign Key`,
  COLUMN_NAME             AS `Column`,
  REFERENCED_TABLE_NAME   AS `Refs Table`,
  REFERENCED_COLUMN_NAME  AS `Refs Column`
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'farm_marketplace'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- ── Proof #3: Every table uses InnoDB (required for FKs to work)
SELECT '──── Storage Engines ────' AS info;
SELECT TABLE_NAME AS `Table`, ENGINE AS `Engine`
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'farm_marketplace'
ORDER BY TABLE_NAME;