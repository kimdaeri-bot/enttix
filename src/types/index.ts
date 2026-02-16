// Tixstock API types
export interface Venue {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postcode: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

export interface Performer {
  id: string;
  name: string;
}

export interface TixstockEvent {
  id: string;
  name: string;
  currency: string;
  datetime: string;
  status: string;
  map_url: string;
  venue: Venue;
  performers: Performer[];
  categories: { id: string; name: string }[];
  listings?: Listing[];
}

export interface Listing {
  id: string;
  seller_id: number;
  seller_name: string;
  ticket: {
    general_admission: string;
    type: string;
    allow_last_minute_sales: string;
    split_type: string;
    etickets: string[];
    upload_later: string;
    instant_download: string;
  };
  event: TixstockEvent;
  seat_details: {
    category: string;
    section: string;
    row: string;
    seat: string;
  };
  quantity: {
    available: number;
    sold: number;
    display_quantity?: number;
  };
  pricing: {
    proceed_price: number;
    face_value: number;
    currency: string;
  };
  restrictions_benefits: string[];
}

export interface HoldResponse {
  data: { quantity_available: number };
  meta: {
    mode: string;
    type: string;
    hold_id: string;
    quantity: number;
    request_id: string;
  };
  message: string;
}

// App types
export interface Match {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  venue: Venue;
  leagueId: string;
  leagueName: string;
  startingPrice: number;
  currency: string;
  ticketsLeft: number;
  image?: string;
}

export interface League {
  id: string;
  name: string;
  slug: string;
  eventCount: number;
  image: string;
}

export interface City {
  name: string;
  slug: string;
  eventCount: number;
  image: string;
}

export interface CartItem {
  listingId: string;
  eventId: string;
  eventName: string;
  section: string;
  row: string;
  quantity: number;
  pricePerTicket: number;
  currency: string;
  ticketType: string;
  holdId?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
}

export interface Order {
  id: string;
  eventName: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Commissionable' | 'Cancelled';
  total: number;
  currency: string;
  tickets: number;
}
