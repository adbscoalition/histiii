// HISTI v2.8 120-question standalone short form.
// The source form keeps 120 original catalogue items as standalone questions;
// no grouped prompts are used and omitted catalogue items are not merged.
import catalogue from './questions-data-private-v1.js';

const SELECTED_CODES = ["A01","A02","A03","A04","A05","B01","B02","C01","C02","D01","A06","A07","A08","A09","A10","B03","B04","C03","C05","D02","A11","A12","A13","A16","A17","B05","B06","C07","C08","D03","A18","A19","A20","A21","A22","B07","B08","C11","C13","D05","A23","A24","A32","A35","A37","B09","B10","C14","C15","D06","A38","A43","A44","A46","A48","B11","B12","C17","C18","D07","A49","A50","A52","A53","A54","B13","B14","C20","C21","D08","A55","A58","A60","A61","A62","B15","B16","C22","C25","D09","A63","A64","A65","A67","A69","B17","B18","C27","C31","D10","A70","A71","A72","A73","A74","B19","B25","C39","C42","D15","A79","A81","A82","A86","A88","B32","B34","C50","C51","D16","A89","A90","A102","A110","A114","B49","B51","C55","C63","D33"];
const byCode = new Map(catalogue.questions.map(item => [item.code, item]));

const scoringItems = SELECTED_CODES.map(code => {
  const item = byCode.get(code);
  if (!item) throw new Error(`Missing HISTI catalogue item: ${code}`);
  return item;
});

const questions = scoringItems.map((item, index) => ({
  code: item.code,
  number: index + 1,
  category: item.category,
  title: item.title,
  prompt: item.description,
  items: [item.code]
}));

export { SELECTED_CODES };
export default {
  version: '2.8-120-standalone',
  count: 120,
  source: 'HISTI_v2.8_120Q_Standalone_Full_Length_Short_Form(1).docx',
  questions,
  scoringItems
};
