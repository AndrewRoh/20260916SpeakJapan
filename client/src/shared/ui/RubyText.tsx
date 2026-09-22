import type { Token } from '@jp-listening-app/shared';

export interface RubyTextProps {
  tokens: Token[];
  showFurigana: boolean;
}

/** 텍스트 노드와 <ruby> 요소로만 렌더링한다(dangerouslySetInnerHTML 사용 안 함). */
export function RubyText({ tokens, showFurigana }: RubyTextProps) {
  return (
    <>
      {tokens.map((token, index) =>
        token.reading && showFurigana ? (
          <ruby key={index}>
            {token.surface}
            <rt>{token.reading}</rt>
          </ruby>
        ) : (
          <span key={index}>{token.surface}</span>
        ),
      )}
    </>
  );
}
