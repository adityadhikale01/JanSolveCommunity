import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { ENV } from '../config/env.js';
import {
  User,
  Challenge,
  Comment,
  Vote,
  Bookmark,
  Notification,
  Conversation,
  Message,
  ContentReport,
  AuditLog,
} from '../models/index.js';
import { downloadAllOfflineAssets } from '../../scripts/download-offline-images.js';

const seedData = async () => {
  try {
    console.log('[Seed] Step 1: Checking and ensuring offline media assets on local disk...');
    await downloadAllOfflineAssets();

    console.log('[Seed] Step 2: Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Step 3: Preparing database collections...');

    // 1. Create or update Administrator
    const adminEmail = ENV.ADMIN_EMAIL.toLowerCase();
    let admin = await User.findOne({ email: adminEmail });
    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash(ENV.ADMIN_PASSWORD, adminSalt);

    if (!admin) {
      admin = await User.create({
        name: ENV.ADMIN_NAME,
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
        location: 'Ranchi, Jharkhand',
        bio: 'Official JanSolve Civic Administrator & Community Moderator for Jharkhand.',
        accountStatus: 'active',
        avatar: '/uploads/avatar-admin.jpg',
      });
      console.log(`[Seed] Created Administrator: ${admin.email}`);
    } else {
      admin.passwordHash = adminPasswordHash;
      admin.role = 'admin';
      admin.accountStatus = 'active';
      admin.avatar = '/uploads/avatar-admin.jpg';
      await admin.save();
      console.log(`[Seed] Updated Administrator credentials: ${admin.email}`);
    }

    // 2. Create 7 Authentic Jharkhand Citizen Accounts
    const citizenSeedAccounts = [
      {
        name: 'Pooja Marandi',
        email: 'pooja.marandi@example.com',
        location: 'Dumka, Jharkhand',
        bio: 'Grassroots tribal youth activist and community volunteer in Santhal Pargana.',
        avatar: '/uploads/avatar-pooja.jpg',
      },
      {
        name: 'Amit Kumar Soren',
        email: 'amit.soren@example.com',
        location: 'Jamshedpur, East Singhbhum',
        bio: 'Environmental engineering researcher at NIT Jamshedpur focusing on industrial air & water quality.',
        avatar: '/uploads/avatar-amit.jpg',
      },
      {
        name: 'Dr. Sunita Murmu',
        email: 'sunita.murmu@example.com',
        location: 'Khunti, Jharkhand',
        bio: 'Public health physician working on sickle cell anemia and maternal nutrition in rural clusters.',
        avatar: '/uploads/avatar-sunita.jpg',
      },
      {
        name: 'Rameshwar Mahato',
        email: 'rameshwar.mahato@example.com',
        location: 'Ormanjhi, Ranchi',
        bio: 'Smallholder organic tomato and vegetable farmer advocating for sustainable irrigation.',
        avatar: '/uploads/avatar-rameshwar.jpg',
      },
      {
        name: 'Birsa Oraon',
        email: 'birsa.oraon@example.com',
        location: 'Kisko, Lohardaga',
        bio: 'Rural development volunteer and president of the Bauxite Belt Forest Conservation Samiti.',
        avatar: '/uploads/avatar-birsa.jpg',
      },
      {
        name: 'Shabana Parveen',
        email: 'shabana.parveen@example.com',
        location: 'Jharia, Dhanbad',
        bio: 'Civil rights paralegal and clean air campaigner for families displaced by mining subsidence.',
        avatar: '/uploads/avatar-shabana.jpg',
      },
      {
        name: 'Anil Kumar Hansda',
        email: 'anil.hansda@example.com',
        location: 'Barhi, Hazaribagh',
        bio: 'Rural connectivity advocate and cooperative society secretary in North Chotanagpur.',
        avatar: '/uploads/avatar-anil.jpg',
      },
    ];

    const citizenUsers = [];
    const citizenPasswordHash = await bcrypt.hash('CitizenPass@123', 10);

    for (const c of citizenSeedAccounts) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        user = await User.create({
          ...c,
          passwordHash: citizenPasswordHash,
          role: 'user',
          accountStatus: 'active',
        });
        console.log(`[Seed] Created citizen: ${user.name} (${user.email})`);
      } else {
        user.avatar = c.avatar;
        user.bio = c.bio;
        user.location = c.location;
        await user.save();
      }
      citizenUsers.push(user);
    }

    // 3. Minimum 24 Rich Civic Challenges across All 12 Domains in Jharkhand
    const sampleChallenges = [
      // 1. Water Resources - Sahibganj
      {
        title: 'Severe Groundwater Arsenic Levels in Drinking Wells Along Sahibganj Floodplains',
        description: 'Villagers across Rajmahal and Udhwa blocks in Sahibganj report chronic skin pigmentation, keratosis, and fatigue. Water quality tests conducted on local community handpumps indicate arsenic levels exceeding 110 ppb, well above the BIS permissible limit of 10 ppb. Safe potable water filtration units are urgently required.',
        category: 'Water Resources',
        urgency: 'critical',
        locationText: 'Rajmahal and Udhwa floodplains, Sahibganj, Jharkhand',
        coordinates: { type: 'Point', coordinates: [87.84, 25.05] },
        affectedPeople: '12,000+ villagers across 8 panchayats',
        duration: 'Persisting over 3 years',
        evidence: [
          {
            url: '/uploads/arsenic-handpump-sahibganj.jpg',
            fileType: 'image',
            originalName: 'arsenic-handpump-sahibganj.jpg',
          },
        ],
        author: citizenUsers[0]._id, // Pooja
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
        voteScore: 52,
        upvotesCount: 54,
        downvotesCount: 2,
        commentCount: 4,
      },

      // 2. Agriculture - Ranchi
      {
        title: 'Rapid Viral Leaf Curl Outbreak Decimating Smallholder Tomato Fields in Ormanjhi Belt',
        description: 'Smallholder vegetable farmers in Kanke and Ormanjhi blocks are facing an aggressive upward leaf curl and stunting epidemic in tomato crops 40 days post-transplantation. Whitefly vectors are multiplying rapidly due to unseasonal heat. Losses are exceeding 65% for marginal farmers who lack diagnostic support and resistant bio-inputs.',
        category: 'Agriculture',
        urgency: 'high',
        locationText: 'Ormanjhi and Kanke Agricultural Clusters, Ranchi, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.33, 23.48] },
        affectedPeople: '850+ marginal farming families',
        duration: 'Spreading rapidly over last 4 weeks',
        evidence: [
          {
            url: '/uploads/Crop diseas 2.jpg',
            fileType: 'image',
            originalName: 'tomato-leaf-curl.jpg',
          },
        ],
        author: citizenUsers[3]._id, // Rameshwar
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        voteScore: 41,
        upvotesCount: 42,
        downvotesCount: 1,
        commentCount: 3,
      },

      // 3. Sanitation - East Singhbhum (with Video & Photo evidence)
      {
        title: 'Hazardous Solid Waste Dumping and Drainage Blockage near Sakchi Commercial Hub',
        description: 'Unregulated municipal waste and plastic packaging overflow into the storm drains adjacent to Sakchi market and Subarnarekha canal. During monsoon spells, contaminated water backs up into residential lanes, generating acute stench and breeding dengue vectors. Continuous community monitoring and decentralized collection bins are needed.',
        category: 'Sanitation',
        urgency: 'high',
        locationText: 'Sakchi Market & Subarnarekha Link, Jamshedpur, East Singhbhum',
        coordinates: { type: 'Point', coordinates: [86.20, 22.80] },
        affectedPeople: '25,000+ daily visitors and market residents',
        duration: 'Ongoing for 6 months',
        evidence: [
          {
            url: '/uploads/waste-dump-sakchi.jpg',
            fileType: 'image',
            originalName: 'waste-dump-sakchi.jpg',
          },
          {
            url: '/uploads/waste-sakchi.mp4',
            fileType: 'video',
            originalName: 'waste-sakchi.mp4',
          },
        ],
        author: citizenUsers[1]._id, // Amit
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        voteScore: 37,
        upvotesCount: 38,
        downvotesCount: 1,
        commentCount: 2,
      },

      // 4. Healthcare - Khunti
      {
        title: 'Lack of Point-of-Care Sickle Cell & Anemia Diagnostic Kits in Torpa Primary Health Centre',
        description: 'Munda and Oraon tribal mothers and infants visiting the Torpa community health center currently face 3-week turnaround delays for basic hemoglobinopathy electrophoresis. Children presenting with acute joint crises cannot receive immediate hydroxyurea management because diagnostic screening cannot be done on-site.',
        category: 'Healthcare',
        urgency: 'critical',
        locationText: 'Torpa Block Primary Health Centre, Khunti, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.28, 23.08] },
        affectedPeople: 'Over 4,500 tribal women and children',
        duration: 'Chronic infrastructure deficit',
        evidence: [
          {
            url: '/uploads/phc-clinic-khunti.jpg',
            fileType: 'image',
            originalName: 'phc-clinic-khunti.jpg',
          },
        ],
        author: citizenUsers[2]._id, // Dr. Sunita
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        voteScore: 68,
        upvotesCount: 68,
        downvotesCount: 0,
        commentCount: 5,
      },

      // 5. Environment - Dhanbad
      {
        title: 'Severe Coal Dust Inhalation & Respiratory Distress in Jharia Residential Enclaves',
        description: 'Fugitive dust plumes from open-cast mining haul roads and smoldering subsurface coal fires in Lodna and Bastacolla create particulate matter PM2.5 concentrations exceeding 300 ug/m3 in school zones. Teachers report chronic asthma and bronchitis among primary school children, with no continuous air quality monitoring installed.',
        category: 'Environment',
        urgency: 'critical',
        locationText: 'Lodna & Bastacolla coal belt, Jharia, Dhanbad, Jharkhand',
        coordinates: { type: 'Point', coordinates: [86.41, 23.74] },
        affectedPeople: '18,000+ residents living in mine periphery',
        duration: 'Over 2 years',
        evidence: [
          {
            url: '/uploads/coal-dust-jharia.jpg',
            fileType: 'image',
            originalName: 'coal-dust-jharia.jpg',
          },
        ],
        author: citizenUsers[5]._id, // Shabana
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        voteScore: 59,
        upvotesCount: 60,
        downvotesCount: 1,
        commentCount: 4,
      },

      // 6. Energy - Latehar
      {
        title: 'Unfinished Solar Mini-Grid Leaving 3 Remote Hamlets Without Evening Light in Latehar',
        description: 'Solar micro-grid poles and distribution lines erected in 2024 in Saryu forest block remain unenergized due to disconnected battery inverter racks. Children are forced to study under kerosene lanterns and wild elephant warnings cannot be signaled after dark.',
        category: 'Energy',
        urgency: 'medium',
        locationText: 'Saryu & Garu forest belt, Latehar, Jharkhand',
        coordinates: { type: 'Point', coordinates: [84.34, 23.63] },
        affectedPeople: '360 forest-dwelling households',
        duration: '14 months since installation stopped',
        evidence: [
          {
            url: '/uploads/solar-grid-latehar.jpg',
            fileType: 'image',
            originalName: 'solar-grid-latehar.jpg',
          },
        ],
        author: citizenUsers[0]._id, // Pooja
        reviewStatus: 'information_requested',
        publicationStatus: 'pending_review',
        reviewNote: 'Please provide exact hamlet names and contact details of the panchayat mukhiya.',
        voteScore: 0,
        commentCount: 0,
      },

      // 7. Infrastructure - Hazaribagh
      {
        title: 'Collapsed Culvert and Submerged Earthen Embankment Cut Off 4 Panchayats in Barhi',
        description: 'The heavy monsoon flood waters of the Barakar tributary breached the masonry culvert between Padma and Barhi. Over 8,000 residents, including school students and vegetable transport carts, must take an unsafe 18-kilometer detour through muddy forest tracts. Immediate bailey bridge installation is needed.',
        category: 'Infrastructure',
        urgency: 'high',
        locationText: 'Padma-Barhi Rural Connector, Hazaribagh, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.42, 24.30] },
        affectedPeople: '8,000+ villagers in Barhi block',
        duration: '7 weeks since embankment collapse',
        evidence: [
          {
            url: '/uploads/broken-bridge-barhi.jpg',
            fileType: 'image',
            originalName: 'broken-bridge-barhi.jpg',
          },
        ],
        author: citizenUsers[6]._id, // Anil
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        voteScore: 33,
        upvotesCount: 34,
        downvotesCount: 1,
        commentCount: 2,
      },

      // 8. Education - Dumka
      {
        title: 'Dilapidated Asbestos Roof and Water Leakage in Upgraded Middle School Shikaripara',
        description: 'Two classrooms in the Shikaripara government middle school have crumbling asbestos ceilings and waterlogging after heavy rain. More than 140 Santhal tribal students are forced to share a single dry room, and wet electrical switchboards present safety hazards during classes.',
        category: 'Education',
        urgency: 'high',
        locationText: 'Government Middle School, Shikaripara, Dumka, Jharkhand',
        coordinates: { type: 'Point', coordinates: [87.55, 24.22] },
        affectedPeople: '140 primary and middle school students',
        duration: 'Ongoing for entire monsoon season',
        evidence: [
          {
            url: '/uploads/school-leak-dumka.jpg',
            fileType: 'image',
            originalName: 'school-leak-dumka.jpg',
          },
        ],
        author: citizenUsers[0]._id, // Pooja
        reviewStatus: 'under_review',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        voteScore: 28,
        upvotesCount: 28,
        downvotesCount: 0,
        commentCount: 2,
      },

      // 9. Rural Livelihoods - Saraikela Kharsawan
      {
        title: 'Lack of Climate-Controlled Cocoon Storage Stifling Kuchai Organic Tussar Silk Weavers',
        description: 'Over 600 tribal women rearers in Kuchai suffer recurring losses of up to 40% of their silkworm pupae due to unseasonal heat waves and humidity fluctuations. A decentralized solar-powered temperature-controlled grainage and cocoon storage facility is urgently needed to safeguard raw silk yields.',
        category: 'Rural Livelihoods',
        urgency: 'medium',
        locationText: 'Kuchai Silk Weaving Belt, Saraikela Kharsawan, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.96, 22.75] },
        affectedPeople: '600+ tribal tussar silk artisan households',
        duration: 'Persisting for 2 harvest cycles',
        evidence: [
          {
            url: '/uploads/tussar-silk-kuchai.jpg',
            fileType: 'image',
            originalName: 'tussar-silk-kuchai.jpg',
          },
        ],
        author: citizenUsers[1]._id, // Amit
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        voteScore: 45,
        upvotesCount: 46,
        downvotesCount: 1,
        commentCount: 3,
      },

      // 10. Public Services - Palamu
      {
        title: 'Chronic Biometric Authentication Failures Depriving Pensioners at PDS Ration Outlets',
        description: 'Elderly widows and disabled pensioners in Chainpur block face repeated biometric scanner failures and erratic 4G connectivity at Fair Price Shops. Over 400 vulnerable families have missed two consecutive months of subsidized grain distribution due to rigid e-PoS device mandates without offline OTP alternatives.',
        category: 'Public Services',
        urgency: 'high',
        locationText: 'Chainpur and Daltonganj Rural PDS Centers, Palamu, Jharkhand',
        coordinates: { type: 'Point', coordinates: [84.07, 24.04] },
        affectedPeople: '400+ elderly pensioners and grain cardholders',
        duration: 'Last 2 consecutive quota cycles',
        evidence: [
          {
            url: '/uploads/pds-ration-palamu.jpg',
            fileType: 'image',
            originalName: 'pds-ration-palamu.jpg',
          },
        ],
        author: citizenUsers[4]._id, // Birsa
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        voteScore: 36,
        upvotesCount: 37,
        downvotesCount: 1,
        commentCount: 2,
      },

      // 11. Accessibility - Bokaro
      {
        title: 'Absence of Wheelchair Ramps and Tactile Paving at Chas Sub-Divisional Hospital & Bus Stand',
        description: 'Persons with physical disabilities and visually impaired citizens cannot independently access the outpatient department or public transit at Chas junction. Steep stairs without handrails and obstructed footpaths force persons with disabilities onto heavy-traffic arterial roads.',
        category: 'Accessibility',
        urgency: 'medium',
        locationText: 'Chas Sub-Divisional Hospital & Bus Junction, Bokaro, Jharkhand',
        coordinates: { type: 'Point', coordinates: [86.17, 23.63] },
        affectedPeople: '1,200+ disabled citizens and elderly patients',
        duration: 'Continuous structural barrier',
        evidence: [
          {
            url: '/uploads/accessibility-chas.jpg',
            fileType: 'image',
            originalName: 'accessibility-chas.jpg',
          },
        ],
        author: citizenUsers[5]._id, // Shabana
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
        voteScore: 29,
        upvotesCount: 30,
        downvotesCount: 1,
        commentCount: 2,
      },

      // 12. Water Resources - Deoghar
      {
        title: 'Depleted Summer Water Table and Fluoride Contamination in Madhupur Borewells',
        description: 'Deep drilling by commercial brick kilns has caused groundwater levels to plummet from 60 feet to below 220 feet in rural Madhupur. Recent community lab tests show fluoride concentrations of 2.8 mg/L, resulting in skeletal fluorosis symptoms and dental discoloration among children in 5 wards.',
        category: 'Water Resources',
        urgency: 'critical',
        locationText: 'Madhupur Sub-Division, Deoghar, Jharkhand',
        coordinates: { type: 'Point', coordinates: [86.65, 24.25] },
        affectedPeople: '7,500 residents across Madhupur rural belt',
        duration: 'Worsened over the past 2 dry seasons',
        evidence: [
          {
            url: '/uploads/dry-borewell-deoghar.jpg',
            fileType: 'image',
            originalName: 'dry-borewell-deoghar.jpg',
          },
        ],
        author: citizenUsers[0]._id, // Pooja
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        voteScore: 47,
        upvotesCount: 48,
        downvotesCount: 1,
        commentCount: 3,
      },

      // 13. Agriculture - Giridih
      {
        title: 'Wild Boar and Elephant Herd Crop Raiding Destroying Maize and Paddy Harvests in Tisri',
        description: 'Marginal farmers bordering the Parasnath sanctuary forests are losing entire seasonal maize and upland paddy crops to nocturnal foraging by wild elephant herds and boar. Villagers lack solar-powered non-lethal fence energizers and early warning acoustic alarms.',
        category: 'Agriculture',
        urgency: 'high',
        locationText: 'Tisri and Lokai Forest Fringe Panchayats, Giridih, Jharkhand',
        coordinates: { type: 'Point', coordinates: [86.06, 24.57] },
        affectedPeople: '500+ tribal farming households',
        duration: 'Annual post-monsoon surge',
        evidence: [
          {
            url: '/uploads/crop-damage-giridih.jpg',
            fileType: 'image',
            originalName: 'crop-damage-giridih.jpg',
          },
        ],
        author: citizenUsers[6]._id, // Anil
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        voteScore: 38,
        upvotesCount: 39,
        downvotesCount: 1,
        commentCount: 3,
      },

      // 14. Healthcare - West Singhbhum
      {
        title: 'Acute Antivenom Shortage and Delayed Transport for Snakebite Emergencies in Saranda',
        description: 'During the wet season, Russell viper and krait bites surge in remote iron-ore fringe villages inside Saranda forest. The Manoharpur community hospital frequently runs out of polyvalent anti-snake venom vials, forcing patients onto 3-hour motorbike journeys to Chaibasa during which fatalities occur.',
        category: 'Healthcare',
        urgency: 'critical',
        locationText: 'Manoharpur and Chiriya Forest Belt, West Singhbhum, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.20, 22.38] },
        affectedPeople: 'Over 15,000 forest fringe dwellers',
        duration: 'Critical seasonal spike every monsoon',
        evidence: [
          {
            url: '/uploads/snakebite-clinic-chaibasa.jpg',
            fileType: 'image',
            originalName: 'snakebite-clinic-chaibasa.jpg',
          },
        ],
        author: citizenUsers[2]._id, // Dr. Sunita
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        voteScore: 73,
        upvotesCount: 75,
        downvotesCount: 2,
        commentCount: 6,
      },

      // 15. Sanitation - Ramgarh
      {
        title: 'Overflowing Septic Tanks and Non-Functional Community Toilets at Gola Weekly Haat',
        description: 'The Gola rural market attracts over 10,000 farmers and traders every Wednesday. The public sanitation block constructed under SBM has remained locked and abandoned for 8 months due to overflowing cesspools and no piped water connection, leading to widespread open defecation.',
        category: 'Sanitation',
        urgency: 'medium',
        locationText: 'Gola Market Ground & Bus Stop, Ramgarh, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.71, 23.53] },
        affectedPeople: '10,000+ weekly market vendors and shoppers',
        duration: '8 months of total disuse',
        evidence: [
          {
            url: '/uploads/toilet-sanitation-ramgarh.jpg',
            fileType: 'image',
            originalName: 'toilet-sanitation-ramgarh.jpg',
          },
        ],
        author: citizenUsers[3]._id, // Rameshwar
        reviewStatus: 'under_review',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        voteScore: 22,
        upvotesCount: 23,
        downvotesCount: 1,
        commentCount: 1,
      },

      // 16. Environment - Bokaro / Ramgarh
      {
        title: 'Untreated Coal Washery Slurry Discharges Blackening the Upper Damodar River',
        description: 'Direct discharge of black coal tailings and slurry from local washeries into the Damodar riverbed between Rajrappa and Bokaro has turned the water toxic. Downstream villages relying on the river for bathing and cattle are experiencing skin dermatitis and aquatic life die-offs.',
        category: 'Environment',
        urgency: 'critical',
        locationText: 'Upper Damodar Basin near Rajrappa, Ramgarh, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.71, 23.63] },
        affectedPeople: '30,000+ riparian villagers along 40 km river stretch',
        duration: 'Chronic industrial discharge',
        evidence: [
          {
            url: '/uploads/polluted-river-damodar.jpg',
            fileType: 'image',
            originalName: 'polluted-river-damodar.jpg',
          },
        ],
        author: citizenUsers[1]._id, // Amit
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
        voteScore: 64,
        upvotesCount: 65,
        downvotesCount: 1,
        commentCount: 4,
      },

      // 17. Infrastructure - Godda
      {
        title: 'Dangerous Crater-Sized Potholes Causing Daily Overturned Vehicles on Mahagama Link',
        description: 'Overladen coal and fly-ash freight trucks have completely fractured the 12-kilometer rural road linking Mahagama to the district highway. Ambulances refuse to enter the corridor during nighttime, and three school-van breakdowns occurred in the past fortnight.',
        category: 'Infrastructure',
        urgency: 'high',
        locationText: 'Mahagama District Link Road, Godda, Jharkhand',
        coordinates: { type: 'Point', coordinates: [87.28, 25.02] },
        affectedPeople: '14,000 commuters across 11 villages',
        duration: 'Past 10 months without routine resurfacing',
        evidence: [
          {
            url: '/uploads/pothole-road-godda.jpg',
            fileType: 'image',
            originalName: 'pothole-road-godda.jpg',
          },
        ],
        author: citizenUsers[0]._id, // Pooja
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        voteScore: 35,
        upvotesCount: 36,
        downvotesCount: 1,
        commentCount: 2,
      },

      // 18. Education - Simdega
      {
        title: 'Complete Lack of Science Laboratory Equipment and Digital Learning in Bano High School',
        description: 'The only senior secondary school serving 16 tribal hamlets in Bano has had an empty science lab room for 4 years with no microscope, reagents, or electrical fittings. Class 11 and 12 students are unable to conduct mandatory practicals for board exams.',
        category: 'Education',
        urgency: 'medium',
        locationText: 'Government High School, Bano Block, Simdega, Jharkhand',
        coordinates: { type: 'Point', coordinates: [84.97, 22.68] },
        affectedPeople: '320 tribal senior secondary students',
        duration: '4 academic sessions',
        evidence: [
          {
            url: '/uploads/science-lab-simdega.jpg',
            fileType: 'image',
            originalName: 'science-lab-simdega.jpg',
          },
        ],
        author: citizenUsers[4]._id, // Birsa
        reviewStatus: 'under_review',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        voteScore: 21,
        upvotesCount: 21,
        downvotesCount: 0,
        commentCount: 1,
      },

      // 19. Energy - Garhwa
      {
        title: 'Burnt 100 kVA Transformer Left Unrepaired for 70 Days in Bhandaria Agricultural Belt',
        description: 'The main distribution transformer powering 28 electric borewell pump sets in Bhandaria burned out during a lightning strike in July. With no response from the sub-station, over 150 acres of kharif paddy seedbeds are parched and dying under erratic rainfall.',
        category: 'Energy',
        urgency: 'high',
        locationText: 'Bhandaria Agricultural Cluster, Garhwa, Jharkhand',
        coordinates: { type: 'Point', coordinates: [83.82, 23.75] },
        affectedPeople: '90 farming families and 150 acres of arable land',
        duration: '70 continuous days without power',
        evidence: [
          {
            url: '/uploads/burnt-transformer-garhwa.jpg',
            fileType: 'image',
            originalName: 'burnt-transformer-garhwa.jpg',
          },
        ],
        author: citizenUsers[4]._id, // Birsa
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        voteScore: 31,
        upvotesCount: 32,
        downvotesCount: 1,
        commentCount: 2,
      },

      // 20. Rural Livelihoods - Pakur
      {
        title: 'Lack of Direct Market Access and Processing Units for Paharia Lac Growers in Litipara',
        description: 'Primitive Paharia tribal families harvest wild Rangini lac from Ber and Palash trees but are forced to sell raw unrefined sticklac to exploitative middlemen at 40% below Minimum Support Price (MSP). A local primary processing unit and collection depot would triple tribal household incomes.',
        category: 'Rural Livelihoods',
        urgency: 'medium',
        locationText: 'Litipara Hill Tracts, Pakur, Jharkhand',
        coordinates: { type: 'Point', coordinates: [87.62, 24.68] },
        affectedPeople: '1,100 Paharia tribal families',
        duration: 'Longstanding market disadvantage',
        evidence: [
          {
            url: '/uploads/lac-cultivation-pakur.jpg',
            fileType: 'image',
            originalName: 'lac-cultivation-pakur.jpg',
          },
        ],
        author: citizenUsers[0]._id, // Pooja
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        voteScore: 40,
        upvotesCount: 40,
        downvotesCount: 0,
        commentCount: 2,
      },

      // 21. Public Services - Lohardaga
      {
        title: 'Dysfunctional Street Lighting and Delayed Emergency Services on Kisko Ghat Road',
        description: 'The 9-kilometer switchback ghat road connecting Kisko valley to Lohardaga district headquarters lacks functioning solar street lighting and reflective guard rails. Heavy bauxite transport tippers operate at night, resulting in frequent fatal collisions and stranded rural commuters.',
        category: 'Public Services',
        urgency: 'medium',
        locationText: 'Kisko Valley Ghat Section, Lohardaga, Jharkhand',
        coordinates: { type: 'Point', coordinates: [84.62, 23.58] },
        affectedPeople: '5,000+ daily commuter trips',
        duration: 'Over 1 year of recurring night accidents',
        evidence: [
          {
            url: '/uploads/ghat-road-lohardaga.jpg',
            fileType: 'image',
            originalName: 'ghat-road-lohardaga.jpg',
          },
        ],
        author: citizenUsers[4]._id, // Birsa
        reviewStatus: 'under_review',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        voteScore: 26,
        upvotesCount: 27,
        downvotesCount: 1,
        commentCount: 2,
      },

      // 22. Other - Jamtara
      {
        title: 'Need for Community Digital Literacy Center to Counter Fraud Stigmatization in Narayanpur',
        description: 'Educated rural youth in Narayanpur and Karmatanr lack legitimate IT coaching and cyber-security awareness centers. Establishing an authorized digital literacy and youth skills hub is essential to channel local youth into legitimate digital livelihoods.',
        category: 'Other',
        urgency: 'low',
        locationText: 'Narayanpur Community Hall, Jamtara, Jharkhand',
        coordinates: { type: 'Point', coordinates: [86.95, 24.03] },
        affectedPeople: '1,500 rural youth seeking employment',
        duration: 'Persisting lack of accredited training',
        evidence: [
          {
            url: '/uploads/digital-literacy-jamtara.jpg',
            fileType: 'image',
            originalName: 'digital-literacy-jamtara.jpg',
          },
        ],
        author: citizenUsers[5]._id, // Shabana
        reviewStatus: 'under_review',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        voteScore: 18,
        upvotesCount: 19,
        downvotesCount: 1,
        commentCount: 1,
      },

      // 23. Accessibility - Ranchi (Pending Review example)
      {
        title: 'Broken Pedestrian Escalators and Encroached Footpaths at Ranchi Railway Station Approach',
        description: 'The main pedestrian overpass and escalators at Ranchi Junction station have been non-functional for 5 months. Senior citizens, pregnant women, and travelers carrying luggage must navigate broken concrete steps amidst dense vehicular congestion on Station Road.',
        category: 'Accessibility',
        urgency: 'medium',
        locationText: 'Ranchi Junction Station Road, Ranchi, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.34, 23.35] },
        affectedPeople: '30,000+ daily railway passengers',
        duration: '5 continuous months',
        evidence: [
          {
            url: '/uploads/pedestrian-overpass-ranchi.jpg',
            fileType: 'image',
            originalName: 'pedestrian-overpass-ranchi.jpg',
          },
        ],
        author: citizenUsers[3]._id, // Rameshwar
        reviewStatus: 'submitted',
        publicationStatus: 'pending_review',
        voteScore: 0,
        commentCount: 0,
      },

      // 24. Healthcare - Koderma
      {
        title: 'Widespread Silicosis and Tuberculosis Screening Deficit Among Mica Flake Sorters',
        description: 'Thousands of informal women and youth laborers working in dry mica crushing and screening sheds around Jhumri Telaiya suffer from severe chronic silicosis. The local CHC has no digital chest X-ray unit or pulmonologist, leading to misdiagnosis as common bronchitis.',
        category: 'Healthcare',
        urgency: 'critical',
        locationText: 'Jhumri Telaiya & Dhab Mining Periphery, Koderma, Jharkhand',
        coordinates: { type: 'Point', coordinates: [85.53, 24.43] },
        affectedPeople: '6,000+ mica processing workers and families',
        duration: 'Occupational health crisis persisting for decades',
        evidence: [
          {
            url: '/uploads/silicosis-screening-koderma.jpg',
            fileType: 'image',
            originalName: 'silicosis-screening-koderma.jpg',
          },
        ],
        author: citizenUsers[6]._id, // Anil
        reviewStatus: 'verified',
        publicationStatus: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        voteScore: 57,
        upvotesCount: 58,
        downvotesCount: 1,
        commentCount: 3,
      },
    ];

    console.log(`[Seed] Step 4: Upserting ${sampleChallenges.length} challenges...`);
    const insertedChallenges = [];
    for (const c of sampleChallenges) {
      let challenge = await Challenge.findOne({ title: c.title });
      if (!challenge) {
        challenge = await Challenge.create(c);
        console.log(`  ✓ Inserted challenge: "${challenge.title.slice(0, 50)}..." [${challenge.category}]`);
      } else {
        // Update evidence and coordinates to ensure offline asset paths are current
        challenge.evidence = c.evidence;
        challenge.category = c.category;
        challenge.urgency = c.urgency;
        challenge.locationText = c.locationText;
        challenge.coordinates = c.coordinates;
        challenge.affectedPeople = c.affectedPeople;
        challenge.duration = c.duration;
        challenge.reviewStatus = c.reviewStatus;
        challenge.publicationStatus = c.publicationStatus;
        challenge.voteScore = c.voteScore;
        challenge.upvotesCount = c.upvotesCount;
        challenge.downvotesCount = c.downvotesCount;
        challenge.commentCount = c.commentCount;
        await challenge.save();
      }
      insertedChallenges.push(challenge);
    }

    // 4. Sample Comments on Published Challenges
    console.log('[Seed] Step 5: Seeding realistic community comments and replies...');
    const publishedChallenges = insertedChallenges.filter(
      (ch) => ch.publicationStatus === 'published'
    );

    // Comments on Challenge 0 (Sahibganj Arsenic)
    const chArsenic = publishedChallenges[0];
    const arsenicCommentsCount = await Comment.countDocuments({ challenge: chArsenic._id });
    if (arsenicCommentsCount === 0) {
      const c1 = await Comment.create({
        challenge: chArsenic._id,
        author: citizenUsers[1]._id, // Amit (NIT student)
        body: 'We conducted field tests in Udhwa with low-cost activated alumina filters last month. They were able to reduce arsenic down to 8 ppb. We should coordinate with the district Jal Jeevan Mission engineers.',
      });

      const c2 = await Comment.create({
        challenge: chArsenic._id,
        author: citizenUsers[2]._id, // Dr. Sunita
        parentComment: c1._id,
        body: 'Seconding this! As healthcare workers, we are diagnosing dermal keratosis weekly. Clean drinking water is the primary prophylactic requirement.',
      });

      const c3 = await Comment.create({
        challenge: chArsenic._id,
        author: citizenUsers[3]._id, // Rameshwar
        body: 'Are the local schools also connected to these deep handpumps? Students might be drinking this unfiltered.',
      });

      const c4 = await Comment.create({
        challenge: chArsenic._id,
        author: citizenUsers[0]._id, // Pooja
        parentComment: c3._id,
        body: 'Yes, both the primary school and anganwadi share this handpump. We have submitted a formal memo to the BDO.',
      });
      console.log(`  ✓ Seeded 4 comments on Sahibganj challenge.`);
    }

    // Comments on Challenge 3 (Sickle Cell - Khunti)
    const chSickle = publishedChallenges[3];
    const sickleCommentsCount = await Comment.countDocuments({ challenge: chSickle._id });
    if (sickleCommentsCount === 0) {
      const c1 = await Comment.create({
        challenge: chSickle._id,
        author: citizenUsers[0]._id, // Pooja
        body: 'Thank you Dr. Sunita for raising this. We have seen young boys collapsing during football practice due to sudden splenic sequestration.',
      });

      const c2 = await Comment.create({
        challenge: chSickle._id,
        author: citizenUsers[4]._id, // Birsa
        body: 'We can organize community mobilization camps through the Gram Sabha if the health department provides portable solubility test kits.',
      });
      console.log(`  ✓ Seeded comments on Khunti Sickle Cell challenge.`);
    }

    // Comments on Challenge 4 (Jharia Coal Dust)
    const chJharia = publishedChallenges[4];
    const jhariaCommentsCount = await Comment.countDocuments({ challenge: chJharia._id });
    if (jhariaCommentsCount === 0) {
      const c1 = await Comment.create({
        challenge: chJharia._id,
        author: citizenUsers[1]._id, // Amit
        body: 'Continuous water sprinkling is legally mandated under MOEF guidelines for haul roads. BCCL must be held accountable for operating uncovered dumper trucks.',
      });

      const c2 = await Comment.create({
        challenge: chJharia._id,
        author: citizenUsers[5]._id, // Shabana
        parentComment: c1._id,
        body: 'We have compiled video footage of dry loading at Lodna. Filing an application with the state pollution board tomorrow.',
      });
      console.log(`  ✓ Seeded comments on Jharia Coal Dust challenge.`);
    }

    // 5. Seed Votes so citizens' votes show active on feed
    console.log('[Seed] Step 6: Seeding citizen vote records...');
    for (let i = 0; i < Math.min(10, publishedChallenges.length); i++) {
      const ch = publishedChallenges[i];
      // Amit upvoted
      await Vote.findOneAndUpdate(
        { user: citizenUsers[1]._id, challenge: ch._id },
        { value: 1 },
        { upsert: true }
      );
      // Dr. Sunita upvoted
      await Vote.findOneAndUpdate(
        { user: citizenUsers[2]._id, challenge: ch._id },
        { value: 1 },
        { upsert: true }
      );
    }

    // 6. Seed Bookmarks for User 1 (Amit) & User 2 (Dr. Sunita)
    console.log('[Seed] Step 7: Seeding user bookmarks...');
    for (let i = 0; i < 3; i++) {
      const ch = publishedChallenges[i];
      await Bookmark.findOneAndUpdate(
        { user: citizenUsers[1]._id, challenge: ch._id },
        {},
        { upsert: true }
      );
    }

    // 7. Seed Notifications for Author (Pooja)
    console.log('[Seed] Step 8: Seeding notifications...');
    const notifCount = await Notification.countDocuments({ recipient: citizenUsers[0]._id });
    if (notifCount === 0) {
      await Notification.create({
        recipient: citizenUsers[0]._id,
        actor: citizenUsers[1]._id,
        type: 'comment',
        entityType: 'challenge',
        entityId: chArsenic._id,
        message: 'Amit Kumar Soren commented on your challenge "Severe Groundwater Arsenic Levels in Drinking Wells Along Sahibganj Floodplains"',
      });

      await Notification.create({
        recipient: citizenUsers[0]._id,
        actor: admin._id,
        type: 'challenge_verified',
        entityType: 'challenge',
        entityId: chArsenic._id,
        message: 'Your challenge "Severe Groundwater Arsenic Levels in Drinking Wells Along Sahibganj Floodplains" has been verified by the JanSolve Administration!',
      });
    }

    // 8. Seed sample conversations between citizens
    console.log('[Seed] Step 9: Seeding sample direct conversations...');
    const existingConv = await Conversation.findOne({
      participants: { $all: [citizenUsers[0]._id, citizenUsers[1]._id] },
    });

    if (!existingConv) {
      const conv = await Conversation.create({
        participants: [citizenUsers[0]._id, citizenUsers[1]._id],
        lastMessageText: 'Hello Amit! Can you share the contact of the water testing lab in Jamshedpur?',
        lastMessageAt: new Date(),
        lastSender: citizenUsers[0]._id,
      });

      await Message.create({
        conversation: conv._id,
        sender: citizenUsers[0]._id,
        body: 'Hello Amit! Can you share the contact of the water testing lab in Jamshedpur?',
      });

      await Message.create({
        conversation: conv._id,
        sender: citizenUsers[1]._id,
        body: 'Hi Pooja! Yes, the CSIR-NML environmental laboratory in Burmamines accepts community samples. I will email you their test requisition form.',
      });
      console.log('  ✓ Created sample direct messaging thread.');
    }

    // 9. Seed Administrative Audit Logs
    console.log('[Seed] Step 10: Seeding admin audit logs...');
    const auditCount = await AuditLog.countDocuments({ actor: admin._id });
    if (auditCount === 0) {
      await AuditLog.create({
        actor: admin._id,
        action: 'CHALLENGE_APPROVED',
        targetType: 'Challenge',
        targetId: chArsenic._id,
        metadata: {
          note: 'Public health crisis with lab-verified arsenic levels. Approved for immediate JanFeed publication.',
        },
      });

      await AuditLog.create({
        actor: admin._id,
        action: 'CHALLENGE_VERIFIED',
        targetType: 'Challenge',
        targetId: chArsenic._id,
        metadata: {
          note: 'Field verification corroborated by PHE division Rajmahal.',
        },
      });
    }

    console.log('===========================================================');
    console.log('  DATABASE SEEDING COMPLETED SUCCESSFULLY!                ');
    console.log(`  Total Challenges Seeded: ${sampleChallenges.length} across all domains`);
    console.log(`  All media assets stored locally in: backend/uploads/   `);
    console.log('===========================================================');
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seedData();
