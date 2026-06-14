import fs   from "fs";
import path from "path";

const FILE    = path.join(process.cwd(), "data", "content.json");
const KV_KEY  = "hilhi_content";

// ── Supports both @vercel/kv vars AND @upstash/redis (Upstash marketplace) vars ──
const getRedisUrl   = () => process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const getRedisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const hasKV         = () => !!(getRedisUrl() && getRedisToken());

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: getRedisUrl(), token: getRedisToken() });
}
async function kvGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  return redis.get<T>(key);
}
async function kvSet(key: string, value: unknown): Promise<void> {
  const redis = await getRedis();
  await redis.set(key, value);
}

// ── Interfaces ────────────────────────────────────────────────────────────
export interface CampItem {
  id:          string;
  title:       string;
  date:        string;
  description: string;
  imageUrl:    string;
  price:       string;
  enabled:     boolean;
}

export interface Coach {
  id:       string;
  name:     string;
  title:    string;
  bio:      string;
  imageUrl: string;
  email?:   string;
  roster?:  string[];
}

export interface CoachStat {
  value: string;
  label: string;
}

export interface FeaturedCoach {
  name:     string;
  title:    string;
  photo:    string;
  bioParas: string[];
  stats:    CoachStat[];
}

export interface VideoItem {
  id:          string;
  title:       string;
  description: string;
  type:        "video" | "stream";
  url:         string;
  thumbnail:   string;
  date:        string;
  enabled:     boolean;
  isLive:      boolean;
}

export interface MerchProduct {
  id:       string;
  name:     string;
  price:    number;
  cat:      string;
  imageUrl: string;
}

export interface ProgramCard {
  id:        string;
  icon:      string;
  title:     string;
  subtitle:  string;
  desc:      string;
  tag:       string;
  link:      string;
  highlight: boolean;
}

export interface TryoutSession {
  id:    string;
  label: string;
  time:  string;
}

export interface SiteContent {
  /* ── Navbar ── */
  navbar: {
    siteName:    string;
    tagline:     string;
    showTryouts: boolean;
  };
  /* ── Home page ── */
  home: {
    heroBadge:    string;
    heroTitle:    string;
    heroSubtitle: string;
    heroImageUrl: string;
    statsYears:   string;
    statsKids:    string;
    statsCoaches: string;
    aboutBadge:   string;
    aboutTitle:   string;
    aboutText:    string;
    aboutImageUrl:string;
    programCards: ProgramCard[];
    quoteText:    string;
    quoteAuthor:  string;
    quoteRole:    string;
    donateUrl:    string;
  };
  /* ── Contact section ── */
  contact: {
    email:     string;
    phone:     string;
    address:   string;
    facebook:  string;
    instagram: string;
    youtube:   string;
    tiktok:    string;
    twitter:   string;
  };
  /* ── Events / Camps page ── */
  camps: {
    pageTitle:    string;
    pageSubtitle: string;
    items:        CampItem[];
  };
  /* ── Tryout page ── */
  tryout: {
    enabled:          boolean;
    title:            string;
    subtitle:         string;
    imageUrl:         string;
    location:         string;
    address:          string;
    gradeLevels:      string;
    gender:           string;
    sessions:         TryoutSession[];
    aboutText:        string;
    financialNote:    string;
    price:            number;
    serviceFee:       number;
    registrationOpen: boolean;
  };
  /* ── Coaches ── */
  youthCoaches: { intro: string; coaches: Coach[]; };
  hsCoaches: {
    intro:         string;
    coaches:       Coach[];
    featuredCoach: FeaturedCoach;
  };
  /* ── Film Room (private, password-protected) ── */
  videoRoom: {
    password:      string;
    coachPassword: string;
    title:         string;
    subtitle:      string;
    videos:        VideoItem[];
  };
  /* ── Merch page ── */
  merch: {
    pageTitle:        string;
    pageSubtitle:     string;
    announcementText: string;
    showAnnouncement: boolean;
    products:         MerchProduct[];
  };
}

// ── Defaults ──────────────────────────────────────────────────────────────
export const DEFAULTS: SiteContent = {
  navbar: {
    siteName:    "HILHI",
    tagline:     "Youth Basketball",
    showTryouts: true,
  },
  home: {
    heroBadge:     "Hillsboro Youth Basketball",
    heroTitle:     "Building Champions On and Off the Court",
    heroSubtitle:  "Where Hillsboro's youth develop skills, character, and a love for the game.",
    heroImageUrl:  "",
    statsYears:    "5+",
    statsKids:     "100+",
    statsCoaches:  "20+",
    aboutBadge:    "Our Mission",
    aboutTitle:    "About Hilhi Youth Basketball",
    aboutText:     "",
    aboutImageUrl: "",
    programCards: [
      { id:"prog-1", icon:"👥", title:"Youth Teams",    subtitle:"All Skill Levels",      desc:"Structured teams for youth players at every level. Learn fundamentals, compete in leagues, and grow as a player and teammate.", tag:"Ages 5–14",      link:"/join",      highlight:true  },
      { id:"prog-2", icon:"📅", title:"Events & Camps", subtitle:"Register Today",         desc:"Stay up to date with all youth camps, league games, practice schedules, and important events throughout the season.",          tag:"Camp Open!",   link:"/events",    highlight:false },
      { id:"prog-3", icon:"⭐", title:"HS Calendar",    subtitle:"High School Events",     desc:"High school basketball events, tryouts, and elite training opportunities for advanced players looking to compete at the next level.", tag:"High School", link:"https://www.hilhiyouthbbx.com/hs-calender", highlight:false },
      { id:"prog-4", icon:"🛒", title:"Merchandise",    subtitle:"Official Gear",          desc:"Rep your team with official Hilhi Youth Basketball apparel. New arrivals available — jerseys, hoodies, and more.",             tag:"New Arrivals", link:"/merch",     highlight:false },
    ],
    quoteText:    "Don't measure yourself by what you have accomplished, but by what you should have accomplished with your ability.",
    quoteAuthor:  "John Wooden",
    quoteRole:    "10-time NCAA Champion Coach",
    donateUrl:    "https://www.paypal.com/donate",
  },
  contact: {
    email:     "info@hilhiyouthbbx.com",
    phone:     "971-563-0552",
    address:   "3285 SE Rood Bridge Rd.\nHillsboro, OR 97123",
    facebook:  "https://www.facebook.com/hilhiyouthbbx",
    instagram: "https://www.instagram.com/hilhiyouthbbx",
    youtube:   "https://www.youtube.com/@hilhiyouthbbx",
    tiktok:    "https://www.tiktok.com/@hilhiyouthbbx",
    twitter:   "https://x.com/hilhiyouthbbx",
  },
  camps: {
    pageTitle:    "Camps & Clinics",
    pageSubtitle: "Skill development opportunities for all ages and levels.",
    items: [
      {
        id:          "camp-2026",
        enabled:     true,
        title:       "2026 Hilhi Youth Basketball Camp",
        date:        "June 22–25, 2026",
        price:       "$150 per camper (+$4.50 service fee)",
        description: "Get ready to level up your game this summer at the Hilhi Youth Basketball Camp! Join our awesome coaching staff for four days of skills, drills, fun competitions, and teamwork. Whether you're a beginner learning the basics or a returning player looking to sharpen your game for next season, this camp is designed to help you shine — both on and off the court!",
        imageUrl:    "https://galaxy-prod.tlcdn.com/view/user_34cYMUBillHvO8MzqYYaa9tzVg5/7634f012657a4144882b4e25112250e9.jpg",
      },
    ],
  },
  tryout: {
    enabled:          true,
    title:            "2026–2027 Youth Competitive Basketball Tryouts",
    subtitle:         "BBX Youth Tryout",
    imageUrl:         "https://static.wixstatic.com/media/458ec6_20a6707efcad4b06aedba93cfa6938cc~mv2.jpg/v1/fill/w_979,h_552,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/458ec6_20a6707efcad4b06aedba93cfa6938cc~mv2.jpg",
    location:         "Hillsboro High School",
    address:          "3285 SE Rood Bridge Rd, Hillsboro, OR 97123",
    gradeLevels:      "3rd – 8th Grade",
    gender:           "Boys",
    sessions:         [
      { id:"s1", label:"Sunday (Date TBD)",  time:"4:00 PM – 5:30 PM" },
      { id:"s2", label:"Monday (Date TBD)",  time:"6:30 PM – 8:00 PM" },
    ],
    aboutText:        "The youth basketball tryouts for the 2026-2027 season will be held at Hillsboro High School. Registration is open for boys in 3rd–8th grade. Players should come prepared to show their skills in dribbling, passing, shooting, and team play.\n\nCoaches will evaluate each player's fundamentals, athleticism, coachability, and overall fit for competitive team play. All players will receive feedback regardless of outcome.",
    financialNote:    "If you need financial assistance for Winter Basketball Registration, please contact us at info@hilhiyouthbbx.com.",
    price:            250,
    serviceFee:       6.25,
    registrationOpen: true,
  },
  youthCoaches: {
    intro:   "The dedicated coaches behind every Hilhi Youth Basketball team — shaping players through leadership, discipline, and a genuine love of the game.",
    coaches: [
      {
        id: "yc-coach-1", name: "Jorge Diaz", title: "Head Coach — 8th Grade A",
        imageUrl: "", email: "",
        bio: "Coach Jorge brings intensity and discipline to the Hilhi 8th Grade A program. With a focus on developing fundamental skills and competitive team chemistry, he prepares players for high school basketball and beyond. Jorge emphasizes leadership both on and off the court, challenging each athlete to reach their full potential.",
        roster: ["Merritt Kolodge","Jack Hengeveld Niemiec","Mathias Placher","Cristian Miranda Camargo","William Taylor","Keegan Sakamoto","Quinn Akans","Joel Martinez","Kalev Diaz","Deon Rochester","Amare Kent"],
      },
      {
        id: "yc-coach-2", name: "Christian Hidalgo", title: "Head Coach — 7th Grade A",
        imageUrl: "", email: "",
        bio: "Coach Christian leads the 7th Grade A squad with a passion for the game and a commitment to player growth. He focuses on building a strong IQ for basketball — teaching spacing, communication, and team defense. Christian creates a high-energy environment where players thrive through hard work and accountability.",
        roster: ["Raymond Vo","Adrian Avramuta","Traeson Tolentino","Makai Wilson","Alex Hidalgo","Zach Johnson","Dawsen Williams","Douglas Lyons","Jayden Camacho","Dante Castaneda","Christopher Thomas-Hyche"],
      },
      {
        id: "yc-coach-3", name: "Andrew Castillo", title: "Head Coach — 6th Grade",
        imageUrl: "", email: "",
        bio: "Coach Andrew brings patience and positivity to the 6th Grade program. He focuses on building the foundational skills — ball handling, footwork, and team concepts — that every young player needs to grow. Andrew creates a fun, competitive environment that keeps players engaged and hungry to improve every session.",
        roster: ["Benaiah Tiah","Aazawn Khan","Sean Paine","Noe Diaz","Felix Arguelles","Samuel Daniels","Bona Kemal","Mateo Herrera Trejo","Adonis Kent","Naol Meskele"],
      },
      {
        id: "yc-coach-4", name: "Jordan Alexander", title: "Head Coach — 7th Grade B",
        imageUrl: "", email: "",
        bio: "Coach Jordan connects with players through energy and enthusiasm. His 7th Grade B team is built on hustle, trust, and executing together as a unit. Jordan emphasizes that every player on the roster has a role and that winning is a team effort.",
        roster: ["Zachary Hengeveld Niemiec","Liam Bautista","Brogan Burkhardt","Luc Vial","Jonah Monckton","Elijah Jackson III","Zayden Robinson","Braylon Gillam"],
      },
      {
        id: "yc-coach-5", name: "Dylan Kem", title: "Head Coach — 3rd / 4th / 5th Grade",
        imageUrl: "", email: "",
        bio: "Coach Dylan works with Hilhi's youngest competitive players and focuses on building a genuine love for the game. He introduces teamwork, sportsmanship, and the fundamentals in an encouraging, age-appropriate setting.",
        roster: ["Joel Martinez","Julian Sharma","Jacob Valdez","Leo Romero","Lincoln Evans","Maylani Shelton","Amir Kent","Emile Redmond","Aiden Camacho","Dj Outlaw","Greyden Hubrich","Joshua Amukamara"],
      },
    ],
  },
  hsCoaches: {
    intro:   "Meet our experienced high school coaching staff.",
    coaches: [
      {
        id: "hs-coach-1", name: "My Lovanh", title: "Varsity Assistant Coach",
        email: "info@hilhiyouthbbx.com",
        imageUrl: "https://static.wixstatic.com/media/458ec6_7312b5f634f044dd829cc90251a86775~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/lovanh.jpg",
        bio: "My Lovanh is a dedicated basketball coach with a deep passion for player development and the game of basketball. From 2015 to 2020, he coached competitive youth AAU teams, helping young athletes build strong fundamentals and a love for the game.\n\nIn 2017, My joined Aloha High School in Beaverton, Oregon, where he served as the Head Junior Varsity Coach through 2022. During his tenure, he was instrumental in developing players for the varsity level, emphasizing teamwork, discipline, and high basketball IQ.\n\nIn 2023, My transitioned to Hillsboro High School, where he currently serves as an Assistant Varsity Coach. He continues to bring energy, knowledge, and leadership to the program, striving to inspire student-athletes both on and off the court.",
      },
      {
        id: "hs-coach-2", name: "Xavier Dupree", title: "JV Head Coach",
        email: "dupreex@hsd.k12.or.us",
        imageUrl: "https://static.wixstatic.com/media/458ec6_95d469bbaeb8429e98135e8439739999~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/dupree.jpg",
        bio: "Xavier Dupree is a dedicated and passionate leader/coach with over 10 years of experience developing athletes and leading teams to success both on and off the court. Known for a strategic mind, a relentless work ethic, and a commitment to player growth, Coach Xavier Dupree has built a reputation for excellence, discipline, and team unity.\n\nCoach Dupree believes in building a strong foundation based on fundamentals, accountability, and a love for the game, and has mentored and worked with dozens of athletes who have gone on to compete at the collegiate and professional levels.\n\nOff the court, Coach Dupree is equally invested in academic achievement and personal development, often working closely with families and educators to ensure players thrive in all areas of life. A quote he lives by: \"Keeping the main thing the main thing.\"",
      },
      {
        id: "hs-coach-3", name: "Obed Quintero", title: "Freshman Head Coach",
        email: "quintero_ohq@hotmail.com",
        imageUrl: "https://static.wixstatic.com/media/458ec6_2711d842affb4d1eb20bc9da6b476233~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/quintero.jpg",
        bio: "Obed Quintero is the Hilhi boys head freshman basketball coach. Entering his 2nd year as head coach with 4 years of coaching experience overall, he continues his passion for developing players on and off the court.\n\nObed is a Hillsboro High alumnus, Class of 2012, and a proud dad of 2. When he's not coaching, you'll find him watching and attending sporting events, hiking, paddle boarding, working out, and spending time with family and friends.",
      },
      {
        id: "hs-coach-4", name: "Mychael Samson", title: "Freshman Assistant Coach",
        email: "mychael.samson@yahoo.com",
        imageUrl: "https://static.wixstatic.com/media/458ec6_a8f821bfb39e4436a382516b47a5c906~mv2.jpg/v1/fill/w_600,h_500,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/samson.jpg",
        bio: "Mychael Samson is a proud alumnus of Hillsboro High School (Class of 2012), where he was a multi-sport athlete in football, basketball, and track. Now entering his second year on the Hillsboro staff, he is excited to continue contributing to the success of his alma mater.",
      },
    ],
    featuredCoach: {
      name:  "Samedy Kem",
      title: "Boys Varsity Head Coach — Hillsboro High School",
      photo: "https://static.wixstatic.com/media/458ec6_d73e2de98a3e401dadc7a150814ae173~mv2.jpg/v1/fill/w_600,h_600,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/kem.jpg",
      bioParas: [
        "With over three decades of basketball coaching and player development experience, Coach Kem has dedicated his career to teaching the game the right way — through fundamentals, teamwork, and discipline.",
        "Currently in his fifth year as the Head Boys Varsity Basketball Coach at Hillsboro High School, Coach Kem has built a program centered on hard work, accountability, and community. Under his leadership, the Hillsboro Youth Basketball Program has experienced tremendous growth — doubling in size since his first year.",
        "A proud Aloha High School alumnus, Class of 1989, Coach Kem was a member of the only basketball team in Aloha High School history to be inducted into the Aloha High School Hall of Fame.",
        "Before taking over the boys program, Coach Kem spent six years with Hillsboro High School Girls Basketball, serving as both Assistant Varsity Coach and Head Junior Varsity Coach.",
        "From 2014 to 2016, he also led Hillsboro's Girls Youth Program for grades 3–8, coaching teams that emphasized fundamentals, sportsmanship, and teamwork — culminating in a 1st Place finish at the Seaside Youth Tournament.",
        "Earlier in his career, from 2011 to 2014, Coach Kem served as the Freshman Boys Head Coach and Assistant Varsity Coach at Aloha High School.",
        "In addition to his basketball career, Coach Kem is a State of Oregon Certified General Contractor with over 30 years of experience in construction and architectural design.",
        "Today, Coach Kem continues to lead with passion and purpose — developing student-athletes who compete with integrity, play for each other, and carry the values of teamwork, respect, and perseverance both on and off the court.",
      ],
      stats: [
        { value: "30+",          label: "Years Coaching" },
        { value: "5th",          label: "Year as Head Boys Varsity Coach" },
        { value: "1989",         label: "Aloha HS Alum" },
        { value: "Hall of Fame", label: "Aloha High School" },
      ],
    },
  },
  videoRoom: {
    password:      "hilhi-team",
    coachPassword: "Kem-admin",
    title:         "Team Film Room",
    subtitle: "Video sessions and live streams for Hilhi players and coaches.",
    videos:   [],
  },
  merch: {
    pageTitle:        "Official Merchandise",
    pageSubtitle:     "Rep your team with official Hilhi Youth Basketball apparel.",
    announcementText: "",
    showAnnouncement: false,
    products: [
      { id:"wh-rb-hood",  name:"White Head – Royal Blue Hoodie",          price:30, cat:"hoodie",       imageUrl:"https://static.wixstatic.com/media/458ec6_9feb392cb05a400696ecda0f4aea25db~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-rb-ls",    name:"White Head – Royal Blue Long Sleeve",     price:25, cat:"long-sleeve",  imageUrl:"https://static.wixstatic.com/media/458ec6_e8b6b5b5bf534b0ca373b6f6547ac58a~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-rb-ss",    name:"White Head – Royal Blue Short Sleeve",    price:20, cat:"short-sleeve", imageUrl:"https://static.wixstatic.com/media/458ec6_916d4a4fb23040ee8e5c4680ab7df6dd~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"bh-w-hood",   name:"Blue Head – White Hoodie",                price:30, cat:"hoodie",       imageUrl:"https://static.wixstatic.com/media/458ec6_4072be1145a14bb9ace04af6b5fca89b~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"bh-w-ls",     name:"Blue Head – White Long Sleeve",           price:25, cat:"long-sleeve",  imageUrl:"https://static.wixstatic.com/media/458ec6_e5b218f93a604fc58643bba5758c8175~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"bh-w-ss",     name:"Blue Head – White Short Sleeve",          price:20, cat:"short-sleeve", imageUrl:"https://static.wixstatic.com/media/458ec6_9854d3c6934c401c8277c7ab2dc490f4~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"24-r-hood",   name:"2024 Hilhi – Red Hoodie",                 price:30, cat:"hoodie",       imageUrl:"https://static.wixstatic.com/media/458ec6_2d9df852f82541ef9ccbf46ede7afc3f~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"24-r-ls",     name:"2024 Hilhi – Red Long Sleeve",            price:25, cat:"long-sleeve",  imageUrl:"https://static.wixstatic.com/media/458ec6_7ddab8fd6a90494ca1476e417816dac4~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"24-r-ss",     name:"2024 Hilhi – Red Short Sleeve",           price:20, cat:"short-sleeve", imageUrl:"https://static.wixstatic.com/media/458ec6_b0df413e121e4e0e9261b65f34094289~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"ws-rb-hood",  name:"White Splash – Royal Blue Hoodie",        price:30, cat:"hoodie",       imageUrl:"https://static.wixstatic.com/media/458ec6_705936ec0edb4b7f95904f28ac6d1b0f~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"ws-rb-ls",    name:"White Splash – Royal Blue Long Sleeve",   price:25, cat:"long-sleeve",  imageUrl:"https://static.wixstatic.com/media/458ec6_253c69adc5a64186be78611929842f21~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"ws-rb-ss",    name:"White Splash – Royal Blue Short Sleeve",  price:20, cat:"short-sleeve", imageUrl:"https://static.wixstatic.com/media/458ec6_445d64bd353541859b96ec30777f09a3~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-r-hood",   name:"White H on RED Hoodie",                   price:30, cat:"hoodie",       imageUrl:"https://static.wixstatic.com/media/458ec6_2fc519ef318f4c209f201b8d873c37a3~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-r-ls",     name:"White H on RED Long Sleeve",              price:25, cat:"long-sleeve",  imageUrl:"https://static.wixstatic.com/media/458ec6_12953f8d40d3488ba08fdb6abc10a132~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-r-ss",     name:"White H on RED Short Sleeve",             price:20, cat:"short-sleeve", imageUrl:"https://static.wixstatic.com/media/458ec6_118cead65cd44d8bb00a2f8e36375eda~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-rb2-hood", name:"White H on Royal Blue Hoodie",            price:30, cat:"hoodie",       imageUrl:"https://static.wixstatic.com/media/458ec6_6a7f8116f5324889896c0e9bc0a8543d~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-rb2-ls",   name:"White H on Royal Blue Long Sleeve",       price:25, cat:"long-sleeve",  imageUrl:"https://static.wixstatic.com/media/458ec6_adaae9be2fd44f4f80ce521586d21ba7~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"wh-rb2-ss",   name:"White H on Royal Blue Short Sleeve",      price:20, cat:"short-sleeve", imageUrl:"https://static.wixstatic.com/media/458ec6_04280459961044669b98e2137bc7efca~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"rh-w-hood",   name:"RED H on White Hoodie",                   price:30, cat:"hoodie",       imageUrl:"https://static.wixstatic.com/media/458ec6_8ba342a4cc0745bd828859c551a8f0eb~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
      { id:"rh-w-ls",     name:"RED H on White Long Sleeve",              price:25, cat:"long-sleeve",  imageUrl:"https://static.wixstatic.com/media/458ec6_e6fec96c753b4b36981e0048c157c153~mv2.png/v1/fill/w_400,h_400,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/img.png" },
    ],
  },
};

function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

// ── Merge saved data with defaults ────────────────────────────────────────
function mergeContent(saved: Partial<SiteContent>): SiteContent {
  return {
    navbar:       { ...DEFAULTS.navbar,       ...saved.navbar },
    home: {
      ...DEFAULTS.home,
      ...saved.home,
      programCards: (saved.home?.programCards?.length ?? 0) > 0
                      ? saved.home!.programCards
                      : DEFAULTS.home.programCards,
    },
    contact:      { ...DEFAULTS.contact,      ...saved.contact },
    camps: {
      ...DEFAULTS.camps,
      ...saved.camps,
      items: (saved.camps?.items?.length ?? 0) > 0
               ? saved.camps!.items
               : DEFAULTS.camps.items,
    },
    tryout:       { ...DEFAULTS.tryout,       ...saved.tryout },
    youthCoaches: {
      ...DEFAULTS.youthCoaches,
      ...saved.youthCoaches,
      coaches: (saved.youthCoaches?.coaches?.length ?? 0) > 0
                 ? saved.youthCoaches!.coaches
                 : DEFAULTS.youthCoaches.coaches,
    },
    hsCoaches: {
      ...DEFAULTS.hsCoaches,
      ...saved.hsCoaches,
      coaches:       (saved.hsCoaches?.coaches?.length ?? 0) > 0
                       ? saved.hsCoaches!.coaches
                       : DEFAULTS.hsCoaches.coaches,
      featuredCoach: { ...DEFAULTS.hsCoaches.featuredCoach, ...(saved.hsCoaches?.featuredCoach ?? {}) },
    },
    videoRoom: { ...DEFAULTS.videoRoom, ...saved.videoRoom,
      password:      saved.videoRoom?.password      || DEFAULTS.videoRoom.password,
      coachPassword: saved.videoRoom?.coachPassword || DEFAULTS.videoRoom.coachPassword,
      videos: (saved.videoRoom?.videos?.length ?? 0) > 0 ? saved.videoRoom!.videos : DEFAULTS.videoRoom.videos,
    },
    merch: {
      ...DEFAULTS.merch,
      ...saved.merch,
      products: (saved.merch?.products?.length ?? 0) > 0
                  ? saved.merch!.products
                  : DEFAULTS.merch.products,
    },
  };
}

// ── File-based helpers (local dev only) ───────────────────────────────────
function getContentFromFile(): SiteContent {
  if (!fs.existsSync(FILE)) return DEFAULTS;
  try {
    const raw = fs.readFileSync(FILE, "utf-8").trim();
    if (!raw) return DEFAULTS;
    return mergeContent(JSON.parse(raw));
  } catch { return DEFAULTS; }
}

// ── Public API ────────────────────────────────────────────────────────────
export async function getContent(): Promise<SiteContent> {
  if (hasKV()) {
    try {
      const saved = await kvGet<Partial<SiteContent>>(KV_KEY);
      return saved ? mergeContent(saved) : DEFAULTS;
    } catch { return DEFAULTS; }
  }
  return getContentFromFile();
}

export async function saveContent(c: SiteContent): Promise<void> {
  if (hasKV()) {
    try {
      await kvSet(KV_KEY, c);
      return;
    } catch (e) { console.error("KV save error:", e); }
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(c, null, 2));
}

export { makeId };
