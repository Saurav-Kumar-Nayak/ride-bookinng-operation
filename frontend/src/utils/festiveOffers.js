// Festive & Holiday Dynamic Offers Engine for RideX (Uber-Realistic 5% - 10% Rates)
export function getCurrentFestiveData() {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 7 = Aug, 8 = Sept, 9 = Oct, 10 = Nov, 11 = Dec

  let festivalName = '🪔 Durga Puja & Festive Special Season 🪔';
  let festiveOffers = [
    { code: 'PUJA2026', disc: '5% OFF (Up to ₹30)', min: '₹100', expiry: 'Puja Special', color: '#fbbf24' },
    { code: 'DURGAPASS', disc: '10% OFF Pandal Rides', min: '₹120', expiry: 'Limited Offer', color: '#00edff' },
    { code: 'HOLIDAYX', disc: '8% OFF Weekend Trip', min: '₹100', expiry: 'Valid All Week', color: '#34d399' }
  ];

  let festiveNotifications = [];

  // 1. Durga Puja & Dussehra Season (Aug, Sept, Oct)
  if (month >= 7 && month <= 9) {
    festivalName = '🪔 Durga Puja & Dussehra Special Offers 🪔';
    festiveOffers = [
      { code: 'PUJA2026', disc: '5% OFF (Up to ₹30)', min: '₹100', expiry: 'Puja Special', color: '#fbbf24' },
      { code: 'DURGAPASS', disc: '10% OFF Pandal Rides', min: '₹120', expiry: 'Limited Offer', color: '#00edff' },
      { code: 'NAVYATRA', disc: '8% OFF Auto Rides', min: '₹60', expiry: 'Festive Special', color: '#34d399' }
    ];
    festiveNotifications = [
      {
        id: 'puja_1',
        title: '🪔 DURGA PUJA FESTIVE PASS ACTIVE',
        time: 'Just now',
        tag: 'PUJA SPECIAL',
        color: '#fbbf24',
        border: 'rgba(251, 191, 36, 0.4)',
        desc: 'Celebrate Durga Puja with RideX! Use code PUJA2026 for 5% OFF on all pandal hopping & city trips.'
      },
      {
        id: 'puja_2',
        title: '🛺 10% OFF PANDAL HOPPING RIDES',
        time: '10 mins ago',
        tag: 'PUJA OFFER',
        color: '#00edff',
        border: 'rgba(0, 237, 255, 0.4)',
        desc: 'Enjoy seamless Pandal hopping across Bhubaneswar & Cuttack with 10% OFF using promo code DURGAPASS.'
      }
    ];
  } 
  // 2. Diwali Season (Nov)
  else if (month === 10) {
    festivalName = '🪔 Happy Diwali Special Offers 🪔';
    festiveOffers = [
      { code: 'DIWALI10', disc: '10% OFF (Up to ₹40)', min: '₹150', expiry: 'Diwali Week', color: '#fbbf24' },
      { code: 'LIGHTSFEST', disc: '5% OFF Evening Rides', min: '₹100', expiry: 'Festive Special', color: '#a855f7' }
    ];
    festiveNotifications = [
      {
        id: 'diwali_1',
        title: '🪔 HAPPY DIWALI FESTIVE OFFER',
        time: 'Just now',
        tag: 'DIWALI OFFER',
        color: '#fbbf24',
        border: 'rgba(251, 191, 36, 0.4)',
        desc: 'Light up your celebrations! Use code DIWALI10 for 10% OFF on all family & festive rides.'
      }
    ];
  }
  // 3. New Year & Christmas Season (Dec, Jan)
  else if (month === 11 || month === 0) {
    festivalName = '🎄 New Year & Christmas Celebration 🎆';
    festiveOffers = [
      { code: 'NEWYEAR2026', disc: '10% OFF Party Rides', min: '₹150', expiry: 'Jan 5', color: '#38bdf8' },
      { code: 'XMASGIFT', disc: '5% OFF Winter Rides', min: '₹100', expiry: 'Dec 31', color: '#ef4444' }
    ];
    festiveNotifications = [
      {
        id: 'ny_1',
        title: '🎆 NEW YEAR FESTIVE PASS ACTIVE',
        time: 'Just now',
        tag: 'NEW YEAR 2026',
        color: '#38bdf8',
        border: 'rgba(56, 189, 248, 0.4)',
        desc: 'Welcome 2026! Use code NEWYEAR2026 for 10% OFF late-night party & event rides.'
      }
    ];
  }

  // Base System Notifications
  const notificationsList = [
    ...festiveNotifications,
    {
      id: 'priority_1',
      title: '🚗 PRIORITY DRIVER DISPATCH',
      time: '15 mins ago',
      tag: 'VIP RIDER',
      color: '#34d399',
      border: 'rgba(52, 211, 153, 0.3)',
      desc: 'Driver matching speed boosted by 2x for your account in Bhubaneswar.'
    },
    {
      id: 'safety_1',
      title: '🛡️ SAFETY SHIELD ACTIVE',
      time: '1 hr ago',
      tag: 'SAFETY 24/7',
      color: '#fbbf24',
      border: 'rgba(251, 191, 36, 0.3)',
      desc: '24/7 Live GPS tracking & SOS emergency protection active for all holiday rides.'
    }
  ];

  return { festivalName, festiveOffers, notificationsList };
}
