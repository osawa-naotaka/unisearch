import { loadDefaultJapaneseParser } from 'budoux';
import { wikipedia_articles_ja } from '@test/wikipedia_articles.ja';
import { docToWords } from '@src/preprocess';
const parser = loadDefaultJapaneseParser();
wikipedia_articles_ja.map(x => docToWords([x.content]).map(word => console.log(parser.parse(word))));

