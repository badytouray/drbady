// Fallback content used when Supabase is not configured (or a request fails).
// Mirrors the seed data in supabase/schema.sql.

export const seedSettings = {
  phone: '+44 7533 780033',
  whatsapp: '447533780033',
  email: 'hello@drbady.com',
  location: 'UK & The Gambia',
  hero_title_1: 'One Creative Mind.',
  hero_title_2: 'Multiple Solutions.',
  hero_subtitle:
    'Digital products, business services and training that solve real problems, create opportunities and help people and businesses grow in the UK, The Gambia and beyond.',
  mobile_hero_title_1: 'From Ideas to Real-World',
  mobile_hero_title_2: 'Solutions.',
  mobile_hero_subtitle:
    'Digital products, business services, branding and training for individuals, businesses and communities.',
  hero_image: '/branding/illustrative_founder.png',
  cta_title: "Let's Build Something Together.",
  cta_subtitle: "Have an idea, project or business challenge? Let's talk and turn it into a plan.",
  about_title: 'About Dr Bady',
  about_text:
    'Dr Bady is a creative entrepreneur building digital products, brands and businesses across the UK and The Gambia.\n\nFrom car marketplaces to venue security reporting, from brand identities to hands-on masterclasses, the goal is always the same: turn ideas into real-world solutions that help people and communities grow.',
  about_image: '/branding/illustrative_founder.png',
}

export const seedProducts = [
  {
    id: 'p1', slug: 'motor-gambia', title: 'Motor Gambia',
    short_description: 'Buy, sell, rent and export cars in The Gambia.',
    tagline: "The Gambia's biggest car marketplace.",
    cover_image: '/images/motor_gambia.png', icon: 'Car', accent: '#E5322D', features: [],
    links: [
      { label: 'Buy a Car', icon: 'Tag', url: 'https://motorgambia.com' },
      { label: 'Sell Your Car (Keep 100%)', icon: 'CirclePlus', url: 'https://motorgambia.com' },
      { label: 'Rent a Car', icon: 'Car', url: 'https://motorgambia.com' },
      { label: 'Export from the UK', icon: 'Ship', url: 'https://motorgambia.com' },
      { label: 'Car Servicing', icon: 'Wrench', url: 'https://motorgambia.com' },
    ],
    cta_label: 'Visit MotorGambia.com', cta_icon: 'ExternalLink', cta_url: 'https://motorgambia.com',
    sort_order: 1, published: true,
  },
  {
    id: 'p2', slug: 'security-reports', title: 'Security Reports',
    short_description: 'Incident & door refusal reporting for venues.',
    tagline: 'Incident & door refusal reporting for venues and events.',
    cover_image: '/images/security_reports.png', icon: 'ShieldCheck', accent: '#1E73E8',
    features: ['Fast, consistent reports', 'Capture photos and evidence', 'Live dashboard and insights', 'Supports licensing & compliance'],
    links: [], cta_label: 'View Live Demo', cta_icon: 'ExternalLink', cta_url: '#',
    sort_order: 2, published: true,
  },
  {
    id: 'p3', slug: 'creative-mindset', title: 'Creative Mindset',
    short_description: 'Masterclasses to build skills, brands and businesses.',
    tagline: 'Workshops and masterclasses to build your skills, brand and business.',
    cover_image: '/images/creative_mindset.png', icon: 'GraduationCap', accent: '#F5A300',
    features: ['Spot opportunities', 'Build and brand your idea', 'Design and promote', '7-day action planning'],
    links: [], cta_label: 'Join a Workshop', cta_icon: 'CalendarDays', cta_url: '/academy',
    sort_order: 3, published: true,
  },
  {
    id: 'p4', slug: 'business-showroom', title: 'Business Showroom',
    short_description: 'Ready-made websites, brand setups and business ideas.',
    tagline: 'Ready-made websites, brand setups and business ideas you can launch fast.',
    cover_image: '/images/creative_workspace.png', icon: 'Store', accent: '#8B2BE2',
    features: ['Ready-made websites', 'Complete brand setups', 'Proven business ideas', 'Launch support'],
    links: [], cta_label: 'Browse the Showroom', cta_icon: 'ExternalLink', cta_url: '#',
    sort_order: 4, published: true,
  },
]

export const seedServices = [
  { id: 's1', slug: 'web-app-development', title: 'Web & App Development', short_title: 'Web Development', short_description: 'Websites, apps and MVPs.', icon: 'Laptop', features: ['Business websites', 'Web & mobile apps', 'MVPs for startups', 'Hosting & maintenance'], sort_order: 1, published: true },
  { id: 's2', slug: 'branding-design', title: 'Branding & Design', short_title: 'Branding & Design', short_description: 'Logos, visuals and brand kits.', icon: 'Palette', features: ['Logo design', 'Brand identity kits', 'Social media visuals', 'Packaging & signage'], sort_order: 2, published: true },
  { id: 's3', slug: 'printing-merchandise', title: 'Printing & Merchandise', short_title: 'Printing & Merchandise', short_description: 'T-shirts, flyers, banners and more.', icon: 'Printer', features: ['Branded clothing', 'Flyers & posters', 'Banners & roll-ups', 'Business cards'], sort_order: 3, published: true },
  { id: 's4', slug: 'marketing-promotion', title: 'Marketing & Promotion', short_title: 'Marketing & Promotion', short_description: 'Campaigns, content and growth.', icon: 'Megaphone', features: ['Social media campaigns', 'Content creation', 'Paid ads', 'Launch promotion'], sort_order: 4, published: true },
  { id: 's5', slug: 'business-consulting', title: 'Business Consulting', short_title: 'Business Consulting', short_description: 'Ideas, planning and setup support.', icon: 'BriefcaseBusiness', features: ['Idea validation', 'Business planning', 'Company setup', 'Growth strategy'], sort_order: 5, published: true },
  { id: 's6', slug: 'training-workshops', title: 'Training & Workshops', short_title: 'Training & Workshops', short_description: 'Hands-on sessions for teams and communities.', icon: 'UsersRound', features: ['Masterclasses', 'Team training', 'Community workshops', '1-to-1 mentoring'], sort_order: 6, published: true },
]

export const seedPrograms = [
  { id: 'a1', slug: 'creative-mindset-masterclass', title: 'Creative Mindset Masterclass', kind: 'Masterclass', short_description: 'Spot opportunities, build and brand your idea, and leave with a 7-day action plan.', cover_image: '/images/creative_mindset.png', start_date: null, duration: '1 day', location: 'Online & in person', price: 'Free', outcomes: ['Spot opportunities', 'Build and brand your idea', 'Design and promote', '7-day action planning'], sort_order: 1, published: true },
  { id: 'a2', slug: 'brand-your-business', title: 'Brand Your Business', kind: 'Workshop', short_description: 'Hands-on workshop to create a logo, colours and a simple brand kit for your business.', cover_image: '/images/creative_workspace.png', start_date: null, duration: 'Half day', location: 'Online', price: '£29', outcomes: ['Logo & colour basics', 'Brand kit you can use', 'Social media templates'], sort_order: 2, published: true },
]

export const seedFaqs = [
  { id: 'f1', question: 'How do I book a chat?', answer: 'Use the Book a Chat button or message on WhatsApp. Pick a topic and a time that suits you and we will confirm.', sort_order: 1, published: true },
  { id: 'f2', question: 'Do you work with clients outside the UK?', answer: 'Yes. Most work is delivered remotely across the UK, The Gambia and beyond.', sort_order: 2, published: true },
  { id: 'f3', question: 'How much does a website cost?', answer: 'It depends on what you need. Book a free chat and you will get a clear quote and plan.', sort_order: 3, published: true },
]
