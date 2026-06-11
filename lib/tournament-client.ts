/**
 * Client-safe tournament constants and types.
 * No Node.js / fs imports — safe to import from "use client" components.
 */

export interface TournamentConfig {
  id:                   string;
  enabled:              boolean;
  name:                 string;
  tagline:              string;
  gender:               string;
  grades:               string;
  dates:                string;
  dayTime:              string;
  registrationDeadline: string;
  venue:                string;
  address:              string;
  entryFee:             number;
  serviceFee:           number;
  divisions:            string[];
  format:               string;
  gamesGuaranteed:      string;
  maxTeams:             string;
  imageUrl:             string;
  isStateQualifier:     boolean;
  stateQualifierText:   string;
  description:          string;
  accommodationsNote:   string;
  refundPolicy:         string;
  rules:                string;
  notes:                string;
  contactEmail:         string;
  contactPhone:         string;
}

export const TOURNAMENT_DEFAULTS: Omit<TournamentConfig, "id"> = {
  enabled:              false,
  name:                 "New Tournament",
  tagline:              "Youth Basketball Tournament",
  gender:               "Boys & Girls",
  grades:               "3rd–8th Grade",
  dates:                "TBD",
  dayTime:              "",
  registrationDeadline: "TBD",
  venue:                "Hillsboro High School",
  address:              "3285 SE Rood Bridge Rd, Hillsboro, OR 97123",
  entryFee:             250,
  serviceFee:           6.25,
  divisions:            ["3rd/4th Grade Boys","3rd/4th Grade Girls","5th/6th Grade Boys","5th/6th Grade Girls","7th Grade Boys","7th Grade Girls","8th Grade Boys","8th Grade Girls"],
  format:               "Double Elimination",
  gamesGuaranteed:      "3",
  maxTeams:             "16",
  imageUrl:             "",
  isStateQualifier:     false,
  stateQualifierText:   "",
  description:          "",
  accommodationsNote:   "",
  refundPolicy:         "If registration is cancelled 14 days or MORE before the tournament start date, a FULL refund will be issued. If 8–13 days, 50% reimbursement. Within 7 days, NO refund.",
  rules:                "",
  notes:                "",
  contactEmail:         "info@hilhiyouthbbx.com",
  contactPhone:         "971-563-0552",
};
