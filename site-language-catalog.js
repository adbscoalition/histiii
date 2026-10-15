// One local, explicit route catalog shared by the picker, assessment and builder.
export const LANGUAGES=Object.freeze([
 {code:'en',prefix:'',name:'English',label:'English',word:'Language',dir:'ltr'},
 {code:'zh-CN',prefix:'zh',name:'简体中文',label:'Simplified Chinese',word:'语言',dir:'ltr'},
 {code:'es',prefix:'es',name:'Español',label:'Spanish',word:'Idioma',dir:'ltr'},
 {code:'ar',prefix:'ar',name:'العربية',label:'Arabic',word:'اللغة',dir:'rtl'},
 {code:'hi',prefix:'hi',name:'हिन्दी',label:'Hindi',word:'भाषा',dir:'ltr'},
 {code:'ur',prefix:'ur',name:'اردو',label:'Urdu',word:'زبان',dir:'rtl'},
 {code:'tl',prefix:'tl',name:'Tagalog',label:'Tagalog',word:'Wika',dir:'ltr'},
 {code:'fr',prefix:'fr',name:'Français',label:'French',word:'Langue',dir:'ltr'}
]);
export const languageFor=code=>LANGUAGES.find(language=>language.code===code)||LANGUAGES[0];
