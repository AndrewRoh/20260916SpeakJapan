import { describe, expect, it } from 'vitest';
import { parseAozoraRuby, removeAnnotations, stripAozoraHeaderFooter } from './aozoraParser';

describe('parseAozoraRuby', () => {
  it('converts an explicit ｜親字《よみ》 span into a token with reading', () => {
    const result = parseAozoraRuby('｜吾輩《わがはい》は猫である');
    expect(result.text).toBe('吾輩は猫である');
    expect(result.tokens).toEqual([
      { surface: '吾輩', reading: 'わがはい' },
      { surface: 'は猫である' },
    ]);
  });

  it('converts an implicit 漢字《よみ》 span (kanji run immediately before) into a token with reading', () => {
    const result = parseAozoraRuby('今日《きょう》はいい天気《てんき》です');
    expect(result.text).toBe('今日はいい天気です');
    expect(result.tokens).toEqual([
      { surface: '今日', reading: 'きょう' },
      { surface: 'はいい' },
      { surface: '天気', reading: 'てんき' },
      { surface: 'です' },
    ]);
  });

  it('keeps tokens joined equal to text with no ruby present', () => {
    const result = parseAozoraRuby('ただの文章です');
    expect(result.tokens.map((t) => t.surface).join('')).toBe(result.text);
  });
});

describe('annotation removal', () => {
  it('removes ［＃...］ editorial annotations', () => {
    const result = removeAnnotations('半七捕物帳［＃「半七捕物帳」は中見出し］');
    expect(result).toBe('半七捕物帳');
  });
});

describe('stripAozoraHeaderFooter', () => {
  it('removes the header block between the first two separator lines and the footer after the last one', () => {
    const raw = [
      '吾輩は猫である',
      '夏目漱石',
      '-------------------------------------------------------',
      '【テキスト中に現れる記号について】',
      '-------------------------------------------------------',
      '',
      '吾輩は猫である。名前はまだ無い。',
      '',
      'どこで生れたかとんと見当がつかぬ。',
      '-------------------------------------------------------',
      '底本：「吾輩は猫である」新潮文庫',
      '　1961（昭和36）年発行',
    ].join('\n');

    const result = stripAozoraHeaderFooter(raw);
    expect(result).toBe('吾輩は猫である。名前はまだ無い。\n\nどこで生れたかとんと見当がつかぬ。');
  });

  it('returns the text unchanged when there are no separator lines', () => {
    const raw = '本文だけのテキストです。';
    expect(stripAozoraHeaderFooter(raw)).toBe(raw);
  });
});
