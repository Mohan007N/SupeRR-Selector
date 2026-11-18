// SYNTHETIC identities. Every player, team and nation below is invented for demo
// purposes. None of these names or numbers refers to a real person or real results.

export const IPL_TEAMS = [
  { code: 'MRK', name: 'Marina Kings' },
  { code: 'DCH', name: 'Deccan Hawks' },
  { code: 'SCR', name: 'Steel City Riders' },
  { code: 'NRL', name: 'Northern Lions' },
  { code: 'LKR', name: 'Lakeside Royals' },
  { code: 'HBT', name: 'Harbor Titans' },
  { code: 'SRV', name: 'Sunrise Vipers' },
  { code: 'WKN', name: 'Western Knights' },
]

export const T20I_TEAMS = [
  { code: 'AUR', name: 'Aurelia' },
  { code: 'BOR', name: 'Borealis' },
  { code: 'CAL', name: 'Calderon' },
  { code: 'DUN', name: 'Dunmere' },
  { code: 'EAS', name: 'Eastmarch' },
  { code: 'FEN', name: 'Fenwick' },
]

// matchShare (optional) = share of team matches the player features in.
// Low values create deliberately small samples to demonstrate low-confidence rows.
export const BATTER_DEFS = [
  { id: 'b01', name: 'Aarav Menon', teams: { IPL: 'MRK' } },
  { id: 'b02', name: 'Kabir Sandhu', teams: { IPL: 'DCH' } },
  { id: 'b03', name: 'Rudra Kulkarni', teams: { IPL: 'SCR' } },
  { id: 'b04', name: 'Tejas Varghese', teams: { IPL: 'NRL' } },
  { id: 'b05', name: 'Nikhil Bhandari', teams: { IPL: 'LKR' } },
  { id: 'b06', name: 'Siddharth Rao', teams: { IPL: 'HBT' } },
  { id: 'b07', name: 'Harsh Pillai', teams: { IPL: 'SRV' } },
  { id: 'b08', name: 'Yash Chauhan', teams: { IPL: 'WKN' } },
  { id: 'b09', name: 'Arnav Desai', teams: { IPL: 'MRK' } },
  { id: 'b10', name: 'Ranveer Joshi', teams: { IPL: 'DCH' } },
  { id: 'b11', name: 'Liam Hartley', teams: { T20I: 'AUR' } },
  { id: 'b12', name: 'Noah Whitcombe', teams: { T20I: 'BOR' } },
  { id: 'b13', name: 'Ethan Marlowe', teams: { T20I: 'CAL' } },
  { id: 'b14', name: 'Declan Ashby', teams: { T20I: 'DUN' } },
  { id: 'b15', name: 'Samar Qureshi', teams: { T20I: 'EAS' } },
  { id: 'b16', name: 'Mihir Ghosh', teams: { T20I: 'FEN' } },
  { id: 'b17', name: 'Owen Treadwell', teams: { T20I: 'AUR' } },
  { id: 'b18', name: 'Zayan Farouk', teams: { T20I: 'BOR' } },
  { id: 'b19', name: 'Lakshya Nambiar', teams: { IPL: 'SCR', T20I: 'CAL' } },
  { id: 'b20', name: 'Pranav Seshadri', teams: { IPL: 'NRL', T20I: 'AUR' } },
  { id: 'b21', name: 'Utkarsh Bedi', teams: { IPL: 'LKR', T20I: 'FEN' } },
  { id: 'b22', name: 'Jai Malhotra', teams: { IPL: 'HBT', T20I: 'DUN' } },
  { id: 'b23', name: 'Varun Anand', teams: { IPL: 'SRV', T20I: 'EAS' } },
  { id: 'b24', name: 'Omkar Phadke', teams: { IPL: 'WKN' }, matchShare: 0.18 },
  { id: 'b25', name: 'Tanmay Rege', teams: { IPL: 'DCH' }, matchShare: 0.2 },
  { id: 'b26', name: 'Callum Pryor', teams: { T20I: 'CAL' }, matchShare: 0.22 },
]

export const BOWLER_DEFS = [
  { id: 'w01', name: 'Dev Ramanathan', teams: { IPL: 'MRK' } },
  { id: 'w02', name: 'Neel Chandran', teams: { IPL: 'DCH' } },
  { id: 'w03', name: 'Sahil Bhatnagar', teams: { IPL: 'SCR' } },
  { id: 'w04', name: 'Ayaan Kapadia', teams: { IPL: 'NRL' } },
  { id: 'w05', name: 'Kunal Shenoy', teams: { IPL: 'LKR' } },
  { id: 'w06', name: 'Vihaan Tiwari', teams: { IPL: 'HBT' } },
  { id: 'w07', name: 'Gautam Rane', teams: { IPL: 'SRV' } },
  { id: 'w08', name: 'Aditya Kamath', teams: { IPL: 'WKN' } },
  { id: 'w09', name: 'Ishwar Gadre', teams: { IPL: 'MRK' } },
  { id: 'w10', name: 'Parth Lokhande', teams: { IPL: 'DCH' } },
  { id: 'w11', name: 'Reuben Callister', teams: { T20I: 'AUR' } },
  { id: 'w12', name: 'Tobias Fenner', teams: { T20I: 'BOR' } },
  { id: 'w13', name: 'Alistair Penhaligon', teams: { T20I: 'CAL' } },
  { id: 'w14', name: 'Jonas Whitlock', teams: { T20I: 'DUN' } },
  { id: 'w15', name: 'Idris Kamara', teams: { T20I: 'EAS' } },
  { id: 'w16', name: 'Mateo Brandt', teams: { T20I: 'FEN' } },
  { id: 'w17', name: 'Hugo Linden', teams: { T20I: 'AUR' } },
  { id: 'w18', name: 'Farhan Dastur', teams: { IPL: 'SCR', T20I: 'BOR' } },
  { id: 'w19', name: 'Anirudh Pai', teams: { IPL: 'NRL', T20I: 'CAL' } },
  { id: 'w20', name: 'Zubin Merchant', teams: { IPL: 'LKR', T20I: 'EAS' } },
  { id: 'w21', name: 'Eshan Wagle', teams: { IPL: 'HBT' }, matchShare: 0.2 },
  { id: 'w22', name: 'Bastian Holm', teams: { T20I: 'FEN' }, matchShare: 0.22 },
]
