export type Shot = { src: string; caption: string; size: "full" | "half" };
export type Detail = {
  role: string;
  year: string;
  duration: string;
  client: string;
  stack: string[];
  brief: string;
  approach: string;
  result: string;
  gallery: Shot[];
};

/* placeholder gallery: swap the extension and captions when your real images are in */
const shots = (slug: string): Shot[] => [
  { src: `/work/${slug}/01.svg`, caption: "Home page", size: "full" },
  { src: `/work/${slug}/02.svg`, caption: "Detail view", size: "half" },
  { src: `/work/${slug}/03.svg`, caption: "On mobile", size: "half" },
  { src: `/work/${slug}/04.svg`, caption: "Components", size: "full" },
];

export const fallback: Detail = {
  role: "Design and development",
  year: "2026",
  duration: "4 weeks",
  client: "Personal project",
  stack: ["Next.js", "TypeScript"],
  brief: "What the project had to do, and for whom.",
  approach: "How you designed and built it.",
  result: "What changed because of it.",
  gallery: [],
};

const base = (slug: string, over: Partial<Detail>): Detail => ({
  ...fallback,
  gallery: shots(slug),
  ...over,
});

export const details: Record<string, Detail> = {
  point22: {
    role: "Creative direction, UI/UX design & front-end development",
    year: "2026",
    duration: "6 weeks",
    client: "Personal project",
    stack: [
      "Next.js 16.4",
      "React 19",
      "TypeScript",
      "GSAP",
      "Embla Carousel",
      "Lenis",
      "Custom CSS",
      "Next.js Image",
    ],
    brief:
      "Reimagine the traditional photography portfolio as an immersive, experimental digital archive. Point22 explores how photography, motion and interaction can come together to create an experience that feels less like browsing a website and more like stepping inside a photographer's visual world.",
    approach:
      "Built around an infinite, draggable photographic timeline inspired by analogue film. The experience combines monochromatic imagery, an interactive photographic ruler, image-specific timestamps and locations, and custom GSAP transitions that transform photographs into negatives, contact sheets and developed prints. Each photography collection features an editorial project viewer, handwritten storytelling, gesture-based navigation and carefully choreographed motion. A minimal interface keeps the photography at the centre of the experience.",
    result:
      "An unconventional, responsive photography archive featuring 64 photographs across three collections, seamless image-to-image navigation, cinematic darkroom-inspired page transitions and immersive project storytelling. The final experience blends analogue photographic aesthetics with modern interaction design, creating a distinctive digital identity for Point22.",
    gallery: [
      { src: "/work/point22/01.jpg", caption: "The View — photographic collage and editorial homepage", size: "full" },
      { src: "/work/point22/02.jpg", caption: "Timeline — infinite photographic archive with an interactive analogue ruler", size: "half" },
      { src: "/work/point22/03.jpg", caption: "Responsive experience — mobile photography and gesture navigation", size: "half" },
      { src: "/work/point22/04.jpg", caption: "Project viewer — handwritten storytelling, photographic prints and darkroom transitions", size: "full" },
    ],
  },
  "project-two": base("project-two", {}),
  "project-three": base("project-three", {}),
  "project-four": base("project-four", {}),
  "project-five": base("project-five", {}),
};

details["tzaneen-taxi"] = {
  role: "Product design & development",
  year: "2026",
  duration: "Ongoing",
  client: "Things",
  stack: [
    "Next.js 16 (App Router)",
    "React",
    "Node.js 22",
    "Express 5",
    "SQLite (better-sqlite3)",
    "Zod",
    "Playwright",
    "Web Push",
    "SMSPortal (SMS one-time codes)",
    "Ubuntu server with systemd",
  ],
  brief: `Tzaneen Taxi is a ride-hailing web app for Tzaneen, Nkowa-Nkowa and the surrounding villages in Limpopo, South Africa: places the big ride apps don't serve well. It installs on the phone's home screen like a native app.

Riders book a trip now or later, name their price, receive offers from drivers and choose one. They pay in cash or by PayShap. Drivers apply with their documents and car type, and an admin approves them.

The problem was simple: no reliable, fairly priced way to book local transport between villages and town, and no safety net once you're in the car.`,
  approach: `I designed it phone-first for budget Android phones and iPhone Safari. It's a Next.js progressive web app on an Express and SQLite API, so it needed no app stores and runs on one small Ubuntu server.

Pricing uses fixed routes between 20 local areas, with night fares, rounding to the nearest R5 and price bidding between 80% and 300% of the suggested fare. The hardest part was trust under real-world conditions. Double bookings are blocked by SQLite triggers in the database itself, unanswered requests expire automatically, and an SOS button texts emergency contacts a live trip link.

The interface went from a dark theme to a light theme with red and black. Sign-in is number first: one field decides between sign-in and sign-up. Every screen is checked automatically for the notch, home bar and tap sizes on phones from iPhone SE to Pro Max.`,
  result: `The app is live at tzaneenride.co.za. It has phone sign-up with real SMS codes, bookings, offers, live trips, ratings, driver earnings history, emergency contacts with SOS, and an admin panel. Deploys use a one-command script that backs up, builds, health-checks and rolls back on failure.

At the last full test run, it had 229 API tests, 42 unit tests and 594 browser tests passing. A food-ordering add-on (Tisa Dijo) is built but not yet public.`,
  gallery: [
    { src: "/work/tzaneen-taxi/01.jpg", caption: "Welcome, booking and live-trip screens on iPhone", size: "full" },
    { src: "/work/tzaneen-taxi/02.jpg", caption: "Rider home: 'Where to?' with recent places", size: "half" },
    { src: "/work/tzaneen-taxi/03.jpg", caption: "Driver offers: choose your driver and price", size: "half" },
    { src: "/work/tzaneen-taxi/04.jpg", caption: "Admin panel for driver approvals and areas", size: "full" },
  ],
};

details["fresh-goods"] = {
  role: "Product design & direction, built with Claude Code",
  year: "2026",
  duration: "Ongoing",
  client: "Personal project",
  stack: [
    "Next.js 16 (App Router)",
    "React",
    "JavaScript",
    "CSS Modules + design tokens",
    "SQLite (libSQL)",
    "Drizzle ORM",
    "Fuse.js",
    "Vitest",
    "Playwright (WebKit)",
    "sharp",
  ],
  brief: `Fresh Goods is a portfolio grocery e-commerce web app built as a real, working shop in demo mode: made-up products, prices in South African rand, and test-mode payments only. It works on phone, tablet and desktop.

Online grocery shopping often feels cluttered and slow: products are hard to find, there are too many categories, and checkout takes too many steps. My goal was a calm shop where finding food is easy and buying takes as few steps as possible.

Beyond the customer side, the project is designed as a three-sided operation: customers shop, in-store pickers pick and weigh the order, and managers run the store. All three share one database, so a picker's actions show up live on the customer's tracking page.`,
  approach: `I started with a small design system: colour tokens with automated contrast tests, a type scale, and an original logo and mascot ("Mango"). The brand orange failed contrast for small white text (3.1:1), so I added a darker "Orange Ink" (#C53D0F) for readable orange text and kept the bright orange for fills.

Most of the design work was taking things away. I removed product galleries, reviews, tabs, place names and sticky bars. The floating tab bar shows on the home page only. Inner pages get a slim header that shows the cart total. On product pages a "cart capsule" combines Add to cart with a ring that tracks progress toward free delivery.

On the engineering side, each visitor gets a private demo store, created on their first action and shareable to another device with a join code or QR code. Prices are stored as integer cents. Placing an order re-checks prices, stock, slot capacity and promo rules on the server, with an idempotency key against double taps. Hard parts included Next.js 16's instant-navigation rules, a cookie bug that reset demo stores over plain http, and finding licence-safe photos without brand logos.`,
  result: `The customer side works from start to finish: home, typo-tolerant search with South African synonyms (naartjie, avo, boerewors), category filters stored in the URL, simple product pages, cart with promo codes and save-for-later, three-step checkout with 2-hour delivery slots and mock card, wallet and cash payments, then confirmation, live tracking and an orders list.

The catalogue has 62 products. At the last report, 857 automated tests passed, and Playwright end-to-end flows passed on iPhone-sized and desktop screens. The site has not been deployed yet.`,
  gallery: [
    { src: "/work/fresh-goods/01.jpg", caption: "Desktop home: pill header, green hero and deal of the day", size: "full" },
    { src: "/work/fresh-goods/02.jpg", caption: "Product page with the cart capsule and free-delivery ring", size: "half" },
    { src: "/work/fresh-goods/03.jpg", caption: "Mobile search sheet catching a typo", size: "half" },
    { src: "/work/fresh-goods/04.jpg", caption: "Desktop checkout with delivery slots and order summary", size: "full" },
  ],
};

details["the-wellness-app"] = {
  role: "Product owner; built with Claude Code",
  year: "2026",
  duration: "In progress",
  client: "Things",
  stack: [
    "React Native (Expo SDK 58)",
    "TypeScript",
    "expo-router",
    "Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)",
    "PostgreSQL Row Level Security",
    "expo-location + expo-task-manager",
    "AlarmKit (react-native-ios-alarmkit)",
    "Expo Notifications",
    "Jest + React Native Testing Library",
  ],
  brief: `The Wellness App is an all-in-one daily wellness app for weight lifters, runners and walkers in South Africa. Every day you check in (sleep, weight, energy, mood and your plan), train, sleep and take a progress photo called Today's frame.

Training buddies join a crew to keep each other going. The app is built for mid-range Android phones and slow networks, so it saves data and works offline.

The core rule: buddies are only ever compared by % improvement, never by raw kilograms, kilometres or minutes. Someone squatting 60 kg who improves 10% beats someone squatting 140 kg who improves 5%.`,
  approach: `I led the product and made the decisions, and built it with Claude Code as the coding agent: I wrote each brief, reviewed the results and tested in the iOS Simulator. Health data counts as special personal information under POPIA, so it has its own consent step, Row Level Security on every table and database security tests for every feature.

Key decisions: fairness rules lock each week's figures when it ends, so editing old workouts can't change a competition. Move together shares only status and % of a shared goal, never location. Midway I removed buddy chat completely and replaced it with an Activity list with cheers.

Hard parts: time zones and midnight edge cases, so a dedicated test runs every check at ten awkward times. GPS clean-up. And a migration edited after it was pushed, which broke live features; I added a fingerprint guard so pushed migrations can't change again.`,
  result: `Built so far and working in the iOS Simulator: the daily check-in, a weights log with PBs, GPS walk/jog/run with Ghost mode and Move together, a sleep alarm, Today's frame with a timeline and time-lapse, crews with weekly competitions, push notifications, and download/delete my data. It isn't on the App Store or Play Store yet.

At the last full run (9 Nov 2026): 2,191 app tests and 472 database security tests against Supabase, all passing, across 132 commits.`,
  gallery: [
    { src: "/work/the-wellness-app/01.jpg", caption: "Home, Train and Today's frame side by side", size: "full" },
    { src: "/work/the-wellness-app/02.jpg", caption: "Finished run with the route and km splits", size: "half" },
    { src: "/work/the-wellness-app/03.jpg", caption: "Daily check-in: energy and mood step", size: "half" },
    { src: "/work/the-wellness-app/04.jpg", caption: "A crew's weekly board, Activity and Move together lobby", size: "full" },
  ],
};

details["lifely"] = {
  role: "Product lead & design direction (built with Claude Code)",
  year: "2026",
  duration: "In progress",
  client: "Personal project",
  stack: [
    "TypeScript",
    "React Native (Expo SDK 58, Expo Router)",
    "Next.js 16 (App Router)",
    "Supabase (Postgres, Auth, pg_cron)",
    "PostgreSQL row-level security",
    "npm workspaces monorepo",
    "Vitest",
    "Jest (jest-expo)",
    "Playwright",
  ],
  brief: `Lifely ("Healthcare for everyday life") connects patients and South African clinics in one system: an iPhone/Android app for patients and a desktop-first web dashboard for doctors, nurses and reception staff.

The core problem is serving two very different groups at once. Patients need something calm that never overwhelms them; clinicians need dense information they can scan quickly. Both sides share one design system so they never drift apart.

Health data is special personal information under POPIA, so consent, minimal data and strict access rules were part of the product from day one. It was built with made-up demo data only.`,
  approach: `I planned the product and directed the build with Claude Code, one small step at a time, with tests for every feature and every change in git. I approved a token-based design system (Inter, a neon lime accent, soft greys) before any screens were built. An automated test checks every text colour pair against WCAG AA contrast.

Privacy is enforced in the database, not just the UI. Clinical data is stored apart from contact details, so receptionists can book visits without seeing clinical information. Staff only see patients with an active care link and consent; withdrawing consent cuts access immediately. Staff need two-step login, which the database itself checks.

The hard parts were security edge cases: one test run revealed that email sign-ups were still possible despite the setting, and some rules only failed when a test broke them on purpose.`,
  result: `Built so far (with demo data only): patient phone sign-up with separate, never pre-ticked consents, a health profile, dependants and join requests; the provider dashboard with role-based views, care-link requests, working hours, appointment types and a day/week diary. Not deployed or used by real patients.

As of 10 November 2026: 725 automated tests passing plus 40 live tests against the development database. In a concurrency test, 10 bookings for the same slot sent at once resulted in exactly one being accepted.`,
  gallery: [
    { src: "/work/lifely/01.jpg", caption: "Provider dashboard: patient detail with risk and trend first", size: "full" },
    { src: "/work/lifely/02.jpg", caption: "Patient app home with status cards", size: "half" },
    { src: "/work/lifely/03.jpg", caption: "Booking confirmation with visit preparation checklist", size: "half" },
    { src: "/work/lifely/04.jpg", caption: "Appointments diary for reception staff", size: "full" },
  ],
};
