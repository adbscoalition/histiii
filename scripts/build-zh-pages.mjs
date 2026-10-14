// Compatibility exports for Chinese page tooling.
import {buildLanguagePage,TRANSLATED_PAGES} from './build-language-pages.mjs';
export const ZH_PAGES=TRANSLATED_PAGES;
export const buildZhPage=page=>buildLanguagePage('zh',page);
