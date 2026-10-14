// Imported from HISTI-School-High.docx; questions and rubric preserved.
import { createSchoolEdition } from './histi-school-data.js?v=editions-1';
export { makeSchoolSlides } from './histi-school-data.js?v=editions-1';
const source = {
  "edition": "high",
  "sourceName": "HISTI-School-High.docx",
  "sourceSha256": "2de73a542e8cabe76533283f3a8cf5e820334071e2a53c29ae0f506fcc89da84",
  "sourceTitle": "HISTI-School High",
  "ages": "14–18",
  "classMinutes": "25–40",
  "guideLabels": [
    "Not comfortable",
    "Slightly comfortable",
    "Somewhat comfortable",
    "Mostly comfortable",
    "Very comfortable"
  ],
  "recipients": {
    "G1": {
      "label": "Student you don’t know",
      "description": "A student about your age you have not met before."
    },
    "G2": {
      "label": "Classmate",
      "description": "Someone you know a little through school, but do not consider a close friend."
    },
    "G3": {
      "label": "Friend",
      "description": "A peer you trust and consider a friend."
    },
    "G4": {
      "label": "Trusted adult",
      "description": "An adult you trust, such as a caregiver, mentor, teacher, or counselor."
    }
  },
  "categories": {
    "A1": {
      "label": "Interests & everyday life",
      "scope": "Focus on what you would share, not what is right to share."
    },
    "A2": {
      "label": "Changes, goals & achievements",
      "scope": "These are hypothetical changes. Imagine each situation, even if it has not happened."
    },
    "B": {
      "label": "Basic identifying details",
      "scope": "Rate the information. Do not provide any identifying details."
    },
    "C": {
      "label": "Personal & sensitive information",
      "scope": "These topics are more personal. SKIP anything you do not want to rate."
    }
  },
  "items": [
    {
      "code": "A1-01",
      "title": "Hobbies and interests",
      "prompt": "How comfortable would you feel telling this person about one hobby or interest you have outside class?",
      "type": "slider",
      "max": 10,
      "sourceIds": "A1-001, A1-002"
    },
    {
      "code": "A1-02",
      "title": "Entertainment",
      "prompt": "How comfortable would you feel telling this person your favorite type of music, series, or game?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A1-003, A1-005, A1-009"
    },
    {
      "code": "A1-03",
      "title": "Books and stories",
      "prompt": "How comfortable would you feel telling this person about a book, comic, or article you enjoy?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-007, A1-008, A1-062"
    },
    {
      "code": "A1-04",
      "title": "Sports and movement",
      "prompt": "How comfortable would you feel telling this person about one sport or physical activity you enjoy?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-011, A1-019"
    },
    {
      "code": "A1-05",
      "title": "Creative activities",
      "prompt": "How comfortable would you feel telling this person about a creative project or skill you enjoy?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-012, A1-065, A1-067"
    },
    {
      "code": "A1-06",
      "title": "Food preference",
      "prompt": "Would you be comfortable telling this person one food you like?",
      "type": "yn",
      "max": 12,
      "sourceIds": "A1-014, A1-015"
    },
    {
      "code": "A1-07",
      "title": "School-day routine",
      "prompt": "How comfortable would you feel describing a typical school day in general terms, without your exact schedule?",
      "type": "slider",
      "max": 10,
      "sourceIds": "A1-022, A1-023, A1-025"
    },
    {
      "code": "A1-08",
      "title": "Weekend activities",
      "prompt": "How comfortable would you feel telling this person what you usually do for fun on weekends?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-024, A1-072"
    },
    {
      "code": "A1-09",
      "title": "Apps and devices",
      "prompt": "How comfortable would you feel telling this person which kind of app or digital tool you enjoy using?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-031, A1-032"
    },
    {
      "code": "A1-10",
      "title": "Screen time",
      "prompt": "How comfortable would you feel telling this person roughly how much time you spend on screens for fun?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-034, A1-035"
    },
    {
      "code": "A1-11",
      "title": "Study habits",
      "prompt": "How comfortable would you feel telling this person how you organize studying, homework, or revision?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-052, A1-055"
    },
    {
      "code": "A1-12",
      "title": "Clubs and activities",
      "prompt": "How comfortable would you feel telling this person about a school club, team, or activity that interests you?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A1-049, A1-050"
    },
    {
      "code": "A1-13",
      "title": "Improving a skill",
      "prompt": "How comfortable would you feel telling this person about one skill or habit you are trying to improve?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-061, A1-074"
    },
    {
      "code": "A1-14",
      "title": "Learning interests",
      "prompt": "How comfortable would you feel telling this person about an academic subject you would like to explore more?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-051, A1-063"
    },
    {
      "code": "A1-15",
      "title": "Ways to communicate",
      "prompt": "Would you be comfortable telling this person if you prefer talking face to face or messaging?",
      "type": "yn",
      "max": 16,
      "sourceIds": "A1-070, A1-075"
    },
    {
      "code": "A1-16",
      "title": "Animals and pets",
      "prompt": "Would you be comfortable telling this person whether you enjoy being around animals?",
      "type": "yn",
      "max": 10,
      "sourceIds": "A1-041, A1-042"
    },
    {
      "code": "A2-01",
      "title": "Starting somewhere new",
      "prompt": "Imagine you transfer to a new school. How comfortable would you feel telling this person how you are handling the change?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A2-022, A2-023"
    },
    {
      "code": "A2-02",
      "title": "Moving homes",
      "prompt": "Imagine your household moves to another area. How comfortable would you feel telling this person how you feel about the move, without sharing an address?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-016, A2-017, A2-018, A2-019"
    },
    {
      "code": "A2-03",
      "title": "Joining a group",
      "prompt": "Imagine you join a new team, club, or group. How comfortable would you feel telling this person how you feel about fitting in?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A2-025 (school adaptation)"
    },
    {
      "code": "A2-04",
      "title": "Receiving an award",
      "prompt": "Imagine you receive recognition for an achievement. How comfortable would you feel telling this person how you feel about it?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-032, A2-033"
    },
    {
      "code": "A2-05",
      "title": "An unexpected result",
      "prompt": "Imagine something important you worked on does not turn out as planned. How comfortable would you feel telling this person how you feel?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-048"
    },
    {
      "code": "A2-06",
      "title": "Changing friendship",
      "prompt": "Imagine a friendship becomes less close. How comfortable would you feel telling this person how you feel about that change?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A2-006 (friendship adaptation)"
    },
    {
      "code": "A2-07",
      "title": "Changes at home",
      "prompt": "Imagine your home routine changes. How comfortable would you feel telling this person how it affects you, without sharing other people's details?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A2-050"
    },
    {
      "code": "A2-08",
      "title": "New responsibilities",
      "prompt": "Imagine you take on a new responsibility at school or home. How comfortable would you feel telling this person how you feel about it?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-012 (student adaptation)"
    },
    {
      "code": "A2-09",
      "title": "Reaching a goal",
      "prompt": "Imagine you achieve a personal goal. How comfortable would you feel telling this person why reaching it matters to you?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A2-049"
    },
    {
      "code": "A2-10",
      "title": "Changing a plan",
      "prompt": "Imagine you change a plan for the coming year. How comfortable would you feel telling this person why you changed your mind?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-028 (student adaptation)"
    },
    {
      "code": "B-01",
      "title": "First name",
      "prompt": "Would you be comfortable telling this person your first name?",
      "type": "yn",
      "max": 20,
      "sourceIds": "B-003"
    },
    {
      "code": "B-02",
      "title": "Name you like to use",
      "prompt": "How comfortable would you feel telling this person the name or nickname you prefer to use?",
      "type": "slider",
      "max": 12,
      "sourceIds": "B-001"
    },
    {
      "code": "B-03",
      "title": "Grade level",
      "prompt": "How comfortable would you feel telling this person your grade level?",
      "type": "slider",
      "max": 12,
      "sourceIds": "B-005, B-029"
    },
    {
      "code": "B-04",
      "title": "Last name",
      "prompt": "How comfortable would you feel telling this person your last name?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-004"
    },
    {
      "code": "B-05",
      "title": "Birth month",
      "prompt": "How comfortable would you feel telling this person your birth month, not your exact birthday?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-008"
    },
    {
      "code": "B-06",
      "title": "School name",
      "prompt": "How comfortable would you feel telling this person the name of your school?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-028"
    },
    {
      "code": "B-07",
      "title": "Area you live in",
      "prompt": "How comfortable would you feel telling this person your town or general neighborhood, not your street address?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-016, B-017"
    },
    {
      "code": "B-08",
      "title": "Languages",
      "prompt": "How comfortable would you feel telling this person what languages you speak or are learning?",
      "type": "slider",
      "max": 12,
      "sourceIds": "B-037"
    },
    {
      "code": "B-09",
      "title": "Household size",
      "prompt": "How comfortable would you feel telling this person roughly how many people live in your household?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-034, B-035"
    },
    {
      "code": "B-10",
      "title": "Public username",
      "prompt": "Imagine you have an online username visible to everyone. How comfortable would you feel telling this person that username?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-022"
    },
    {
      "code": "B-11",
      "title": "Public profile photo",
      "prompt": "Imagine you have an ordinary public profile photo. How comfortable would you feel showing that same photo to this person?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-038"
    },
    {
      "code": "B-12",
      "title": "School subjects",
      "prompt": "How comfortable would you feel telling this person which subjects you study, without giving your class schedule?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-030 (school adaptation)"
    },
    {
      "code": "C-01",
      "title": "A private grade",
      "prompt": "How comfortable would you feel telling this person an assessment grade that you prefer to keep private?",
      "type": "slider",
      "max": 16,
      "sourceIds": "C-037"
    },
    {
      "code": "C-02",
      "title": "A private conversation",
      "prompt": "How comfortable would you feel telling this person how you felt after a private conversation, without sharing anyone else's words?",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-027, C-028"
    },
    {
      "code": "C-03",
      "title": "A photo kept private",
      "prompt": "Imagine you have an ordinary photo of yourself you have not posted publicly. How comfortable would you feel showing it to this person?",
      "type": "slider",
      "max": 30,
      "sourceIds": "C-026"
    },
    {
      "code": "C-04",
      "title": "A disagreement with a friend",
      "prompt": "Imagine you have a disagreement with a friend. How comfortable would you feel describing your feelings without identifying the friend?",
      "type": "slider",
      "max": 30,
      "sourceIds": "C-024"
    },
    {
      "code": "C-05",
      "title": "A disagreement at home",
      "prompt": "Imagine you disagree with someone at home. How comfortable would you feel sharing your feelings without revealing anyone else's private details?",
      "type": "slider",
      "max": 16,
      "sourceIds": "C-025"
    },
    {
      "code": "C-06",
      "title": "Exact after-school routine",
      "prompt": "How comfortable would you feel telling this person the exact times and places you usually go after school? Do not write them down.",
      "type": "slider",
      "max": 30,
      "sourceIds": "C-009, C-010"
    },
    {
      "code": "C-07",
      "title": "Internet search history",
      "prompt": "How comfortable would you feel telling this person which topics you have recently searched for online? Do not share your actual search history.",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-029, C-030"
    },
    {
      "code": "C-08",
      "title": "Detailed app use",
      "prompt": "How comfortable would you feel telling this person exactly which apps you used recently and when?",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-031"
    },
    {
      "code": "C-09",
      "title": "Private teacher feedback",
      "prompt": "How comfortable would you feel telling this person a teacher's private written feedback about your schoolwork?",
      "type": "slider",
      "max": 20,
      "sourceIds": "C-038 (school adaptation)"
    },
    {
      "code": "C-10",
      "title": "Worries about belonging",
      "prompt": "How comfortable would you feel telling this person that you sometimes worry about belonging or being left out?",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-024 (school expansion)"
    }
  ],
  "reflectionQuestions": [
    "How can the same information feel okay to share with one person but not another?",
    "Why is knowing someone different from knowing that sharing something is safe?",
    "What is one respectful way to set a boundary when someone asks for personal information?"
  ]
};
export const { FAMILIES,CATEGORY_META,RECIPIENTS,SCHOOL_INFO,SOURCE_IDS } = createSchoolEdition(source);
