'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* 도시 이름 → slug 변환 (All Cities 모드에서 product.city_name 기반) */
function cityNameToSlug(name: string): string {
  const MAP: Record<string, string> = {
    'london':'london','paris':'paris','barcelona':'barcelona','rome':'rome',
    'amsterdam':'amsterdam','new york':'new-york','dubai':'dubai','tokyo':'tokyo',
    'singapore':'singapore','hong kong':'hong-kong','istanbul':'istanbul',
    'florence':'florence','lisbon':'lisbon','venice':'venice','berlin':'berlin',
    'milan':'milan','krakow':'krakow','sydney':'sydney','athens':'athens',
    'bangkok':'bangkok','edinburgh':'edinburgh','dublin':'dublin',
    'mexico city':'mexico-city','munich':'munich','budapest':'budapest',
    'brussels':'brussels','cape town':'cape-town','cairo':'cairo','bali':'bali',
    'bruges':'bruges','osaka':'osaka','kyoto':'kyoto','seoul':'seoul',
    'prague':'prague','madrid':'madrid','vienna':'vienna',
    'naples':'naples','porto':'porto','reykjavik':'reykjavik','seville':'seville',
    'hamburg':'hamburg','copenhagen':'copenhagen','palermo':'palermo','stockholm':'stockholm',
    'verona':'verona','nice':'nice','turin':'turin','helsinki':'helsinki',
    'bologna':'bologna','warsaw':'warsaw','rhodes':'rhodes','bordeaux':'bordeaux',
    'cologne':'cologne','valletta':'valletta','dresden':'dresden','salzburg':'salzburg',
    'zurich':'zurich','oslo':'oslo','innsbruck':'innsbruck','tallinn':'tallinn',
    'vilnius':'vilnius','lucerne':'lucerne',
    'abu dhabi':'abu-dhabi','marrakesh':'marrakesh','hurghada':'hurghada',
    'luxor':'luxor','doha':'doha',
    'las vegas':'las-vegas','san francisco':'san-francisco','los angeles':'los-angeles',
    'miami':'miami','chicago':'chicago','vancouver':'vancouver','boston':'boston',
    'tulum':'tulum','toronto':'toronto','new orleans':'new-orleans',
    'playa del carmen':'playa-del-carmen','washington dc':'washington-dc',
    'buenos aires':'buenos-aires','montreal':'montreal','rio de janeiro':'rio-de-janeiro',
    'cusco':'cusco',
    'melbourne':'melbourne','phuket':'phuket','cairns':'cairns','gold coast':'gold-coast',
    'ho chi minh city':'ho-chi-minh','ho chi minh':'ho-chi-minh',
    'kuala lumpur':'kuala-lumpur','siem reap':'siem-reap','chiang mai':'chiang-mai',
    'hanoi':'hanoi','phnom penh':'phnom-penh',
  };
  return MAP[name.toLowerCase()] ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/* ─────────────────────────────────────────
   Tiqets city IDs (from tiqets.com/en/city-cXX/ URL pattern)
───────────────────────────────────────── */
const CITIES = [
  { id: '',       name: 'All Cities',  flag: '🌍', slug: ''             },
  { id: '67458',  name: 'London',      flag: '🇬🇧', slug: 'london'       },
  { id: '66746',  name: 'Paris',       flag: '🇫🇷', slug: 'paris'        },
  { id: '66342',  name: 'Barcelona',   flag: '🇪🇸', slug: 'barcelona'    },
  { id: '71631',  name: 'Rome',        flag: '🇮🇹', slug: 'rome'         },
  { id: '75061',  name: 'Amsterdam',   flag: '🇳🇱', slug: 'amsterdam'    },
  { id: '260932', name: 'New York',    flag: '🇺🇸', slug: 'new-york'     },
  { id: '60005',  name: 'Dubai',       flag: '🇦🇪', slug: 'dubai'        },
  { id: '72181',  name: 'Tokyo',       flag: '🇯🇵', slug: 'tokyo'        },
  { id: '78125',  name: 'Singapore',   flag: '🇸🇬', slug: 'singapore'    },
  { id: '79079',  name: 'Istanbul',    flag: '🇹🇷', slug: 'istanbul'     },
  { id: '71854',  name: 'Florence',    flag: '🇮🇹', slug: 'florence'     },
  { id: '76528',  name: 'Lisbon',      flag: '🇵🇹', slug: 'lisbon'       },
  { id: '71510',  name: 'Venice',      flag: '🇮🇹', slug: 'venice'       },
  { id: '65144',  name: 'Berlin',      flag: '🇩🇪', slug: 'berlin'       },
  { id: '71749',  name: 'Milan',       flag: '🇮🇹', slug: 'milan'        },
  { id: '46',     name: 'Krakow',      flag: '🇵🇱', slug: 'krakow'       },
  { id: '60400',  name: 'Sydney',      flag: '🇦🇺', slug: 'sydney'       },
  { id: '99239',  name: 'Athens',      flag: '🇬🇷', slug: 'athens'       },
  { id: '78586',  name: 'Bangkok',     flag: '🇹🇭', slug: 'bangkok'      },
  { id: '21',     name: 'Edinburgh',   flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', slug: 'edinburgh'    },
  { id: '68616',  name: 'Dublin',      flag: '🇮🇪', slug: 'dublin'       },
  { id: '74040',  name: 'Mexico City', flag: '🇲🇽', slug: 'mexico-city'  },
  { id: '31',     name: 'Munich',      flag: '🇩🇪', slug: 'munich'       },
  { id: '68199',  name: 'Budapest',    flag: '🇭🇺', slug: 'budapest'     },
  { id: '60843',  name: 'Brussels',    flag: '🇧🇪', slug: 'brussels'     },
  { id: '82923',  name: 'Cape Town',   flag: '🇿🇦', slug: 'cape-town'    },
  { id: '65792',  name: 'Cairo',       flag: '🇪🇬', slug: 'cairo'        },
  { id: '267738', name: 'Bali',        flag: '🇮🇩', slug: 'bali'         },
  { id: '60844',  name: 'Bruges',      flag: '🇧🇪', slug: 'bruges'       },
  { id: '64162',  name: 'Prague',      flag: '🇨🇿', slug: 'prague'       },
  { id: '66254',  name: 'Madrid',      flag: '🇪🇸', slug: 'madrid'       },
  { id: '60335',  name: 'Vienna',      flag: '🇦🇹', slug: 'vienna'       },
  { id: '28',     name: 'Osaka',       flag: '🇯🇵', slug: 'osaka'        },
  { id: '72420',  name: 'Kyoto',       flag: '🇯🇵', slug: 'kyoto'        },
  { id: '73067',  name: 'Seoul',       flag: '🇰🇷', slug: 'seoul'        },
  // ── Europe 신규
  { id: '71720',  name: 'Naples',          flag: '🇮🇹', slug: 'naples'          },
  { id: '76573',  name: 'Porto',           flag: '🇵🇹', slug: 'porto'           },
  { id: '22',     name: 'Reykjavik',       flag: '🇮🇸', slug: 'reykjavik'       },
  { id: '65870',  name: 'Seville',         flag: '🇪🇸', slug: 'seville'         },
  { id: '64886',  name: 'Hamburg',         flag: '🇩🇪', slug: 'hamburg'         },
  { id: '113',    name: 'Copenhagen',      flag: '🇩🇰', slug: 'copenhagen'      },
  { id: '71428',  name: 'Palermo',         flag: '🇮🇹', slug: 'palermo'         },
  { id: '1638',   name: 'Stockholm',       flag: '🇸🇪', slug: 'stockholm'       },
  { id: '71506',  name: 'Verona',          flag: '🇮🇹', slug: 'verona'          },
  { id: '66770',  name: 'Nice',            flag: '🇫🇷', slug: 'nice'            },
  { id: '71534',  name: 'Turin',           flag: '🇮🇹', slug: 'turin'           },
  { id: '66544',  name: 'Helsinki',        flag: '🇫🇮', slug: 'helsinki'        },
  { id: '71986',  name: 'Bologna',         flag: '🇮🇹', slug: 'bologna'         },
  { id: '485',    name: 'Warsaw',          flag: '🇵🇱', slug: 'warsaw'          },
  { id: '264570', name: 'Rhodes',          flag: '🇬🇷', slug: 'rhodes'          },
  { id: '67101',  name: 'Bordeaux',        flag: '🇫🇷', slug: 'bordeaux'        },
  { id: '64765',  name: 'Cologne',         flag: '🇩🇪', slug: 'cologne'         },
  { id: '73787',  name: 'Valletta',        flag: '🇲🇹', slug: 'valletta'        },
  { id: '65042',  name: 'Dresden',         flag: '🇩🇪', slug: 'dresden'         },
  { id: '60346',  name: 'Salzburg',        flag: '🇦🇹', slug: 'salzburg'        },
  { id: '20',     name: 'Zurich',          flag: '🇨🇭', slug: 'zurich'          },
  { id: '75084',  name: 'Oslo',            flag: '🇳🇴', slug: 'oslo'            },
  { id: '60358',  name: 'Innsbruck',       flag: '🇦🇹', slug: 'innsbruck'       },
  { id: '65702',  name: 'Tallinn',         flag: '🇪🇪', slug: 'tallinn'         },
  { id: '73352',  name: 'Vilnius',         flag: '🇱🇹', slug: 'vilnius'         },
  { id: '62662',  name: 'Lucerne',         flag: '🇨🇭', slug: 'lucerne'         },
  // ── EMEA 신규
  { id: '60013',  name: 'Abu Dhabi',       flag: '🇦🇪', slug: 'abu-dhabi'       },
  { id: '73471',  name: 'Marrakesh',       flag: '🇲🇦', slug: 'marrakesh'       },
  { id: '44',     name: 'Hurghada',        flag: '🇪🇬', slug: 'hurghada'        },
  { id: '65786',  name: 'Luxor',           flag: '🇪🇬', slug: 'luxor'           },
  { id: '76635',  name: 'Doha',            flag: '🇶🇦', slug: 'doha'            },
  // ── Americas 신규
  { id: '82073',  name: 'Las Vegas',       flag: '🇺🇸', slug: 'las-vegas'       },
  { id: '1772',   name: 'San Francisco',   flag: '🇺🇸', slug: 'san-francisco'   },
  { id: '81810',  name: 'Los Angeles',     flag: '🇺🇸', slug: 'los-angeles'     },
  { id: '79868',  name: 'Miami',           flag: '🇺🇸', slug: 'miami'           },
  { id: '80816',  name: 'Chicago',         flag: '🇺🇸', slug: 'chicago'         },
  { id: '62496',  name: 'Vancouver',       flag: '🇨🇦', slug: 'vancouver'       },
  { id: '80874',  name: 'Boston',          flag: '🇺🇸', slug: 'boston'          },
  { id: '109113', name: 'Tulum',           flag: '🇲🇽', slug: 'tulum'           },
  { id: '62492',  name: 'Toronto',         flag: '🇨🇦', slug: 'toronto'         },
  { id: '80162',  name: 'New Orleans',     flag: '🇺🇸', slug: 'new-orleans'     },
  { id: '73927',  name: 'Playa del Carmen',flag: '🇲🇽', slug: 'playa-del-carmen'},
  { id: '79751',  name: 'Washington DC',   flag: '🇺🇸', slug: 'washington-dc'   },
  { id: '60189',  name: 'Buenos Aires',    flag: '🇦🇷', slug: 'buenos-aires'    },
  { id: '25',     name: 'Montreal',        flag: '🇨🇦', slug: 'montreal'        },
  { id: '61535',  name: 'Rio de Janeiro',  flag: '🇧🇷', slug: 'rio-de-janeiro'  },
  { id: '75323',  name: 'Cusco',           flag: '🇵🇪', slug: 'cusco'           },
  // ── APAC 신규
  { id: '60426',  name: 'Melbourne',       flag: '🇦🇺', slug: 'melbourne'       },
  { id: '78451',  name: 'Phuket',          flag: '🇹🇭', slug: 'phuket'          },
  { id: '60466',  name: 'Cairns',          flag: '🇦🇺', slug: 'cairns'          },
  { id: '60442',  name: 'Gold Coast',      flag: '🇦🇺', slug: 'gold-coast'      },
  { id: '272460', name: 'Ho Chi Minh',     flag: '🇻🇳', slug: 'ho-chi-minh'     },
  { id: '74416',  name: 'Kuala Lumpur',    flag: '🇲🇾', slug: 'kuala-lumpur'    },
  { id: '72961',  name: 'Siem Reap',       flag: '🇰🇭', slug: 'siem-reap'       },
  { id: '78479',  name: 'Chiang Mai',      flag: '🇹🇭', slug: 'chiang-mai'      },
  { id: '82689',  name: 'Hanoi',           flag: '🇻🇳', slug: 'hanoi'           },
  { id: '72955',  name: 'Phnom Penh',      flag: '🇰🇭', slug: 'phnom-penh'      },
];

/* City 배경 이미지 (Unsplash) */
const CITY_IMG: Record<string, string> = {
  '67458':  'photo-1513635269975-59663e0ac1ad', // London
  '66746':  'photo-1502602898657-3e91760cbb34', // Paris
  '66342':  'photo-1583422409516-2895a77efded', // Barcelona
  '71631':  'photo-1552832230-c0197dd311b5',    // Rome
  '75061':  'photo-1534351590666-13e3e96b5017', // Amsterdam
  '260932': 'photo-1496442226666-8d4d0e62e6e9', // New York
  '60005':  'photo-1512453979798-5ea266f8880c', // Dubai
  '72181':  'photo-1540959733332-eab4deabeeaf', // Tokyo
  '78125':  'photo-1525625293386-3f8f99389edd', // Singapore
  '79079':  'photo-1524231757912-21f4fe3a7200', // Istanbul
  '71854':  'photo-1541370976299-4d24be63e9d7', // Florence
  '76528':  'photo-1585208798174-6cedd4234ae0', // Lisbon
  '71510':  'photo-1523906834658-6e24ef2386f9', // Venice
  '65144':  'photo-1560969184-10fe8719e047',    // Berlin
  '71749':  'photo-1520175480921-4edfa2983e0f', // Milan
  '46':     'photo-1519197924294-4ba991a11128', // Krakow
  '60400':  'photo-1506973035872-a4ec16b8e8d9', // Sydney
  '99239':  'photo-1555993539-1732b0258235',    // Athens
  '78586':  'photo-1508009603885-50cf7c579365', // Bangkok
  '21':     'photo-1583195763991-f8a6b52de74d', // Edinburgh
  '68616':  'photo-1549918864-48ac28d3be1b',    // Dublin
  '74040':  'photo-1518105779142-d975f22f1b0a', // Mexico City
  '31':     'photo-1595867818082-083862f3d630', // Munich
  '68199':  'photo-1541264643588-4927a7e47e2a', // Budapest
  '60843':  'photo-1491557345352-5929e343eb89', // Brussels
  '82923':  'photo-1580060839134-75a5edca2e99', // Cape Town
  '65792':  'photo-1539650116574-75c0c6d73f6e', // Cairo
  '267738': 'photo-1537996194471-e657df975ab4', // Bali
  '60844':  'photo-1491557345352-5929e343eb89', // Bruges
  '64162':  'photo-1541849546-216549ae216d',    // Prague
  '66254':  'photo-1539037116277-4db20889f2d4', // Madrid
  '60335':  'photo-1516550893923-42d28e5677af', // Vienna
  '28':     'photo-1589308078059-be1415eab4c3', // Osaka
  '72420':  'photo-1528360983277-13d401cdc186', // Kyoto
  '73067':  'photo-1538485399081-7191377e8241', // Seoul
  // ── Europe 신규
  '71720':  'photo-1534445867742-43195f401b6c', // Naples
  '76573':  'photo-1555881400-74d7acaacd8b',    // Porto
  '22':     'photo-1531971589569-0d9370cbe1e5', // Reykjavik
  '65870':  'photo-1509899595012-e9c19cba1d57', // Seville
  '64886':  'photo-1558618047-3c8c96f7d900',    // Hamburg
  '113':    'photo-1513622470522-26c3c8a854bc', // Copenhagen
  '71428':  'photo-1589306969225-8b7f26f5e3c0', // Palermo
  '1638':   'photo-1509356843151-3e7d96241e11', // Stockholm
  '71506':  'photo-1539966975862-1506e91e88c2', // Verona
  '66770':  'photo-1493683803644-0e8d47c5ca69', // Nice
  '71534':  'photo-1574804842743-74dc8f1d11f4', // Turin
  '66544':  'photo-1548690312-e3b507d8c110',    // Helsinki
  '71986':  'photo-1558618666-fcd25c85cd64',    // Bologna
  '485':    'photo-1549144511-f099e773c147',     // Warsaw
  '264570': 'photo-1541364983171-a8ba01e95cfc', // Rhodes
  '67101':  'photo-1576162429-b5c4e62e7e50',    // Bordeaux
  '64765':  'photo-1548248823-ce16a73b6d49',    // Cologne
  '73787':  'photo-1595880576980-b29434a6d98e', // Valletta
  '65042':  'photo-1562547256-2c5ee93b60b7',    // Dresden
  '60346':  'photo-1599982890968-83e0acfbe35b', // Salzburg
  '20':     'photo-1515488042361-ee00e0ddd4e4', // Zurich
  '75084':  'photo-1561015366-b8bc1b35bb1c',    // Oslo
  '60358':  'photo-1507003211169-0a1dd7228f2d', // Innsbruck
  '65702':  'photo-1548602088-9d12a4f9c10e',    // Tallinn
  '73352':  'photo-1554929039-534f8a59e7f6',    // Vilnius
  '62662':  'photo-1586500036706-41963de39e8c', // Lucerne
  // ── EMEA 신규
  '60013':  'photo-1580672850367-a4a84d9cbc38', // Abu Dhabi
  '73471':  'photo-1487222477894-8943e31ef7b2', // Marrakesh
  '44':     'photo-1523805009345-7448845a9e53', // Hurghada
  '65786':  'photo-1547523196-02ab8ebc8fbe',    // Luxor
  '76635':  'photo-1542816417-0983c9c9ad53',    // Doha
  // ── Americas 신규
  '82073':  'photo-1588392382834-a891154bca4d', // Las Vegas
  '1772':   'photo-1506146332389-18140dc7b2fb', // San Francisco
  '81810':  'photo-1543429258-b16fabe1d04e',    // Los Angeles
  '79868':  'photo-1533106418989-88406c7cc8ca', // Miami
  '80816':  'photo-1477959858617-67f85cf4f1df', // Chicago
  '62496':  'photo-1559511260-66a654ae982a',    // Vancouver
  '80874':  'photo-1570197571499-6d9e8e66c0e8', // Boston
  '109113': 'photo-1533862963240-a6dac5ef7b61', // Tulum
  '62492':  'photo-1517090504586-fde19ea6066f', // Toronto
  '80162':  'photo-1577996394613-37a26fc7ba85', // New Orleans
  '73927':  'photo-1552074284-83408e9e5020',    // Playa del Carmen
  '79751':  'photo-1501466044931-62695aada8e9', // Washington DC
  '60189':  'photo-1612294037637-ec328d0e075e', // Buenos Aires
  '25':     'photo-1555883006-0828a1db5814',    // Montreal
  '61535':  'photo-1483729558449-99ef09a8c325', // Rio de Janeiro
  '75323':  'photo-1589557059453-2d5bc0d7fb98', // Cusco
  // ── APAC 신규
  '60426':  'photo-1523482580672-f109ba8cb9be', // Melbourne
  '78451':  'photo-1552685751-74e92c0acb7a',    // Phuket
  '60466':  'photo-1518391846015-55a9cc003b25', // Cairns
  '60442':  'photo-1577696680467-c9fe82c79c41', // Gold Coast
  '272460': 'photo-1583418855642-d0a8bf2f7c64', // Ho Chi Minh
  '74416':  'photo-1596422846543-75c6fc197f07', // Kuala Lumpur
  '72961':  'photo-1552301726-9e19e23a1d99',    // Siem Reap
  '78479':  'photo-1571003123894-1f0594d2b5d9', // Chiang Mai
  '82689':  'photo-1555990881-0d3d3bc0ace1',    // Hanoi
  '72955':  'photo-1594322436404-5a0526db4d13', // Phnom Penh
};

/* 메인 카테고리 6개 (tag_id 기반) */
const MAIN_CATEGORIES = [
  { id: '',     label: 'All',                  icon: '✨' },
  { id: '709',  label: 'Archaeological Sites', icon: '⛏️' },
  { id: '700',  label: 'Art Museums',          icon: '🎨' },
  { id: '1040', label: 'City Tours',           icon: '🗺️' },
  { id: '708',  label: 'Historical Sites',     icon: '🏛️' },
  { id: '702',  label: 'History Museums',      icon: '📜' },
  { id: '710',  label: 'Places of Worship',    icon: '⛪' },
];

/* 전체 카테고리 (모달용) */
const ALL_CATEGORIES = [
  { id: '700',  label: 'Art Museums',               icon: '🎨' },
  { id: '709',  label: 'Archaeological Sites',       icon: '⛏️' },
  { id: '725',  label: 'Botanical Gardens',          icon: '🌿' },
  { id: '705',  label: 'Castles',                    icon: '🏰' },
  { id: '1032', label: 'City Cards & Passes',        icon: '🎫' },
  { id: '1040', label: 'City Tours',                 icon: '🗺️' },
  { id: '1035', label: 'Cruises & Boat Tours',       icon: '🚢' },
  { id: '1042', label: 'Day Trips',                  icon: '🚌' },
  { id: '1034', label: 'Food & Drinks',              icon: '🍽️' },
  { id: '708',  label: 'Historical Sites',           icon: '🏛️' },
  { id: '702',  label: 'History Museums',            icon: '📜' },
  { id: '701',  label: 'Interactive Museums',        icon: '🎭' },
  { id: '706',  label: 'Palaces',                    icon: '👑' },
  { id: '710',  label: 'Places of Worship',          icon: '⛪' },
  { id: '1048', label: 'Public Transport',           icon: '🚇' },
  { id: '1049', label: 'Rentals',                    icon: '🚲' },
  { id: '703',  label: 'Science & Technology',       icon: '🔬' },
  { id: '2596', label: 'Shows & Theatres',           icon: '🎭' },
  { id: '712',  label: 'Theme Parks',                icon: '🎡' },
  { id: '1840', label: 'Transfers',                  icon: '🚖' },
  { id: '2597', label: 'Travel Services',            icon: '✈️' },
  { id: '1942', label: 'Undergrounds',               icon: '🕳️' },
  { id: '1033', label: 'Workshops & Classes',        icon: '🎓' },
  { id: '723',  label: 'Zoos & Safari Parks',        icon: '🦁' },
];

const PAGE_SIZE = 20;

interface TiqetsProduct {
  id: string | number;
  title: string;
  images?: string[];
  price?: number | null;
  display_price?: number | null;
  ratings?: { total: number; average: number } | null;
  promo_label?: string | null;
  instant_ticket_delivery?: boolean | null;
  skip_line?: boolean | null;
  duration?: string | null;
  city_name?: string | null;
  product_url?: string | null;
  cancellation?: { policy?: string; window?: string | null } | string | null;
  tagline?: string | null;
}

function getCancellationLabel(c: TiqetsProduct['cancellation']): string | null {
  if (!c) return null;
  if (typeof c === 'string') return c;
  if (typeof c === 'object' && c.policy) {
    if (c.policy === 'free' || c.policy === 'always') return 'Free cancellation';
    if (c.policy === 'never') return null; // non-refundable, don't display
    return null;
  }
  return null;
}

function getCityFallback(cityId: string) {
  const photo = CITY_IMG[cityId] || 'photo-1502602898657-3e91760cbb34';
  return `https://images.unsplash.com/${photo}?w=800&h=600&fit=crop`;
}

function StarRating({ avg }: { avg: number }) {
  const full = Math.min(5, Math.max(0, Math.round(avg)));
  return (
    <span className="text-amber-400 text-[12px]">
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

function ProductCard({ product, cityId, citySlug }: {
  product: TiqetsProduct;
  cityId: string;
  citySlug: string;
}) {
  const fallback = getCityFallback(cityId);
  const firstImage = product.images && product.images.length > 0 ? product.images[0] : '';
  const [imgSrc, setImgSrc] = useState<string>(firstImage || fallback);
  const detailPath = `/attractions/${citySlug}/${product.id}`;

  return (
    <Link
      href={detailPath}
      className="group bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] hover:shadow-lg hover:border-[#2B7FFF]/30 transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-[16/9] bg-[#E5E7EB] overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc || fallback}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgSrc(fallback)}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.promo_label === 'bestseller' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-[#FF6B35]">🏆 Bestseller</span>
          )}
          {product.skip_line && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-green-500">⚡ Skip Line</span>
          )}
          {product.instant_ticket_delivery && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-[#2B7FFF]">✓ Instant</span>
          )}
        </div>
        {product.city_name && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">
              {product.city_name}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold text-[#171717] leading-[20px] mb-2 line-clamp-2 group-hover:text-[#2B7FFF] transition-colors">
          {product.title}
        </h3>
        <div className="flex flex-col gap-1 mb-3 flex-1">
          {product.ratings && product.ratings.total > 0 && (
            <div className="flex items-center gap-1">
              <StarRating avg={product.ratings.average} />
              <span className="text-[11px] text-[#6B7280]">
                {product.ratings.average.toFixed(1)} ({product.ratings.total.toLocaleString()})
              </span>
            </div>
          )}
          {product.duration && typeof product.duration === 'string' && (
            <p className="text-[12px] text-[#6B7280]">⏱ {product.duration}</p>
          )}
          {getCancellationLabel(product.cancellation) && (
            <p className="text-[12px] text-green-600">↩️ {getCancellationLabel(product.cancellation)}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[14px] font-bold text-[#171717]">
            {(product.price && product.price > 0) ? `From $${Math.round(product.price)}` : 'See prices'}
          </span>
          <span className="flex items-center gap-1 text-[12px] font-semibold text-[#2B7FFF] group-hover:gap-2 transition-all">
            View Details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────
   메인 클라이언트 컴포넌트
───────────────────────────────────────── */
export default function AttractionsClient() {
  const [activeCity, setActiveCity] = useState('67458');
  const [activeCategory, setActiveCategory] = useState(''); // tag_id
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [products, setProducts] = useState<TiqetsProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async (cityId: string, category: string, page: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page_size: String(PAGE_SIZE),
        page: String(page),
      });
      if (cityId) params.set('city_id', cityId);
      if (category) params.set('tag_id', category); // tag_id 기반 필터링

      const res = await fetch(`/api/tiqets/products?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const items: TiqetsProduct[] = data.products || [];
      setProducts(items);
      const total = data.pagination?.total ?? data.total_results ?? data.count ?? items.length;
      setTotalCount(typeof total === 'number' ? total : 0);
      setTotalPages(Math.max(1, Math.ceil((typeof total === 'number' ? total : 0) / PAGE_SIZE)));
    } catch (e) {
      setError('어트랙션을 불러오는데 실패했습니다.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(activeCity, activeCategory, 1);
  }, [activeCity, activeCategory, fetchProducts]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(activeCity, activeCategory, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCityObj = CITIES.find(c => c.id === activeCity) || CITIES[0];
  const allCats = [...MAIN_CATEGORIES, ...ALL_CATEGORIES];
  const activeCatObj = allCats.find(c => c.id === activeCategory) || MAIN_CATEGORIES[0];

  return (
    <>
      {/* ── 히어로 ── */}
      <div className="bg-[#0F172A]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 pt-10 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-[12px] font-bold text-[#2B7FFF] tracking-[1.5px] hover:text-[#60A5FA]">HOME</Link>
            <span className="text-[12px] text-[#475569]">·</span>
            <span className="text-[12px] text-[#475569]">ATTRACTIONS</span>
          </div>
          <h1 className="text-[32px] md:text-[48px] font-extrabold text-white tracking-[-1px] mb-2">
            Attractions & Experiences
          </h1>
          <p className="text-[14px] text-[#94A3B8] mb-6">
            200+ Destinations · Powered by Tiqets — Instant ticket delivery
          </p>
        </div>

        {/* 탭 (히어로 하단) */}
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {MAIN_CATEGORIES.map(cat => (
              <button
                key={cat.id || 'all'}
                onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                className={`flex-shrink-0 px-5 py-3 text-[14px] font-semibold rounded-t-[10px] transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[#F5F7FA] text-[#171717]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky 도시 필터 바 ── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {CITIES.map(city => (
              <button
                key={city.id || 'all'}
                onClick={() => { setActiveCity(city.id); setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all ${
                  activeCity === city.id
                    ? 'bg-[#2B7FFF] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#374151] hover:bg-[#E2E8F0]'
                }`}
              >
                <span className="text-[14px]">{city.flag}</span>
                <span>{city.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 서브카테고리 필터 바 ── */}
      <div className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3 items-center">
            {MAIN_CATEGORIES.map(cat => (
              <button
                key={cat.id || 'all-cat'}
                onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                    : 'bg-white text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="text-[15px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
            {/* 더보기 버튼 */}
            <button
              onClick={() => setShowMoreModal(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-bold border border-dashed border-[#CBD5E1] text-[#64748B] hover:border-[#0F172A] hover:text-[#0F172A] transition-all bg-white"
            >
              More categories
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── More Categories 모달 ── */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMoreModal(false)} />
          {/* modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] sticky top-0 bg-white">
              <h3 className="text-[18px] font-bold text-[#0F172A]">All Categories</h3>
              <button
                onClick={() => setShowMoreModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B] text-[20px] leading-none"
              >×</button>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* All 버튼 */}
              <button
                onClick={() => { setActiveCategory(''); setCurrentPage(1); setShowMoreModal(false); }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold border transition-all ${
                  activeCategory === ''
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-[#F8FAFC] text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'
                }`}
              >
                <span>✨</span> All
              </button>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); setShowMoreModal(false); }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold border transition-all text-left ${
                    activeCategory === cat.id
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-[#F8FAFC] text-[#374151] border-[#E5E7EB] hover:border-[#0F172A]/30 hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span className="flex-shrink-0">{cat.icon}</span>
                  <span className="leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 컨텐츠 영역 ── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-8">
        {/* 상단 정보 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[13px] text-[#6B7280]">
            {!loading && (
              <>
                <span className="font-semibold text-[#171717]">
                  {activeCityObj.flag} {activeCityObj.name}
                </span>
                {activeCategory && (
                  <> · <span className="font-semibold text-[#171717]">{activeCatObj.label}</span></>
                )}
                {totalCount > 0 && (
                  <> · 총 <span className="font-semibold text-[#171717]">{totalCount.toLocaleString()}</span>개</>
                )}
                {totalPages > 1 && (
                  <> · 페이지 <span className="font-semibold text-[#171717]">{currentPage}</span> / {totalPages}</>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <span>Powered by</span>
            <a href="https://www.tiqets.com" target="_blank" rel="noopener noreferrer"
              className="font-bold text-[#E84343] hover:underline">
              Tiqets
            </a>
          </div>
        </div>

        {/* 로딩 스켈레톤 */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] overflow-hidden border border-[#E5E7EB] animate-pulse">
                <div className="aspect-[16/9] bg-[#E5E7EB]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#E5E7EB] rounded w-3/4" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-1/2" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div className="text-center py-20 text-[#EF4444]">{error}</div>
        )}

        {/* 제품 그리드 */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(product => {
              const slug = activeCityObj.slug || cityNameToSlug(product.city_name ?? '');
              return (
                <ProductCard
                  key={String(product.id)}
                  product={product}
                  cityId={activeCity}
                  citySlug={slug}
                />
              );
            })}
          </div>
        )}

        {/* 빈 결과 */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[48px] mb-4">🎟️</p>
            <p className="text-[#374151] font-semibold text-[16px] mb-2">이 도시의 어트랙션이 없습니다</p>
            <p className="text-[#94A3B8] text-[13px]">다른 도시나 카테고리를 선택해보세요</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >«</button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-[8px] text-[13px] font-semibold transition-colors ${
                    p === currentPage
                      ? 'bg-[#2B7FFF] text-white'
                      : 'border border-[#E5E7EB] text-[#374151] hover:bg-[#F1F5F9]'
                  }`}
                >{p}</button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-3 py-2.5 rounded-[10px] border border-[#E5E7EB] text-[12px] font-semibold text-[#374151] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >»</button>
          </div>
        )}
      </div>
    </>
  );
}
