/**
 * AI 文案内容过滤系统
 * 用于移除生成文案中的标题、正文等标识文字
 */

/**
 * 过滤文案中的标识文字
 * @param content - 原始文案内容
 * @returns 过滤后的文案内容
 */
export function filterContentLabels(content: string): string {
  if (!content) return content;

  let filtered = content;

  // 1. 移除括号标识：【标题】、【正文】、【内容】、【主题】、【核心卖点】、【真实体验】、【小贴士】等
  const bracketPatterns = [
    /【标题】\s*/g,
    /【正文】\s*/g,
    /【内容】\s*/g,
    /【主题】\s*/g,
    /【核心卖点】\s*/g,
    /【真实体验】\s*/g,
    /【小贴士】\s*/g,
    /【温馨提示】\s*/g,
    /【注意】\s*/g,
    /【提示】\s*/g,
    /\[标题\]\s*/g,
    /\[正文\]\s*/g,
    /\[内容\]\s*/g,
    /\[核心卖点\]\s*/g,
    /\[真实体验\]\s*/g,
    /\[小贴士\]\s*/g,
  ];

  for (const pattern of bracketPatterns) {
    filtered = filtered.replace(pattern, '');
  }

  // 2. 移除冒号前缀：标题：、正文：、核心卖点：、真实体验：、小贴士：等
  const colonPatterns = [
    /^标题 [：:]\s*/gm,
    /^正文 [：:]\s*/gm,
    /^内容 [：:]\s*/gm,
    /^核心卖点 [：:]\s*/gm,
    /^真实体验 [：:]\s*/gm,
    /^小贴士 [：:]\s*/gm,
    /^温馨提示 [：:]\s*/gm,
  ];

  for (const pattern of colonPatterns) {
    filtered = filtered.replace(pattern, '');
  }

  // 3. 清理多余的空行（超过 2 个连续换行）
  filtered = filtered.replace(/\n{3,}/g, '\n\n');

  // 4. 清理首尾空白
  filtered = filtered.trim();

  return filtered;
}

/**
 * 过滤标题文案
 * @param title - 原始标题
 * @returns 过滤后的标题
 */
export function filterTitleLabels(title: string): string {
  if (!title) return title;

  let filtered = title;

  // 移除标题相关标识
  const patterns = [
    /【标题】\s*/g,
    /\[标题\]\s*/g,
    /^标题 [：:]\s*/,
  ];

  for (const pattern of patterns) {
    filtered = filtered.replace(pattern, '');
  }

  return filtered.trim();
}

/**
 * 过滤正文文案
 * @param body - 原始正文
 * @returns 过滤后的正文
 */
export function filterBodyLabels(body: string): string {
  if (!body) return body;

  let filtered = body;

  // 移除正文相关标识
  const patterns = [
    /【正文】\s*/g,
    /\[正文\]\s*/g,
    /^正文 [：:]\s*/gm,
  ];

  for (const pattern of patterns) {
    filtered = filtered.replace(pattern, '');
  }

  return filtered.trim();
}

/**
 * 批量过滤文案列表
 * @param items - 文案列表
 * @returns 过滤后的文案列表
 */
export function filterContentList<T extends { title?: string; content?: string; subTitle?: string }>(
  items: T[]
): T[] {
  return items.map(item => ({
    ...item,
    title: item.title ? filterTitleLabels(item.title) : item.title,
    subTitle: item.subTitle ? filterTitleLabels(item.subTitle) : item.subTitle,
    content: item.content ? filterBodyLabels(item.content) : item.content,
  }));
}

/**
 * 检查文案是否包含标识文字
 * @param content - 文案内容
 * @returns 是否包含标识文字
 */
export function hasContentLabels(content: string): boolean {
  if (!content) return false;

  const patterns = [
    /【标题】/,
    /【正文】/,
    /【核心卖点】/,
    /【真实体验】/,
    /【小贴士】/,
    /^标题 [：:]/m,
    /^正文 [：:]/m,
    /^核心卖点 [：:]/m,
  ];

  return patterns.some(pattern => pattern.test(content));
}

/**
 * 从文案中分离标题和正文
 * @param content - 完整文案内容
 * @returns 分离后的标题和正文
 */
export function separateTitleAndBody(content: string): { title: string; body: string } {
  if (!content) {
    return { title: '', body: '' };
  }

  // 先过滤标识
  const filtered = filterContentLabels(content);
  
  // 按换行分割
  const lines = filtered.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { title: '', body: '' };
  }
  
  if (lines.length === 1) {
    // 只有一行，作为标题
    return { title: lines[0], body: '' };
  }
  
  // 第一行作为标题，其余作为正文
  const title = lines[0];
  const body = lines.slice(1).join('\n');
  
  return { title, body };
}

/**
 * 智能分离标题和正文（考虑 emoji 和长度）
 * @param content - 完整文案内容
 * @returns 分离后的标题和正文
 */
export function smartSeparateTitleAndBody(content: string): { title: string; body: string } {
  if (!content) {
    return { title: '', body: '' };
  }

  // 先过滤标识
  const filtered = filterContentLabels(content);
  
  // 按换行分割
  const lines = filtered.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { title: '', body: '' };
  }
  
  if (lines.length === 1) {
    // 只有一行，作为标题
    return { title: lines[0], body: '' };
  }
  
  // 第一行作为标题
  let title = lines[0];
  
  // 如果第一行太短（少于 5 个字符，不含 emoji），可能需要合并第二行
  const titleWithoutEmoji = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
  if (titleWithoutEmoji.length < 5 && lines.length > 1) {
    // 检查第二行是否也很短
    const secondLine = lines[1];
    const secondWithoutEmoji = secondLine.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    if (secondWithoutEmoji.length < 20) {
      // 合并前两行作为标题
      title = `${title} ${secondLine}`;
      const body = lines.slice(2).join('\n');
      return { title, body };
    }
  }
  
  // 正常情况：第一行是标题，其余是正文
  const body = lines.slice(1).join('\n');
  
  return { title, body };
}
