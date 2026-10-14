// Imported from HISTI-School-Middle.docx; questions and rubric preserved.
import { createSchoolEdition } from './histi-school-data.js?v=editions-1';
export { makeSchoolSlides } from './histi-school-data.js?v=editions-1';
const source = {
  "edition": "middle",
  "sourceName": "HISTI-School-Middle.docx",
  "sourceSha256": "b61059964a04866a47fd240208b6f0c43127d33bb8c3d13f474d264cdb7b09f4",
  "sourceTitle": "HISTI-School Middle",
  "ages": "10–13",
  "classMinutes": "35–50",
  "guideLabels": [
    "Not okay at all",
    "A little okay",
    "Somewhat okay",
    "Mostly okay",
    "Very okay"
  ],
  "recipients": {
    "G1": {
      "label": "Student you don’t know",
      "description": "A student around your age you have never met."
    },
    "G2": {
      "label": "Classmate",
      "description": "A student you know a little from class, but not a close friend."
    },
    "G3": {
      "label": "Friend",
      "description": "A person your age you trust and think of as a friend."
    },
    "G4": {
      "label": "Trusted adult",
      "description": "An adult you feel okay asking for help, such as a caregiver, teacher, or school counselor."
    }
  },
  "categories": {
    "A1": {
      "label": "Everyday interests & routines",
      "scope": "Think about things you enjoy and do most days."
    },
    "A2": {
      "label": "Life changes & goals",
      "scope": "These questions are pretend situations. Imagine each one happened."
    },
    "B": {
      "label": "Basic information",
      "scope": "Think about the fact in each question. Never write the fact itself."
    },
    "C": {
      "label": "More private information",
      "scope": "These are more personal topics. You can SKIP any answer."
    }
  },
  "items": [
    {
      "code": "A1-01",
      "title": "Hobbies and interests",
      "prompt": "How okay would you feel telling this person one thing you like doing for fun?",
      "type": "slider",
      "max": 10,
      "sourceIds": "A1-001, A1-002"
    },
    {
      "code": "A1-02",
      "title": "Entertainment",
      "prompt": "How okay would you feel telling this person your favorite kind of music, show, or game?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A1-003, A1-005, A1-009"
    },
    {
      "code": "A1-03",
      "title": "Books and stories",
      "prompt": "How okay would you feel telling this person about one book, comic, or story you like?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-007, A1-008, A1-062"
    },
    {
      "code": "A1-04",
      "title": "Sports and movement",
      "prompt": "How okay would you feel telling this person one sport or active game you enjoy?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-011, A1-019"
    },
    {
      "code": "A1-05",
      "title": "Creative activities",
      "prompt": "How okay would you feel telling this person one creative activity you like, such as drawing or making things?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-012, A1-065, A1-067"
    },
    {
      "code": "A1-06",
      "title": "Food preference",
      "prompt": "Would you feel okay telling this person one food you like?",
      "type": "yn",
      "max": 12,
      "sourceIds": "A1-014, A1-015"
    },
    {
      "code": "A1-07",
      "title": "School-day routine",
      "prompt": "How okay would you feel telling this person what a normal school day is like, without exact times or places?",
      "type": "slider",
      "max": 10,
      "sourceIds": "A1-022, A1-023, A1-025"
    },
    {
      "code": "A1-08",
      "title": "Weekend activities",
      "prompt": "How okay would you feel telling this person what you like to do on weekends?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-024, A1-072"
    },
    {
      "code": "A1-09",
      "title": "Apps and devices",
      "prompt": "How okay would you feel telling this person one type of app you like, such as a game or drawing app?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-031, A1-032"
    },
    {
      "code": "A1-10",
      "title": "Screen time",
      "prompt": "How okay would you feel telling this person about how much time you spend on screens for fun?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-034, A1-035"
    },
    {
      "code": "A1-11",
      "title": "Study habits",
      "prompt": "How okay would you feel telling this person how you like to study or do homework?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-052, A1-055"
    },
    {
      "code": "A1-12",
      "title": "Clubs and activities",
      "prompt": "How okay would you feel telling this person about a club or activity you would like to try?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A1-049, A1-050"
    },
    {
      "code": "A1-13",
      "title": "Improving a skill",
      "prompt": "How okay would you feel telling this person one skill you want to get better at?",
      "type": "slider",
      "max": 20,
      "sourceIds": "A1-061, A1-074"
    },
    {
      "code": "A1-14",
      "title": "Learning interests",
      "prompt": "How okay would you feel telling this person a school subject you want to learn more about?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A1-051, A1-063"
    },
    {
      "code": "A1-15",
      "title": "Ways to communicate",
      "prompt": "Would you feel okay telling this person if you like talking or sending messages better?",
      "type": "yn",
      "max": 16,
      "sourceIds": "A1-070, A1-075"
    },
    {
      "code": "A1-16",
      "title": "Animals and pets",
      "prompt": "Would you feel okay telling this person whether you like animals?",
      "type": "yn",
      "max": 10,
      "sourceIds": "A1-041, A1-042"
    },
    {
      "code": "A2-01",
      "title": "Starting somewhere new",
      "prompt": "Imagine you start at a new school. How okay would you feel telling this person how you feel about the change?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A2-022, A2-023"
    },
    {
      "code": "A2-02",
      "title": "Moving homes",
      "prompt": "Imagine your family moves to a new home. How okay would you feel telling this person how you feel about moving? Do not share an address.",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-016, A2-017, A2-018, A2-019"
    },
    {
      "code": "A2-03",
      "title": "Joining a group",
      "prompt": "Imagine you join a new club or team. How okay would you feel telling this person how you feel about being new?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A2-025 (school adaptation)"
    },
    {
      "code": "A2-04",
      "title": "Receiving an award",
      "prompt": "Imagine you get an award for something you did. How okay would you feel telling this person how you feel about it?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-032, A2-033"
    },
    {
      "code": "A2-05",
      "title": "An unexpected result",
      "prompt": "Imagine a project you worked on does not go well. How okay would you feel telling this person how you feel about it?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-048"
    },
    {
      "code": "A2-06",
      "title": "Changing friendship",
      "prompt": "Imagine you and a friend start spending less time together. How okay would you feel telling this person how you feel about that change?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A2-006 (friendship adaptation)"
    },
    {
      "code": "A2-07",
      "title": "Changes at home",
      "prompt": "Imagine your daily routine at home changes. How okay would you feel telling this person how the change affects your day?",
      "type": "slider",
      "max": 16,
      "sourceIds": "A2-050"
    },
    {
      "code": "A2-08",
      "title": "New responsibilities",
      "prompt": "Imagine you get a new job to do at home or school. How okay would you feel telling this person how you feel about it?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-012 (student adaptation)"
    },
    {
      "code": "A2-09",
      "title": "Reaching a goal",
      "prompt": "Imagine you reach a goal you worked hard for. How okay would you feel telling this person why the goal matters to you?",
      "type": "slider",
      "max": 12,
      "sourceIds": "A2-049"
    },
    {
      "code": "A2-10",
      "title": "Changing a plan",
      "prompt": "Imagine you change your mind about a plan for next year. How okay would you feel telling this person why it changed?",
      "type": "slider",
      "max": 24,
      "sourceIds": "A2-028 (student adaptation)"
    },
    {
      "code": "B-01",
      "title": "First name",
      "prompt": "Would you feel okay telling this person your first name?",
      "type": "yn",
      "max": 20,
      "sourceIds": "B-003"
    },
    {
      "code": "B-02",
      "title": "Name you like to use",
      "prompt": "How okay would you feel telling this person the name or nickname you like to be called?",
      "type": "slider",
      "max": 12,
      "sourceIds": "B-001"
    },
    {
      "code": "B-03",
      "title": "Grade level",
      "prompt": "How okay would you feel telling this person what grade you are in?",
      "type": "slider",
      "max": 12,
      "sourceIds": "B-005, B-029"
    },
    {
      "code": "B-04",
      "title": "Last name",
      "prompt": "How okay would you feel telling this person your last name?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-004"
    },
    {
      "code": "B-05",
      "title": "Birth month",
      "prompt": "How okay would you feel telling this person which month your birthday is in?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-008"
    },
    {
      "code": "B-06",
      "title": "School name",
      "prompt": "How okay would you feel telling this person the name of your school?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-028"
    },
    {
      "code": "B-07",
      "title": "Area you live in",
      "prompt": "How okay would you feel telling this person the town or area where you live (not your address)?",
      "type": "slider",
      "max": 24,
      "sourceIds": "B-016, B-017"
    },
    {
      "code": "B-08",
      "title": "Languages",
      "prompt": "How okay would you feel telling this person which languages you speak or are learning?",
      "type": "slider",
      "max": 12,
      "sourceIds": "B-037"
    },
    {
      "code": "B-09",
      "title": "Household size",
      "prompt": "How okay would you feel telling this person about how many people live in your home?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-034, B-035"
    },
    {
      "code": "B-10",
      "title": "Public username",
      "prompt": "Imagine you have a public username that anyone online can see. How okay would you feel telling this person that username?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-022"
    },
    {
      "code": "B-11",
      "title": "Public profile photo",
      "prompt": "Imagine you have an ordinary photo of yourself that anyone can see online. How okay would you feel showing that photo to this person?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-038"
    },
    {
      "code": "B-12",
      "title": "School subjects",
      "prompt": "How okay would you feel telling this person which school subjects you take (not your class times or room numbers)?",
      "type": "slider",
      "max": 16,
      "sourceIds": "B-030 (school adaptation)"
    },
    {
      "code": "C-01",
      "title": "A private grade",
      "prompt": "How okay would you feel telling this person a test or homework grade you normally keep private?",
      "type": "slider",
      "max": 16,
      "sourceIds": "C-037"
    },
    {
      "code": "C-02",
      "title": "A private conversation",
      "prompt": "How okay would you feel telling this person how you felt after a private talk, without repeating what anyone said?",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-027, C-028"
    },
    {
      "code": "C-03",
      "title": "A photo kept private",
      "prompt": "Imagine you have an ordinary photo of yourself that you kept private. How okay would you feel showing that photo to this person?",
      "type": "slider",
      "max": 30,
      "sourceIds": "C-026"
    },
    {
      "code": "C-04",
      "title": "A disagreement with a friend",
      "prompt": "Imagine you have an argument with a friend. How okay would you feel telling this person how you felt (without naming your friend)?",
      "type": "slider",
      "max": 30,
      "sourceIds": "C-024"
    },
    {
      "code": "C-05",
      "title": "A disagreement at home",
      "prompt": "Imagine you disagree with someone at home. How okay would you feel telling this person how you felt, without naming anyone?",
      "type": "slider",
      "max": 16,
      "sourceIds": "C-025"
    },
    {
      "code": "C-06",
      "title": "Exact after-school routine",
      "prompt": "How okay would you feel telling this person the exact times and places you go after school? Do not write them down.",
      "type": "slider",
      "max": 30,
      "sourceIds": "C-009, C-010"
    },
    {
      "code": "C-07",
      "title": "Internet search history",
      "prompt": "How okay would you feel telling this person what you searched for online in your own time? Do not list any searches.",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-029, C-030"
    },
    {
      "code": "C-08",
      "title": "Detailed app use",
      "prompt": "How okay would you feel telling this person exactly which apps you use and when you use them?",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-031"
    },
    {
      "code": "C-09",
      "title": "Private teacher feedback",
      "prompt": "How okay would you feel telling this person a private comment a teacher wrote on your schoolwork?",
      "type": "slider",
      "max": 20,
      "sourceIds": "C-038 (school adaptation)"
    },
    {
      "code": "C-10",
      "title": "Worries about belonging",
      "prompt": "How okay would you feel telling this person that you sometimes worry about fitting in or making friends?",
      "type": "slider",
      "max": 24,
      "sourceIds": "C-024 (school expansion)"
    }
  ],
  "reflectionQuestions": [
    "Why might you tell a friend something you would not tell a student you just met?",
    "What is the difference between telling someone a general fact and giving an exact detail?",
    "What is one kind way to say that you do not want to share something?"
  ]
};
export const { FAMILIES,CATEGORY_META,RECIPIENTS,SCHOOL_INFO,SOURCE_IDS } = createSchoolEdition(source);
