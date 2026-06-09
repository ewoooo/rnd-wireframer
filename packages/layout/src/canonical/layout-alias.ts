// alias → canonical qualified layout id.
// 의도적으로 비어 있다. bare/nickname 입력이 실제로 필요하다는 증거가 생기면 여기에만 추가한다.
// 하류(resolver / store / validator / renderer)에서 import 금지. 사용처는 parse/register/write-back 경계뿐이다.
export const layoutAliasIndex: Record<string, string> = {};
