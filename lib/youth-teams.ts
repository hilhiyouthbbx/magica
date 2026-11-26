// 2026-2027 Youth Teams page (the /youth-coaches page). Kept in its own file so the page, the admin editor
// and lib/content.ts can all share it. Parent names are deliberately NOT stored here: the site content API is public.

export interface YouthPlayer {
  id:    string;
  name:  string;
  grade: string; // "3".."8"
}

export interface YouthTeam {
  id:        string;
  name:      string;
  coach:     string;
  assistant: string;
  photoUrl:  string; // team picture, uploaded in the admin
  players:   YouthPlayer[];
}

export interface YouthTeamsContent {
  title:         string;
  season:        string;
  intro:         string;
  showFullNames: boolean; // false = "First L." on the public page
  teams:         YouthTeam[];
}

export const DEFAULT_YOUTH_TEAMS: YouthTeamsContent = {
  title:         "2026-2027 Youth Teams",
  season:        "2026-2027 Season",
  intro:         "Meet our Hilhi Youth Basketball teams and the coaches leading them this season.",
  showFullNames: true,
  teams: [
      {
        id: "yt-3rd-4th-grade", name: "3rd/4th Grade", coach: "Dustin DeGroot", assistant: "", photoUrl: "",
        players: [
        { id: "yt-3rd-4th-grade-alex-williams", name: "Alex Williams", grade: "3" },
        { id: "yt-3rd-4th-grade-camden-servantes", name: "Camden Servantes", grade: "3" },
        { id: "yt-3rd-4th-grade-chidera-joshua-amukamara", name: "Chidera Joshua Amukamara", grade: "3" },
        { id: "yt-3rd-4th-grade-king-adolphe", name: "King Adolphe", grade: "3" },
        { id: "yt-3rd-4th-grade-carter-aguilar", name: "Carter Aguilar", grade: "4" },
        { id: "yt-3rd-4th-grade-crew-degroot", name: "Crew DeGroot", grade: "4" },
        { id: "yt-3rd-4th-grade-deven-gonzalez", name: "Deven Gonzalez", grade: "4" },
        { id: "yt-3rd-4th-grade-greyden-hubrich", name: "Greyden Hubrich", grade: "4" },
        { id: "yt-3rd-4th-grade-jayden-vasquez", name: "Jayden Vasquez", grade: "4" },
        { id: "yt-3rd-4th-grade-teawe-ahina-rojas", name: "Teawe Ahina-Rojas", grade: "4" },
        { id: "yt-3rd-4th-grade-marcus-sipp", name: "Marcus Sipp", grade: "4" },
        ],
      },
      {
        id: "yt-5th-grade", name: "5th Grade", coach: "Mandy Eischen", assistant: "", photoUrl: "",
        players: [
        { id: "yt-5th-grade-aiden-amrein", name: "Aiden Amrein", grade: "5" },
        { id: "yt-5th-grade-aiden-camacho", name: "Aiden Camacho", grade: "5" },
        { id: "yt-5th-grade-amir-kent", name: "Amir Kent", grade: "5" },
        { id: "yt-5th-grade-jake-van-woodward", name: "Jake Van Woodward", grade: "5" },
        { id: "yt-5th-grade-lucas-breen", name: "Lucas Breen", grade: "5" },
        { id: "yt-5th-grade-mandy-eischen", name: "Mandy Eischen", grade: "5" },
        { id: "yt-5th-grade-monte-sipp", name: "Monte Sipp", grade: "5" },
        { id: "yt-5th-grade-dj-outlaw", name: "DJ Outlaw", grade: "4" },
        { id: "yt-5th-grade-nevin-dissanayake", name: "Nevin Dissanayake", grade: "4" },
        ],
      },
      {
        id: "yt-6th-grade", name: "6th Grade", coach: "Damian Acosta", assistant: "", photoUrl: "",
        players: [
        { id: "yt-6th-grade-brody-stowe", name: "Brody Stowe", grade: "6" },
        { id: "yt-6th-grade-christopher-martinez", name: "Christopher Martinez", grade: "6" },
        { id: "yt-6th-grade-darius-warren", name: "Darius Warren", grade: "6" },
        { id: "yt-6th-grade-declan-campbell", name: "Declan Campbell", grade: "6" },
        { id: "yt-6th-grade-jacob-valdez", name: "Jacob Valdez", grade: "6" },
        { id: "yt-6th-grade-jiante-carter", name: "Jiante Carter", grade: "6" },
        { id: "yt-6th-grade-milo-shearer", name: "Milo Shearer", grade: "6" },
        { id: "yt-6th-grade-owen-andrews", name: "Owen Andrews", grade: "6" },
        { id: "yt-6th-grade-ryan-huynh", name: "Ryan Huynh", grade: "6" },
        { id: "yt-6th-grade-carlos", name: "Carlos", grade: "7" },
        { id: "yt-6th-grade-felix-arguelles", name: "Felix Arguelles", grade: "7" },
        ],
      },
      {
        id: "yt-7th-grade", name: "7th Grade", coach: "Dylan Kem", assistant: "Terry Peng", photoUrl: "",
        players: [
        { id: "yt-7th-grade-aazawn-khan", name: "Aazawn Khan", grade: "7" },
        { id: "yt-7th-grade-adonis-kent", name: "Adonis Kent", grade: "7" },
        { id: "yt-7th-grade-albert-gonzales", name: "Albert Gonzales", grade: "7" },
        { id: "yt-7th-grade-angel-jr-sanchez", name: "Angel Jr Sanchez", grade: "7" },
        { id: "yt-7th-grade-braden-kragt", name: "Braden Kragt", grade: "7" },
        { id: "yt-7th-grade-caleb-degroot", name: "Caleb DeGroot", grade: "7" },
        { id: "yt-7th-grade-conner-eischen", name: "Conner Eischen", grade: "7" },
        { id: "yt-7th-grade-luke-lynn", name: "Luke Lynn", grade: "7" },
        { id: "yt-7th-grade-mateo-trejo", name: "Mateo Trejo", grade: "7" },
        { id: "yt-7th-grade-noe-diaz", name: "Noe Diaz", grade: "7" },
        { id: "yt-7th-grade-samuel-daniels", name: "Samuel Daniels", grade: "7" },
        ],
      },
      {
        id: "yt-8th-grade-b", name: "8th Grade - B", coach: "Alijah Castillo", assistant: "", photoUrl: "",
        players: [
        { id: "yt-8th-grade-b-hollis-rickard", name: "Hollis Rickard", grade: "8" },
        { id: "yt-8th-grade-b-jameson-moreno", name: "Jameson Moreno", grade: "8" },
        { id: "yt-8th-grade-b-jonah-monckton", name: "Jonah Monckton", grade: "8" },
        { id: "yt-8th-grade-b-jude-guerrero", name: "Jude Guerrero", grade: "8" },
        { id: "yt-8th-grade-b-jude-schwisow", name: "Jude Schwisow", grade: "8" },
        { id: "yt-8th-grade-b-liam-bautista", name: "Liam Bautista", grade: "8" },
        { id: "yt-8th-grade-b-michael-magana", name: "Michael Magana", grade: "8" },
        { id: "yt-8th-grade-b-noah-taylor", name: "Noah Taylor", grade: "8" },
        { id: "yt-8th-grade-b-zachary", name: "Zachary", grade: "8" },
        { id: "yt-8th-grade-b-elijah-jackson-iii", name: "Elijah Jackson III", grade: "8" },
        { id: "yt-8th-grade-b-walter-estrada", name: "Walter Estrada", grade: "8" },
        ],
      },
      {
        id: "yt-8th-grade-a", name: "8th Grade - A", coach: "Andrew Castillo", assistant: "", photoUrl: "",
        players: [
        { id: "yt-8th-grade-a-adrian-aj-avramuta", name: "Adrian (AJ) Avramuta", grade: "8" },
        { id: "yt-8th-grade-a-alex-hidalgo", name: "Alex Hidalgo", grade: "8" },
        { id: "yt-8th-grade-a-zachary-johnson", name: "Zachary Johnson", grade: "8" },
        { id: "yt-8th-grade-a-dawsen-williams", name: "Dawsen Williams", grade: "8" },
        { id: "yt-8th-grade-a-drew-eischen", name: "Drew Eischen", grade: "8" },
        { id: "yt-8th-grade-a-traeson-tolentino", name: "Traeson Tolentino", grade: "8" },
        { id: "yt-8th-grade-a-raymond-vo", name: "Raymond Vo", grade: "8" },
        { id: "yt-8th-grade-a-christopher-thomas-hyche", name: "Christopher Thomas-Hyche", grade: "8" },
        { id: "yt-8th-grade-a-makai-wilson", name: "Makai Wilson", grade: "8" },
        { id: "yt-8th-grade-a-alexander-i-clausen", name: "Alexander I Clausen", grade: "8" },
        { id: "yt-8th-grade-a-branden-breland", name: "Branden Breland", grade: "8" },
        { id: "yt-8th-grade-a-douglas-lyons", name: "Douglas Lyons", grade: "8" },
        ],
      },
  ],
};
